"""
EarthPulse Authentication & Role-Based Access Control (RBAC) Service
Provides JWT encoding/decoding, password hashing, and role inspection decorators.
Roles: 'viewer', 'analyst', 'admin'.
"""
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from backend.config import Config
from backend.database.mongo import get_db

def create_access_token(user_data: dict, expires_in_hours: int = 24) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_data["username"],
        "role": user_data.get("role", "viewer"),
        "email": user_data.get("email"),
        "full_name": user_data.get("full_name"),
        "exp": now + timedelta(hours=expires_in_hours),
        "iat": now
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_current_user_from_request():
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    return decode_access_token(token)

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user_from_request()
        if not user:
            return jsonify({"error": "Authentication required. Invalid or missing token."}), 401
        request.current_user = user
        return f(*args, **kwargs)
    return decorated

def require_role(allowed_roles):
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            user = get_current_user_from_request()
            if not user:
                return jsonify({"error": "Authentication required."}), 401
            user_role = user.get("role", "viewer")
            if user_role not in allowed_roles:
                return jsonify({
                    "error": f"Access denied. Requires one of roles: {allowed_roles}. Current role: '{user_role}'"
                }), 403
            request.current_user = user
            return f(*args, **kwargs)
        return decorated
    return decorator
