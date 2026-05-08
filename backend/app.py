from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

leaves = []

@app.route('/api/leave', methods=['GET'])
def get_leaves():
    return jsonify(leaves)

@app.route('/api/leave', methods=['POST'])
def add_leave():
    data = request.json

    # basic validation
    if not data.get("name"):
        return jsonify({"error": "Name required"}), 400

    leaves.append(data)

    return jsonify({"message": "Leave added successfully"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)