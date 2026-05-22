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

# In-memory fallback storage
in_memory_leaves = []

try:
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)

    # Force connection test
    mongo_client.server_info()

    db = mongo_client[DB_NAME]
    leaves_collection = db["leaves"]

    print("✓ Connected to MongoDB")

    use_mongodb = True

except Exception as e:

    print(f"⚠ MongoDB not available: {e}")
    print("⚠ Using in-memory storage instead")

    mongo_client = None
    db = None
    leaves_collection = None

    use_mongodb = False

# ---------------- HOME ----------------

@app.route("/")
def home():
    return send_from_directory("../frontend", "index.html")

# ---------------- APPLY PAGE ----------------

@app.route("/apply")
def apply():
    return send_from_directory("../frontend", "apply.html")

# ---------------- DASHBOARD ----------------

@app.route("/dashboard")
def dashboard():
    return send_from_directory("../frontend", "dashboard.html")

# ---------------- ABOUT ----------------

@app.route("/about")
def about():
    return send_from_directory("../frontend", "about.html")

# ---------------- CSS ----------------

@app.route("/style.css")
def style():
# ---------------- JS ----------------
@app.route("/script.js")
def script():
# ---------------- SUBMIT LEAVE ----------------
@app.route("/submit_leave", methods=["POST"])
def submit_leave():

        data = request.get_json()
        leave_data = {
            "toDate": data.get("toDate"),
        }
        return jsonify({
            "message": "Leave application submitted successfully"
        })


        print("ERROR:", str(e))

        return jsonify({
            "message": str(e)
        }), 500

# ---------------- GET LEAVES ----------------

@app.route("/get_leaves", methods=["GET"])
def get_leaves():

    try:

        if use_mongodb:
            leaves = list(leaves_collection.find({}, {"_id": 0}))
        else:
            leaves = in_memory_leaves

        return jsonify(leaves)

    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ---------------- RUN APP ----------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)            "success": False,
    except Exception as e:
            "success": True,

            leaves_collection.insert_one(leave_data)
        else:
            in_memory_leaves.append(leave_data)

        # Save in memory

        # Save in MongoDB
        if use_mongodb:
            "reason": data.get("reason")
            "fromDate": data.get("fromDate"),
            "name": data.get("name"),
        print("Apply route hit")

        print(data)

    try:



    return send_from_directory("../frontend", "script.js")

