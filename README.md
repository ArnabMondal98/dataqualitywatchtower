📊 Data Quality Watchtower

Automated Data Reliability & Quality Engineering Platform

🚀 Live Demo: https://dataqualitywatchtower.vercel.app

🔧 Backend API: https://watchtower-api-njpj.onrender.com

📘 API Docs (Swagger): https://watchtower-api-njpj.onrender.com/docs

❤️ Health Check: https://watchtower-api-njpj.onrender.com/api/health

📌 Overview

Data Quality Watchtower is a full-stack, cloud-deployed platform designed to monitor, validate, and ensure data reliability across modern data pipelines.

It helps data teams:

Detect broken pipelines early

Catch silent data corruption

Monitor schema drift

Enforce data quality rules automatically

The system follows modern Data Reliability Engineering (DRE) principles and is inspired by the Medallion Architecture used in enterprise data platforms.

🏗️ System Architecture
┌──────────────────────────┐
│        Frontend          │
│  React + Tailwind (UI)   │
│  Deployed on Vercel      │
└─────────────┬────────────┘
              │ HTTPS (REST APIs)
              ▼
┌──────────────────────────┐
│        Backend API       │
│  FastAPI (Python)        │
│  Auth + Business Logic   │
│  Deployed on Render      │
└─────────────┬────────────┘
              │ MongoDB Driver
              ▼
┌──────────────────────────┐
│       MongoDB Atlas      │
│  Cloud NoSQL Database    │
│  Data Sources & Results  │
└──────────────────────────┘

🧰 Tech Stack
Frontend

React (Create React App + CRACO)

Tailwind CSS

shadcn/ui

Axios for API communication

Vercel (Free Tier)

Backend

FastAPI (Python)

JWT-based Authentication

CORS-enabled REST APIs

Render (Free Tier)

Database

MongoDB Atlas (Cloud)

Secure connection using environment variables

🔑 Key Features
✅ Authentication

User registration & login

JWT token-based authorization

Secure API access

📈 Data Source Management

Register and manage data sources

Store metadata centrally

🧬 Data Lineage

Track upstream & downstream dependencies

Visualize pipeline relationships

🧪 Data Quality Checks

Rule-based validations

Monitor data freshness, nulls, schema drift

❤️ System Health Monitoring

/api/health endpoint

Confirms backend + database connectivity in real time

🌍 Live Deployment URLs
Component	URL
Frontend : [dataqualitywatchtower.vercel.app](https://dataqualitywatchtower.vercel.app/)

Backend API	: https://watchtower-api-njpj.onrender.com

Swagger Docs : https://watchtower-api-njpj.onrender.com/docs

Health Check  : https://watchtower-api-njpj.onrender.com/api/health
🔐 Environment Variables
Frontend (Vercel)
REACT_APP_BACKEND_URL=https://watchtower-api-njpj.onrender.com

Backend (Render)
MONGO_URL=<your_mongodb_connection_string>
DB_NAME=<database_name>
JWT_SECRET=<secret_key>

⚠️ Secrets are never committed to GitHub.

## 📸 Screenshots

### Landing Page
![Landing Page](Screenshots/landing-page.png)

### Dashboard
![Dashboard](Screenshots/dashboard.png)

### API Health Check
![API Health](Screenshots/api-health.png)

### Swagger API Docs
![Swagger Docs](Screenshots/swagger-docs.png)

🧪 How to Run Locally
Frontend
cd frontend
npm install
npm start

Backend
cd backend
pip install -r requirements.txt
uvicorn server:app --reload

🧠 What This Project Demonstrates

End-to-end full-stack deployment

Cloud-native architecture

Secure environment variable management

API design & documentation

Real-world debugging of dependency & build issues

Production-ready CI/CD using Render + Vercel

👨‍💻 Author

Arnab Mondal
Data Analyst | Data Reliability & Analytics Enthusiast

GitHub: https://github.com/ArnabMondal98

LinkedIn: https://www.linkedin.com/in/arnab-mondal-108966244

⭐️ If you find this project useful

Please consider giving it a star ⭐ — it helps a lot!
