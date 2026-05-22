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

    # Test connection
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

        print("="*50)
        print("POST /submit_leave - Request received")
        print(f"Request data: {data}")

        leave_data = {
            "name": data.get("name"),
            "fromDate": data.get("fromDate"),
            "toDate": data.get("toDate"),
            "reason": data.get("reason"),
            "status": "Pending"
        }
        
        print(f"Leave data to store: {leave_data}")

        # Save to MongoDB
        if use_mongodb:
            print("Saving to MongoDB")
            leaves_collection.insert_one(leave_data)
            print("✓ Saved to MongoDB")

        # Save in memory
        else:
            print("Saving to in-memory storage")
            in_memory_leaves.append(leave_data)
            print(f"✓ Saved to in-memory storage. Total leaves: {len(in_memory_leaves)}")
            print(f"Current in_memory_leaves: {in_memory_leaves}")

        print("="*50)
        
        return jsonify({
            "success": True,
            "message": "Leave application submitted successfully"
        })

    except Exception as e:

        print("="*50)
        print("ERROR in /submit_leave:", str(e))
        print("="*50)

        return jsonify({
            "success": False,
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

        print(f"GET /get_leaves - Returning {len(leaves)} leaves")
        print(f"Leaves data: {leaves}")
        
        return jsonify(leaves)


    except Exception as e:
        print(f"ERROR in /get_leaves: {str(e)}")
        
        return jsonify({

            "success": False,
            "message": str(e)

        }), 500

# ---------------- RUN APP ----------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
