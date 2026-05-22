from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder="../frontend")
CORS(app)

# MongoDB Connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "devops_leave_management")

# In-memory fallback
in_memory_leaves = []

try:
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = mongo_client[DB_NAME]
    leaves_collection = db["leaves"]

    # Test MongoDB connection
    mongo_client.server_info()

    print("✓ Connected to MongoDB")
    use_mongodb = True

except Exception as e:
    print(f"⚠ MongoDB not available: {e}")
    print("⚠ Using in-memory storage instead")

    mongo_client = None
    db = None
    leaves_collection = None
    use_mongodb = False

# ---------------- HOME PAGE ----------------

@app.route("/")
def home():
    return send_from_directory("../frontend", "index.html")

# ---------------- APPLY PAGE ----------------

@app.route("/apply")
def apply():
    return send_from_directory("../frontend", "apply.html")

# ---------------- DASHBOARD PAGE ----------------

@app.route("/dashboard")
def dashboard():
    return send_from_directory("../frontend", "dashboard.html")

# ---------------- ABOUT PAGE ----------------

@app.route("/about")
def about():
    return send_from_directory("../frontend", "about.html")

# ---------------- CSS ----------------

@app.route("/style.css")
def style():
    return send_from_directory("../frontend", "style.css")

# ---------------- JS ----------------

@app.route("/script.js")
def script():
    return send_from_directory("../frontend", "script.js")

# ---------------- SUBMIT LEAVE ----------------

@app.route("/submit_leave", methods=["POST"])
def submit_leave():

    try:
        data = request.get_json()

        print("Apply route hit")
        print(data)

        leave_data = {
            "name": data.get("name"),
            "fromDate": data.get("fromDate"),
            "toDate": data.get("toDate"),
            "reason": data.get("reason")
        }

        # Save in MongoDB if available
        if use_mongodb:
            leaves_collection.insert_one(leave_data)

        # Otherwise use temporary memory
        else:
            in_memory_leaves.append(leave_data)

        return jsonify({
            "success": True,
            "message": "Leave application submitted successfully"
        })

    except Exception as e:
        print("ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": str(e)
    try:

            leaves = list(leaves_collection.find({}, {"_id": 0}))

        else:


    except Exception as e:
            "message": str(e)
        }), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)# ---------------- RUN APP ----------------
            "success": False,
        return jsonify({
        return jsonify(leaves)
            leaves = in_memory_leaves
        if use_mongodb:

