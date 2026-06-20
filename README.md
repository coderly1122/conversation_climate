# Conversation Climate

A full-stack web application that analyzes meeting dynamics in real-time. Detects speaking time, interruptions, and tone using microphone input. Built with Node.js, Express, MongoDB, and JavaScript.

---

## Features

- **User Authentication** – Sign up and log in securely with JWT tokens.
- **Real-time Voice Analysis** – Uses Web Audio API to detect speaking patterns.
- **Speaking Time Counter** – Tracks total speaking seconds during a session.
- **Interruption Detection** – Detects volume spikes that indicate interruptions.
- **Volume Meter** – Visual feedback for voice intensity.
- **Save Reports to Cloud** – Stores meeting data in MongoDB.
- **Download PDF Reports** – Generates a professional PDF summary of the session.
- **Privacy First** – No audio is recorded or stored. All processing happens locally.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, JavaScript (vanilla) |
| Backend | Node.js, Express.js |
| Database | MongoDB (local) |
| Authentication | JWT, bcryptjs |
| Audio Processing | Web Audio API |
| PDF Generation | jsPDF |
| API Testing | Postman |
| Version Control | Git, GitHub |

---

## Project Structure
conversation_climate/
│
├── index.html # Landing page
├── analysis.html # Voice analysis page (login + audio)
├── landing-style.css # Styles for landing page
│
├── css/
│ └── style.css # Styles for analysis page
│
├── js/
│ └── app.js # All frontend logic
│
├── backend/
│ ├── server.js # Express server with API endpoints
│ ├── package.json # Dependencies
│ └── package-lock.json # Lock file
│
├── conversation_climate_api.json # Postman collection
└── README.md # This file

API Endpoints

Method    Endpoint                   Description                    Auth Required
--------  -------------------------  -----------------------------  --------------
GET       /api/status                Health check                     No
POST      /api/auth/signup           Register a new user              No
POST      /api/auth/login            Log in and receive JWT token     No
POST      /api/meetings/save         Save meeting report              Yes (Bearer Token)
GET       /api/meetings/history      Get user's past reports          Yes (Bearer Token)