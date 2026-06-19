from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import joblib
from datetime import datetime
from database import prediction_collection

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ML Model
model = joblib.load("model/congestion_model_clean.pkl")

@app.get("/")
def home():
    return {
        "status": "AI Congestion Server Running"
    }

@app.post("/predict")
def predict(data: dict):
    hour = int(data["hour"])
    peak_hour = 1 if hour in [8, 9, 10, 17, 18, 19, 20] else 0
    duration = float(data["duration"])
    road_closure = int(data["requires_road_closure"])

    df = pd.DataFrame([{
        "event_type": data["event_type"],
        "event_cause": data["event_cause"],
        "zone": data["zone"],
        "requires_road_closure": road_closure,
        "duration": duration,
        "hour": hour,
        "day": 0,
        "peak_hour": peak_hour,
        "zone_frequency": 1,
        "duration_risk": duration * peak_hour,
        "closure_duration": road_closure * duration
    }])

    prediction = model.predict(df)[0]
    confidence = max(model.predict_proba(df)[0]) * 100

    if prediction == "HIGH":
        plan = {
            "police": 15,
            "marshals": 8,
            "barricades": 10,
            "diversion": "Activate alternate route immediately"
        }
    elif prediction == "MEDIUM":
        plan = {
            "police": 8,
            "marshals": 4,
            "barricades": 5,
            "diversion": "Partial diversion near junctions"
        }
    else:
        plan = {
            "police": 3,
            "marshals": 2,
            "barricades": 2,
            "diversion": "Normal monitoring"
        }

    prediction_collection.insert_one({
        "timestamp": datetime.now(),
        "event_type": data["event_type"],
        "event_cause": data["event_cause"],
        "zone": data["zone"],
        "requires_road_closure": road_closure,
        "duration": duration,
        "hour": hour,
        "risk": prediction,
        "confidence": round(float(confidence), 2),
        "police": plan["police"],
        "marshals": plan["marshals"],
        "barricades": plan["barricades"],
        "diversion": plan["diversion"]
    })

    return {
        "risk": prediction,
        "confidence": round(float(confidence), 2),
        "plan": plan
    }

@app.get("/history")
def history():
    data = list(
        prediction_collection.find({})
        .sort("_id", -1)
        .limit(20)
    )

    for item in data:
        item["_id"] = str(item["_id"])
        if "timestamp" in item:
            item["timestamp"] = item["timestamp"].strftime("%Y-%m-%d %H:%M")

    return data

@app.get("/analytics")
def analytics():
    events = list(prediction_collection.find({}))
    total = len(events)
    high = len([e for e in events if e.get("risk") == "HIGH"])

    confidence = 0
    if total:
        confidence = sum(e.get("confidence", 0) for e in events) / total

    zones = {}
    for e in events:
        zone = e.get("zone", "Unknown")
        zones[zone] = zones.get(zone, 0) + 1

    top_zone = "N/A"
    if zones:
        top_zone = max(zones, key=zones.get)

    return {
        "total_events": total,
        "high_risk": high,
        "avg_confidence": round(confidence, 2),
        "top_zone": top_zone
    }