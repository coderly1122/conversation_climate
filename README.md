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
| Authentication | JWT, bycript js |
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
│ └── app.js # Legacy frontend logic (reference only)
│
├── backend/
│ ├── server.js # Express server with API endpoints
│ ├── package.json # Backend dependencies
│ ├── package-lock.json # Lock file
│ ├── .env.example # Environment variables template
│ └── node_modules/ # Installed dependencies (git ignored)
│
├── .gitignore # Git ignore rules
└── README.md # This file

---

## Setup & Installation

### Prerequisites
- **Node.js** (v16+)
- **MongoDB** (running locally on port 27017)

### Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` with your configuration:
   ```
   JWT_SECRET=your_secure_jwt_secret_key_here
   MONGODB_URI=mongodb://localhost:27017/conversation_climate
   PORT=3000
   NODE_ENV=development
   ```
5. Start the server:
   ```bash
   npm start       # Production
   npm run dev     # Development (with auto-reload)
   ```

### Frontend
- Simply open `index.html` in your browser (no build step required)
- The app will connect to `http://localhost:3000` for the backend

### Verify Setup
Once both are running, you should see:
```
✅ Connected to MongoDB
✅ Server running on http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/status | Health check | No |
| POST | /api/auth/signup | Register a new user | No |
| POST | /api/auth/login | Log in and receive JWT token | No |
| POST | /api/meetings/save | Save meeting report | Yes (Bearer Token) |
| GET | /api/meetings/history | Get user's past reports | Yes (Bearer Token) |

---

## Testing

- **Frontend**: Open `index.html` in your browser and test the UI flows manually.
- **Backend API**: Use Postman, curl, or similar tools to test endpoints.
- **Environment Variables**: Make sure `.env` is properly configured before starting the server.

---
