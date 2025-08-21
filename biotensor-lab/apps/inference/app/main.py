from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
import numpy as np
import os

class PredictIn(BaseModel):
    features: list[float]
    modelVersion: str | None = None

class PredictOut(BaseModel):
    score: float
    modelVersion: str

API_KEY = os.getenv("API_KEY", "dev-key")

app = FastAPI(title="BioTensor Inference")

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/predict", response_model=PredictOut)
def predict(payload: PredictIn, x_api_key: str | None = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="unauthorized")
    arr = np.array(payload.features, dtype=float)
    base = float(arr.mean()) if arr.size else 0.0
    noise = float(np.random.default_rng().normal(0, 0.01))
    score = max(0.0, min(1.0, base + 0.5 + noise))
    version = payload.modelVersion or "demo-1"
    return {"score": score, "modelVersion": version}