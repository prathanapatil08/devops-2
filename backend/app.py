from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="../frontend")
CORS(app)

# MongoDB Connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "devops_leave_management")

try:
    mongo_client = MongoClient(MONGODB_URI)
    db = mongo_client[DB_NAME]
    leaves_collection = db["leaves"]
    # Create index on id field for faster queries
    leaves_collection.create_index("leave_id")
    print("✓ Connected to MongoDB")
except Exception as e:
    print(f"✗ MongoDB connection failed: {e}")
    mongo_client = None
    db = None
    leaves_collection = None

# Home Route
@app.route("/")
def home():
    return send_from_directory("../frontend", "index.html")

@app.route("/apply")
def apply():
    return send_from_directory("../frontend", "apply.html")

@app.route("/dashboard")
def dashboard():
    return send_from_directory("../frontend", "dashboard.html")

@app.route("/about")
def about():
    return send_from_directory("../frontend", "about.html")

# CSS Route
@app.route("/style.css")
def style():
    return send_from_directory("../frontend", "style.css")

# JS Route
@app.route("/script.js")
def script():
    return send_from_directory("../frontend", "script.js")

# API Routes for Leave Management
@app.route("/api/leave", methods=["GET"])
def get_leaves():
    try:
        leaves = list(leaves_collection.find({}, {"_id": 0}))
        return jsonify(leaves)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/leave", methods=["POST"])
def add_leave():
    try:
        data = request.get_json()
        
        # Get the next leave_id
        last_leave = leaves_collection.find_one(sort=[("leave_id", -1)])
        next_id = (last_leave["leave_id"] + 1) if last_leave else 1
        
        leave = {
            "leave_id": next_id,
            "name": data["name"],
            "fromDate": data["fromDate"],
            "toDate": data["toDate"],
            "reason": data["reason"],
            "status": "pending"  # pending, approved, rejected
        }
        result = leaves_collection.insert_one(leave)
        leave["id"] = str(result.inserted_id)
        return jsonify(leave), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/leave/<int:leave_id>", methods=["PUT"])
def update_leave(leave_id):
    try:
        data = request.get_json()
        result = leaves_collection.find_one_and_update(
            {"leave_id": leave_id},
            {"$set": {"status": data.get("status")}},
            return_document=True
        )
        if result:
            result.pop("_id", None)
            return jsonify(result)
        return jsonify({"error": "Leave not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)