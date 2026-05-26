from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import os
from dotenv import load_dotenv, find_dotenv
from datetime import datetime

dotenv_path = find_dotenv()
if dotenv_path:
    load_dotenv(dotenv_path)
    print(f"✓ Loaded environment from {dotenv_path}")
else:
    print("⚠ .env file not found; relying on environment variables only")

app = Flask(__name__, static_folder="../frontend")
CORS(app)

# MongoDB Atlas Connection
MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    raise EnvironmentError("MONGODB_URI is not set in the environment or .env file")

DB_NAME = os.getenv("DB_NAME", "mydata")
print(f"✓ MongoDB settings: DB_NAME={DB_NAME}")

# In-memory session tracking only
in_memory_sessions = {}

try:
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)

    # Test connection
    mongo_client.server_info()

    db = mongo_client[DB_NAME]
    leaves_collection = db["leaves"]
    users_collection = db["users"]

    print("✓ Connected to MongoDB")

    use_mongodb = True

    # Seed default users if not present
    default_users = [
        {"role": "manager", "email": "manager1@gmail.com", "password": "mgr@123", "name": "IT Manager"},
        {"role": "employee", "email": "employee1@gmail.com", "password": "emp@123", "name": "Employee One"},
        {"role": "employee", "email": "employee2@gmail.com", "password": "emp@123", "name": "Employee Two"},
        {"role": "employee", "email": "employee3@gmail.com", "password": "emp@123", "name": "Employee Three"},
        {"role": "employee", "email": "employee4@gmail.com", "password": "emp@123", "name": "Employee Four"}
    ]

    for user in default_users:
        users_collection.update_one(
            {"email": user["email"]},
            {"$set": user},
            upsert=True
        )

except Exception as e:
    print(f"⚠ MongoDB not available: {e}")
    print("⚠ The application requires MongoDB Atlas to run")
    raise

