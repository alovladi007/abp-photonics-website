from fastapi import FastAPI, HTTPException, BackgroundTasks, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import redis
from rq import Queue
from prometheus_client import make_asgi_app, Counter, Histogram, Gauge
import time
import logging
from typing import Optional
import httpx
import hashlib
import hmac
import json

from .settings import settings
from .webhook import send_webhook
from ..pipeline.registry import ModelRegistry
from ..worker.jobs import process_inference_job
from ..pipeline.metrics import update_metrics

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Metrics
inference_requests = Counter('inference_requests_total', 'Total inference requests')
inference_duration = Histogram('inference_duration_seconds', 'Inference duration')
inference_queue_size = Gauge('inference_queue_size', 'Current queue size')
active_jobs = Gauge('active_inference_jobs', 'Currently active jobs')

# Initialize services
redis_client = redis.from_url(settings.REDIS_URL)
inference_queue = Queue('inference_queue', connection=redis_client)
model_registry = ModelRegistry()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("Starting inference service...")
    # Load models on startup
    await model_registry.initialize()
    yield
    logger.info("Shutting down inference service...")

app = FastAPI(
    title="MediMetrics Inference Service",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(','),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

class InferenceRequest:
    def __init__(
        self,
        job_id: str,
        study_id: str,
        model: str,
        model_version: str = "latest",
        priority: str = "NORMAL",
        parameters: dict = None,
        images: list = None,
        callback_url: str = None
    ):
        self.job_id = job_id
        self.study_id = study_id
        self.model = model
        self.model_version = model_version
        self.priority = priority
        self.parameters = parameters or {}
        self.images = images or []
        self.callback_url = callback_url

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        redis_client.ping()
        redis_healthy = True
    except:
        redis_healthy = False
    
    return {
        "status": "healthy" if redis_healthy else "degraded",
        "redis": redis_healthy,
        "models_loaded": model_registry.is_initialized,
        "queue_size": inference_queue.count
    }

@app.post("/v1/jobs")
async def enqueue_job(
    request: InferenceRequest,
    background_tasks: BackgroundTasks,
    x_api_key: Optional[str] = Header(None)
):
    """Enqueue a new inference job"""
    
    # Validate API key if configured
    if settings.API_KEY and x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Validate model exists
    if not model_registry.has_model(request.model):
        raise HTTPException(
            status_code=400,
            detail=f"Model {request.model} not found"
        )
    
    # Check queue size limit
    if inference_queue.count > settings.MAX_QUEUE_SIZE:
        raise HTTPException(
            status_code=503,
            detail="Queue is full, please try again later"
        )
    
    try:
        # Enqueue job
        job = inference_queue.enqueue(
            process_inference_job,
            args=(request.dict(),),
            job_id=request.job_id,
            job_timeout=settings.JOB_TIMEOUT,
            result_ttl=settings.RESULT_TTL,
            failure_ttl=settings.FAILURE_TTL,
            depends_on=None,
            at_front=(request.priority == "URGENT")
        )
        
        # Update metrics
        inference_requests.inc()
        inference_queue_size.set(inference_queue.count)
        
        # Send initial webhook
        if request.callback_url:
            background_tasks.add_task(
                send_webhook,
                request.callback_url,
                {
                    "job_id": request.job_id,
                    "status": "QUEUED",
                    "progress": 0
                }
            )
        
        return {
            "job_id": request.job_id,
            "external_job_id": job.id,
            "status": "QUEUED",
            "position": job.get_position() or 1,
            "estimated_time": estimate_processing_time(request.model, len(request.images))
        }
        
    except Exception as e:
        logger.error(f"Failed to enqueue job: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to enqueue job")

@app.get("/v1/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get job status and results"""
    
    try:
        # Check Redis for job info
        job_key = f"job:{job_id}"
        job_data = redis_client.get(job_key)
        
        if job_data:
            return json.loads(job_data)
        
        # Check RQ job
        from rq.job import Job
        job = Job.fetch(job_id, connection=redis_client)
        
        if job.is_finished:
            status = "SUCCEEDED"
            result = job.result
        elif job.is_failed:
            status = "FAILED"
            result = {"error": str(job.exc_info)}
        elif job.is_started:
            status = "RUNNING"
            result = None
        else:
            status = "QUEUED"
            result = None
        
        response = {
            "job_id": job_id,
            "status": status,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "ended_at": job.ended_at.isoformat() if job.ended_at else None,
            "result": result
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to get job status: {str(e)}")
        raise HTTPException(status_code=404, detail="Job not found")

@app.delete("/v1/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a queued or running job"""
    
    try:
        from rq.job import Job
        job = Job.fetch(job_id, connection=redis_client)
        
        if job.is_finished or job.is_failed:
            raise HTTPException(
                status_code=400,
                detail="Cannot cancel completed job"
            )
        
        job.cancel()
        
        return {"message": "Job cancelled successfully"}
        
    except Exception as e:
        logger.error(f"Failed to cancel job: {str(e)}")
        raise HTTPException(status_code=404, detail="Job not found")

@app.get("/v1/models")
async def list_models():
    """List available models"""
    
    models = model_registry.list_models()
    return {
        "models": models,
        "count": len(models)
    }

@app.get("/v1/models/{model_name}")
async def get_model_info(model_name: str):
    """Get model information"""
    
    if not model_registry.has_model(model_name):
        raise HTTPException(status_code=404, detail="Model not found")
    
    info = model_registry.get_model_info(model_name)
    return info

@app.post("/v1/webhook")
async def receive_webhook(
    payload: dict,
    x_signature: Optional[str] = Header(None)
):
    """Receive webhook callbacks (for testing)"""
    
    # Verify signature if configured
    if settings.WEBHOOK_HMAC_SECRET:
        expected_sig = hmac.new(
            settings.WEBHOOK_HMAC_SECRET.encode(),
            json.dumps(payload).encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(x_signature or "", expected_sig):
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    logger.info(f"Received webhook: {payload}")
    return {"status": "received"}

def estimate_processing_time(model: str, image_count: int) -> int:
    """Estimate processing time in seconds"""
    
    base_times = {
        "densenet121_chex": 30,
        "unet_segmentation": 45,
        "ensemble": 60
    }
    
    per_image_time = 5
    base = base_times.get(model, 30)
    
    return base + (image_count * per_image_time)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )