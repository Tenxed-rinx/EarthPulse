"""
EarthPulse Authentication API Routes
Handles user registration, authentication, token issuance, and admin user role administration.
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash, generate_password_hash
from backend.database.mongo import get_db
from backend.services.auth_service import create_access_token, require_auth, require_role

auth_bp = Blueprint("auth_bp", __name__, url_prefix="/api/auth")

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"error": "Username and password are required."}), 400

    db = get_db()
    user = db["users"].find_one({"username": username})
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid username or password."}), 401

    token = create_access_token(user)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "full_name": user.get("full_name")
        }
    }), 200

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    username = data.get("username", "").strip().lower()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    requested_role = data.get("role", "viewer")

    # Security rule: Public registration defaults to 'viewer' or 'analyst'; 'admin' cannot self-register
    if requested_role not in ["viewer", "analyst"]:
        requested_role = "viewer"

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required."}), 400

    db = get_db()
    if db["users"].find_one({"$or": [{"username": username}, {"email": email}]}):
        return jsonify({"error": "Username or email is already registered."}), 409

    new_user = {
        "username": username,
        "email": email,
        "password_hash": generate_password_hash(password),
        "role": requested_role,
        "full_name": full_name or username.capitalize(),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }
    db["users"].insert_one(new_user)
    token = create_access_token(new_user)

    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "user": {
            "username": new_user["username"],
            "email": new_user["email"],
            "role": new_user["role"],
            "full_name": new_user["full_name"]
        }
    }), 201

@auth_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    user = getattr(request, "current_user", None)
    return jsonify({"user": user}), 200

@auth_bp.route("/users", methods=["GET"])
@require_role("admin")
def list_users():
    db = get_db()
    users = list(db["users"].find({}, {"_id": 0, "password_hash": 0}))
    return jsonify({"users": users}), 200

@auth_bp.route("/users/<username>/role", methods=["PUT"])
@require_role("admin")
def update_user_role(username):
    data = request.get_json() or {}
    new_role = data.get("role")
    if new_role not in ["viewer", "analyst", "admin"]:
        return jsonify({"error": "Invalid role specified."}), 400

    db = get_db()
    res = db["users"].update_one({"username": username}, {"$set": {"role": new_role}})
    if res.matched_count == 0:
        return jsonify({"error": "User not found."}), 404

    return jsonify({"message": f"User {username} role updated to {new_role}"}), 200
