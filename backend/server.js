const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/conversation_climate')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB error:', err));

// ========== USER SCHEMA ==========
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ========== REPORT SCHEMA ==========
const reportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    speakingTime: { type: Number, default: 0 },
    interruptionCount: { type: Number, default: 0 },
    sessionDuration: { type: Number, default: 0 },
    interruptionLog: { type: Array, default: [] },
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// ========== API ENDPOINTS ==========

// 1. Health Check
app.get('/api/status', (req, res) => {
    res.json({ message: 'Server running', status: 'ok' });
});

// 2. Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret_key');
        res.status(201).json({ message: 'User created', token, userId: user._id, name: user.name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign({ userId: user._id }, 'your_jwt_secret_key');
        res.json({ message: 'Login successful', token, userId: user._id, name: user.name });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Save Meeting Report
app.post('/api/meetings/save', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, 'your_jwt_secret_key');
        const { speakingTime, interruptionCount, sessionDuration, interruptionLog } = req.body;
        
        const report = new Report({
            userId: decoded.userId,
            speakingTime,
            interruptionCount,
            sessionDuration,
            interruptionLog
        });
        
        await report.save();
        res.status(201).json({ message: 'Report saved', reportId: report._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Get Meeting History
app.get('/api/meetings/history', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, 'your_jwt_secret_key');
        const reports = await Report.find({ userId: decoded.userId }).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(3000, () => {
    console.log('✅ Server running on http://localhost:3000');
});