from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
import os
import json

app = Flask(__name__, static_folder="../frontend")
CORS(app)

# In-memory storage for leaves (in production, use a database)
leaves = []

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
    return jsonify(leaves)

@app.route("/api/leave", methods=["POST"])
def add_leave():
    data = request.get_json()
    leave = {
        "id": len(leaves) + 1,
        "name": data["name"],
        "fromDate": data["fromDate"],
        "toDate": data["toDate"],
        "reason": data["reason"],
        "status": "pending"  # pending, approved, rejected
    }
    leaves.append(leave)
    return jsonify(leave), 201

@app.route("/api/leave/<int:leave_id>", methods=["PUT"])
def update_leave(leave_id):
    data = request.get_json()
    for leave in leaves:
        if leave["id"] == leave_id:
            leave["status"] = data.get("status", leave["status"])
            return jsonify(leave)
    return jsonify({"error": "Leave not found"}), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)