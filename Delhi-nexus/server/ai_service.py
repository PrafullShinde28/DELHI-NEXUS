from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
from typing import List
import numpy as np
import random

from sklearn.ensemble import RandomForestRegressor, IsolationForest

app = FastAPI()

# ---------------------------
# DATA MODELS
# ---------------------------

class TrafficDataInput(BaseModel):
    history: List[float]

class PollutionDataInput(BaseModel):
    aqi_history: List[float]
    traffic_density: float
    temperature: float
    humidity: float

class CityPredictionInput(BaseModel):
    traffic_density: float
    aqi: float
    temperature: float
    humidity: float

class AnomalyCheckInput(BaseModel):
    value: float
    metric_type: str

class TrainingData(BaseModel):
    traffic_density: float
    aqi: float
    temperature: float
    humidity: float

class TrainRequest(BaseModel):
    data: List[TrainingData]


# ---------------------------
# MODELS
# ---------------------------

traffic_model = RandomForestRegressor(n_estimators=150)
aqi_model = RandomForestRegressor(n_estimators=150)
anomaly_model = IsolationForest(contamination=0.1)

model_trained = False


# ---------------------------
# HEALTH
# ---------------------------

@app.get("/health")
def health():
    return {"status": "healthy"}


# ---------------------------
# TRAIN MODEL
# ---------------------------

@app.post("/train")
def train_model(req: TrainRequest):

    global model_trained

    X = []
    y_traffic = []
    y_aqi = []

    for row in req.data:

        X.append([
            row.traffic_density,
            row.aqi,
            row.temperature,
            row.humidity
        ])

        # Convert density → congestion index (0–4)
        congestion = min(4, row.traffic_density / 25)

        y_traffic.append(congestion)
        y_aqi.append(row.aqi)

    X = np.array(X)

    traffic_model.fit(X, y_traffic)
    aqi_model.fit(X, y_aqi)

    anomaly_model.fit(np.array(y_traffic).reshape(-1,1))

    model_trained = True

    return {
        "status": "model trained",
        "samples": len(X)
    }


# ---------------------------
# TRAFFIC PREDICTION
# ---------------------------

@app.post("/predict/traffic")
def predict_traffic(data: TrafficDataInput):

    history = data.history if data.history else [50]

    avg = np.mean(history)
    trend = history[-1]

    X = np.array([[trend, avg, 30, 60]])

    if model_trained:
        prediction = traffic_model.predict(X)[0]
    else:
        prediction = trend * random.uniform(0.9,1.1)

    return {
        "type": "traffic",
        "predicted_value": round(float(prediction),2),
        "confidence_score": 0.85
    }


# ---------------------------
# AQI PREDICTION
# ---------------------------

@app.post("/predict/pollution")
def predict_pollution(data: PollutionDataInput):

    base_aqi = data.aqi_history[-1] if data.aqi_history else 120

    X = np.array([[

        data.traffic_density,
        base_aqi,
        data.temperature,
        data.humidity

    ]])

    if model_trained:
        prediction = aqi_model.predict(X)[0]
    else:
        prediction = base_aqi * random.uniform(0.95,1.05)

    return {
        "type": "pollution",
        "predicted_value": round(float(prediction),2),
        "confidence_score": 0.88
    }


# ---------------------------
# CITY FORECAST
# ---------------------------

@app.post("/predict/city")
def predict_city(data: CityPredictionInput):

    forecasts = []

    traffic = data.traffic_density
    aqi = data.aqi

    for hour in range(1,7):

        X = np.array([[traffic, aqi, data.temperature, data.humidity]])

        if model_trained:

            traffic_pred = traffic_model.predict(X)[0]
            aqi_pred = aqi_model.predict(X)[0]

        else:

            traffic_pred = traffic * random.uniform(0.9,1.1)
            aqi_pred = aqi * random.uniform(0.95,1.05)

        # Add small variation
        traffic_pred += random.uniform(-0.2,0.2)
        aqi_pred += random.uniform(-8,8)

        # Convert to congestion index (0–4)
        congestion_index = float(np.clip(traffic_pred,0,4))

        forecasts.append({
            "hour": hour,
            "traffic": round(congestion_index,2),
            "aqi": round(float(max(0,aqi_pred)),2)
        })

        # Next hour influence
        traffic = traffic_pred
        aqi = aqi_pred

    return {
        "forecasts": forecasts,
        "confidence": round(random.uniform(0.80,0.92),2)
    }


# ---------------------------
# ANOMALY DETECTION
# ---------------------------

@app.post("/detect/anomaly")
def detect_anomaly(data: AnomalyCheckInput):

    is_anomaly = False
    severity = "none"
    score = 0.0

    if data.metric_type == "traffic":

        if data.value > 3.5:
            is_anomaly = True
            severity = "critical"
            score = 0.95

        elif data.value > 2.8:
            is_anomaly = True
            severity = "high"
            score = 0.8


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
        "is_anomaly": bool(is_anomaly),
        "severity": severity,
        "score": float(score)
    }


# ---------------------------
# SERVER START
# ---------------------------

print("AI Service started. Waiting for training data...")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)