# ---------------- LOGIN ----------------

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")
        role = data.get("role", "employee")

        print(f"Login attempt - Email: {email}, Role: {role}")

        if role not in ["employee", "manager"]:
            return jsonify({"success": False, "message": "Invalid role"}), 400

        if not use_mongodb or users_collection is None:
            raise Exception("MongoDB Atlas is required for authentication")

        user = users_collection.find_one(
            {"email": email, "password": password, "role": role},
            {"_id": 0}
        )

        if not user:
            return jsonify({"success": False, "message": "Invalid email or password"}), 401

        session_id = f"{email}_{datetime.now().timestamp()}"
        in_memory_sessions[session_id] = {
            "email": email,
            "role": role,
            "name": user.get("name", "Employee" if role == "employee" else "Manager"),
            "logged_in_at": datetime.now().isoformat()
        }

        print(f"✓ Login successful - Session ID: {session_id}")

        return jsonify({
            "success": True,
            "message": "Login successful",
            "session_id": session_id,
            "role": role,
            "email": email
        })

    except Exception as e:
        print(f"ERROR in /login: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# ----------------HOME ----------------

@app.route("/")
def home():
    return send_from_directory("../frontend", "login.html")

# -------- LOGIN PAGE --------

@app.route("/login.html")
def login_page():
    return send_from_directory("../frontend", "login.html")

# -------- EMPLOYEE DASHBOARD --------

@app.route("/employee-dashboard")
def employee_dashboard():
    return send_from_directory("../frontend", "employee-dashboard.html")

# -------- MANAGER DASHBOARD --------

@app.route("/manager-dashboard")
def manager_dashboard():
    return send_from_directory("../frontend", "manager-dashboard.html")

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

# ---------------- CONTACT ----------------
@app.route("/contact")
def contact():
    return send_from_directory("../frontend", "contact.html")

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
        session_id = data.get("session_id")

        print("="*50)
        print("POST /submit_leave - Request received")
        print(f"Request data: {data}")

        if not session_id or session_id not in in_memory_sessions:
            return jsonify({"success": False, "message": "Unauthorized"}), 401

        employee_email = in_memory_sessions[session_id]["email"]

        leave_data = {
            "id": f"leave_{datetime.now().timestamp()}",
            "employee_email": employee_email,
            "name": data.get("name"),
            "fromDate": data.get("fromDate"),
            "toDate": data.get("toDate"),
            "reason": data.get("reason"),
            "status": "Pending",
            "submitted_at": datetime.now().isoformat(),
            "manager_notes": ""
        }
        
        print(f"Leave data to store: {leave_data}")

        if not use_mongodb or leaves_collection is None:
            raise Exception("MongoDB Atlas is required for leave storage")

        print("Saving to MongoDB")
        leaves_collection.insert_one(leave_data)
        print("✓ Saved to MongoDB")
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
        session_id = request.args.get("session_id")
        role = request.args.get("role", "employee")

        if not use_mongodb or leaves_collection is None:
            raise Exception("MongoDB Atlas is required to retrieve leave data")

        leaves = list(leaves_collection.find({}, {"_id": 0}))

        # Filter based on role
        if role == "employee" and session_id in in_memory_sessions:
            employee_email = in_memory_sessions[session_id]["email"]
            leaves = [l for l in leaves if l.get("employee_email") == employee_email]

        print(f"GET /get_leaves - Role: {role}, Returning {len(leaves)} leaves")
        
        return jsonify(leaves)

    except Exception as e:
        print(f"ERROR in /get_leaves: {str(e)}")
        
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ---------------- APPROVE LEAVE ----------------

@app.route("/approve_leave", methods=["POST"])
def approve_leave():
    try:
        data = request.get_json()
        leave_id = data.get("leave_id")
        session_id = data.get("session_id")
        manager_notes = data.get("manager_notes", "")

        print(f"APPROVE LEAVE - Leave ID: {leave_id}, Session: {session_id}")

        if session_id not in in_memory_sessions:
            return jsonify({"success": False, "message": "Unauthorized"}), 401

        session = in_memory_sessions[session_id]
        if session["role"] != "manager":
            return jsonify({"success": False, "message": "Only managers can approve leaves"}), 403

        if not use_mongodb or leaves_collection is None:
            raise Exception("MongoDB Atlas is required to approve leave applications")

        leaves_collection.update_one(
            {"id": leave_id},
            {"$set": {
                "status": "Approved",
                "manager_notes": manager_notes,
                "approved_at": datetime.now().isoformat()
            }}
        )

        print(f"✓ Leave {leave_id} approved")

        return jsonify({
            "success": True,
            "message": "Leave approved successfully"
        })

    except Exception as e:
        print(f"ERROR in /approve_leave: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# ---------------- REJECT LEAVE ----------------

@app.route("/reject_leave", methods=["POST"])
def reject_leave():
    try:
        data = request.get_json()
        leave_id = data.get("leave_id")
        session_id = data.get("session_id")
        manager_notes = data.get("manager_notes", "")

        print(f"REJECT LEAVE - Leave ID: {leave_id}, Session: {session_id}")

        if session_id not in in_memory_sessions:
            return jsonify({"success": False, "message": "Unauthorized"}), 401

        session = in_memory_sessions[session_id]
        if session["role"] != "manager":
            return jsonify({"success": False, "message": "Only managers can reject leaves"}), 403

        if not use_mongodb or leaves_collection is None:
            raise Exception("MongoDB Atlas is required to reject leave applications")

        leaves_collection.update_one(
            {"id": leave_id},
            {"$set": {
                "status": "Rejected",
                "manager_notes": manager_notes,
                "rejected_at": datetime.now().isoformat()
            }}
        )

        print(f"✓ Leave {leave_id} rejected")

        return jsonify({
            "success": True,
            "message": "Leave rejected successfully"
        })

    except Exception as e:
        print(f"ERROR in /reject_leave: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500

# ---------------- RUN APP ----------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
