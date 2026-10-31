from pymongo import MongoClient
from backend.config import Config

_client = None

def get_db():
    global _client
    if _client is None:
        _client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client[Config.DB_NAME]

def get_client():
    global _client
    if _client is None:
        _client = MongoClient(Config.MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client

def check_connection():
    try:
        client = get_client()
        client.admin.command('ping')
        return True, "MongoDB connected successfully"
    except Exception as e:
        return False, str(e)
