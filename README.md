# Leave Management App

A simple leave request application with a Flask backend and a static frontend served by Nginx.

## Run locally

1. Build and start services:
   ```bash
   docker-compose up --build
   ```
2. Open http://localhost in your browser.
3. The API is available at http://localhost:5000/api/leave.

## Backend

- Source: backend/app.py
- Dependencies: backend/requirements.txt

## Frontend

- frontend/index.html
- frontend/script.js
- frontend/style.css

## Jenkins

The pipeline is defined in jenkinsfile.
