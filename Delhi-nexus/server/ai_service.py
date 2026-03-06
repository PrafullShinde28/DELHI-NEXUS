from fastapi import FastAPI
from pydantic import BaseModel
import random
import uvicorn
from typing import List, Dict, Any

# Create FastAPI app
app = FastAPI()

# Pydantic models for request bodies
class TrafficDataInput(BaseModel):
    history: List[float]

class PollutionDataInput(BaseModel):
    aqi_history: List[float]
    traffic_density: float
    temperature: float
    humidity: float

class PredictionResponse(BaseModel):
    type: str
    predicted_value: float
    confidence_score: float
    details: Dict[str, Any] = {}

class AnomalyCheckInput(BaseModel):
    value: float
    metric_type: str # 'traffic' or 'aqi'

class AnomalyResponse(BaseModel):
    is_anomaly: bool
    severity: str
    score: float

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict/traffic")
def predict_traffic(data: TrafficDataInput):
    # Mock ARIMA model logic
    # In production, load a trained model (statsmodels)
    
    # Simple logic: assume trend continues with some noise
    last_val = data.history[-1] if data.history else 50.0
    
    # Simulate prediction (random fluctuation around last value)
    predicted_val = last_val * (1 + random.uniform(-0.1, 0.15))
    predicted_val = max(0, min(100, predicted_val)) # Clamp 0-100
    
    confidence = random.uniform(0.7, 0.95)
    
    return {
        "type": "traffic",
        "predicted_value": round(predicted_val, 2),
        "confidence_score": round(confidence, 2),
        "details": {"method": "ARIMA-Mock", "horizon": "1h"}
    }

@app.post("/predict/pollution")
def predict_pollution(data: PollutionDataInput):
    # Mock Random Forest logic
    # Higher traffic + low wind (not passed but assumed) + temp inversion = high AQI
    
    base_aqi = data.aqi_history[-1] if data.aqi_history else 100.0
    
    # Factors
    traffic_factor = data.traffic_density / 100.0 # 0.0 to 1.0
    weather_factor = 1.0
    if data.temperature > 30:
        weather_factor = 1.1 # Heat can increase ozone
    
    predicted_aqi = base_aqi * 0.8 + (traffic_factor * 50) + (random.uniform(-10, 20))
    predicted_aqi = max(0, predicted_aqi)
    
    return {
        "type": "pollution",
        "predicted_value": round(predicted_aqi, 2),
        "confidence_score": round(random.uniform(0.75, 0.9), 2),
        "details": {"method": "RandomForest-Mock", "drivers": ["traffic", "temp"]}
    }

@app.post("/detect/anomaly")
def detect_anomaly(data: AnomalyCheckInput):
    # Mock Isolation Forest logic
    # Uses a threshold based logic for this demo
    
    is_anomaly = False
    severity = "none"
    score = 0.0
    
    if data.metric_type == "traffic":
        if data.value > 85:
            is_anomaly = True
            severity = "high"
            score = 0.9
        elif data.value > 70:
            is_anomaly = True
            severity = "medium"
            score = 0.6
            
    elif data.metric_type == "aqi":
        if data.value > 300:
            is_anomaly = True
            severity = "critical"
            score = 0.95
        elif data.value > 200:
            is_anomaly = True
            severity = "high"
            score = 0.8
            
    return {
        "is_anomaly": is_anomaly,
        "severity": severity,
        "score": score
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
