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
from typing import Optional, Dict, Any, List
import httpx
import hashlib
import hmac
import json
import os
from pydantic import BaseModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment variables
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
API_KEY = os.getenv("API_KEY", "")
WEBHOOK_HMAC_SECRET = os.getenv("WEBHOOK_HMAC_SECRET", "secret")
MAX_QUEUE_SIZE = int(os.getenv("MAX_QUEUE_SIZE", "1000"))
PORT = int(os.getenv("PORT", "9200"))

# Metrics
inference_requests = Counter('inference_requests_total', 'Total inference requests')
inference_duration = Histogram('inference_duration_seconds', 'Inference duration')
inference_queue_size = Gauge('inference_queue_size', 'Current queue size')
active_jobs = Gauge('active_inference_jobs', 'Currently active jobs')

# Initialize services
redis_client = redis.from_url(REDIS_URL)
inference_queue = Queue('inference_queue', connection=redis_client)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("Starting inference service...")
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
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

class InferenceRequest(BaseModel):
    job_id: str
    study_id: str
    model: str
    model_version: str = "latest"
    priority: str = "NORMAL"
    parameters: Dict[str, Any] = {}
    images: List[Dict[str, Any]] = []
    callback_url: Optional[str] = None

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int = 0
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

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
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    # Check queue size limit
    if inference_queue.count > MAX_QUEUE_SIZE:
        raise HTTPException(
            status_code=503,
            detail="Queue is full, please try again later"
        )
    
    try:
        # For now, simulate job processing
        job_data = request.dict()
        
        # Store job in Redis
        redis_client.setex(
            f"job:{request.job_id}",
            3600,
            json.dumps({
                "status": "QUEUED",
                "progress": 0,
                "study_id": request.study_id,
                "model": request.model
            })
        )
        
        # Update metrics
        inference_requests.inc()
        inference_queue_size.set(inference_queue.count)
        
        # Send initial webhook if configured
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
            "status": "QUEUED",
            "position": 1,
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
        
        # Default response if job not found
        raise HTTPException(status_code=404, detail="Job not found")
        
    except Exception as e:
        logger.error(f"Failed to get job status: {str(e)}")
        raise HTTPException(status_code=404, detail="Job not found")

@app.delete("/v1/jobs/{job_id}")
async def cancel_job(job_id: str):
    """Cancel a queued or running job"""
    
    try:
        # Remove from Redis
        redis_client.delete(f"job:{job_id}")
        
        return {"message": "Job cancelled successfully"}
        
    except Exception as e:
        logger.error(f"Failed to cancel job: {str(e)}")
        raise HTTPException(status_code=404, detail="Job not found")

@app.get("/v1/models")
async def list_models():
    """List available models"""
    
    models = [
        {
            "name": "densenet121_chex",
            "version": "1.0.0",
            "type": "classification",
            "description": "CheXNet DenseNet121 for chest X-ray classification"
        },
        {
            "name": "unet_segmentation",
            "version": "1.0.0",
            "type": "segmentation",
            "description": "U-Net for medical image segmentation"
        },
        {
            "name": "ensemble",
            "version": "1.0.0",
            "type": "ensemble",
            "description": "Ensemble model combining multiple architectures"
        }
    ]
    
    return {
        "models": models,
        "count": len(models)
    }

@app.get("/v1/models/{model_name}")
async def get_model_info(model_name: str):
    """Get model information"""
    
    models_info = {
        "densenet121_chex": {
            "name": "densenet121_chex",
            "version": "1.0.0",
            "type": "classification",
            "input_size": [512, 512],
            "num_classes": 14,
            "diseases": [
                "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration",
                "Mass", "Nodule", "Pneumonia", "Pneumothorax",
                "Consolidation", "Edema", "Emphysema", "Fibrosis",
                "Pleural_Thickening", "Hernia"
            ],
            "performance": {
                "auroc": 0.841,
                "accuracy": 0.768
            }
        }
    }
    
    if model_name not in models_info:
        raise HTTPException(status_code=404, detail="Model not found")
    
    return models_info[model_name]

@app.post("/v1/webhook")
async def receive_webhook(
    payload: Dict[str, Any],
    x_signature: Optional[str] = Header(None)
):
    """Receive webhook callbacks (for testing)"""
    
    # Verify signature if configured
    if WEBHOOK_HMAC_SECRET:
        expected_sig = hmac.new(
            WEBHOOK_HMAC_SECRET.encode(),
            json.dumps(payload).encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(x_signature or "", expected_sig):
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    logger.info(f"Received webhook: {payload}")
    return {"status": "received"}

async def send_webhook(url: str, payload: Dict[str, Any]):
    """Send webhook notification"""
    try:
        signature = hmac.new(
            WEBHOOK_HMAC_SECRET.encode(),
            json.dumps(payload).encode(),
            hashlib.sha256
        ).hexdigest()
        
        async with httpx.AsyncClient() as client:
            await client.post(
                url,
                json=payload,
                headers={"X-Signature": signature}
            )
    except Exception as e:
        logger.error(f"Failed to send webhook: {str(e)}")

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
        port=PORT,
        reload=False,
        log_level="info"
    )