# Leave Management System

A comprehensive leave management application with multiple pages and interactive features. Built with Flask backend and modern HTML/CSS/JavaScript frontend.

## Features

- **Multi-page Website**: Home, Apply Leave, Dashboard, and About pages
- **Interactive Dashboard**: View, filter, and manage leave requests with approval/rejection functionality
- **Real-time Statistics**: Track pending, approved, and rejected leave requests
- **Responsive Design**: Mobile-friendly interface with modern UI
- **RESTful API**: Full CRUD operations for leave management

## Pages

- **Home (/)**: Welcome page with feature overview and navigation
- **Apply Leave (/apply)**: Form to submit new leave requests
- **Dashboard (/dashboard)**: Admin view to manage all leave requests with filtering and status updates
- **About (/about)**: Information about the system and its features

## Run Locally

1. **Using Docker**:
   ```bash
   docker-compose up --build
   ```

2. **Manual Setup**:
   ```bash
   # Install dependencies
   pip install -r backend/requirements.txt

   # Run the application
   python backend/app.py
   ```

3. Open http://localhost:5000 in your browser.

## API Endpoints

- `GET /api/leave` - Get all leave requests
- `POST /api/leave` - Create a new leave request
- `PUT /api/leave/<id>` - Update leave request status

## Project Structure

```
backend/
├── app.py              # Flask application with API routes
└── requirements.txt    # Python dependencies

frontend/
├── index.html          # Home page
├── apply.html          # Leave application form
├── dashboard.html      # Admin dashboard
├── about.html          # About page
├── script.js           # JavaScript functionality
└── style.css           # Styling and responsive design
```

## Technologies Used

- **Backend**: Python Flask, Flask-CORS
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Modern CSS with gradients, animations, and responsive design
- **API**: RESTful JSON API

## Jenkins

The pipeline is defined in jenkinsfile.
