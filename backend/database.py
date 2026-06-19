from pymongo import MongoClient


client = MongoClient(
"mongodb+srv://event_ai:aB%40cD%2343%2421@event-congestion-db.ej6mur7.mongodb.net/?appName=event-congestion-db"
)


db = client["event-congestion-db"]
prediction_collection = db["predictions"]