// CONVERSATION CLIMATE - FULL BACKEND INTEGRATION
// Global variables
let mediaStream = null;
let audioContext = null;
let analyser = null;
let animationId = null;
let isRecording = false;
let isSpeaking = false;
let speakingSeconds = 0;
let intervalId = null;
let interruptionCount = 0;
let lastVolume = 0;
let interruptionCooldown = false;
let toneHistory = [];
let currentSessionData = null;
let authToken = null;
let currentUser = null;

// DOM elements - Auth
const authSection = document.getElementById('authSection');
const authTitle = document.getElementById('authTitle');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const signupName = document.getElementById('signupName');
const nameGroup = document.getElementById('nameGroup');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const switchAuth = document.getElementById('switchAuth');
const userInfo = document.getElementById('userInfo');
const userNameDisplay = document.getElementById('userNameDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const analysisCard = document.getElementById('analysisCard');

// DOM elements - Analysis
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const saveReportBtn = document.getElementById('saveReportBtn');
const speakingTimeSpan = document.getElementById('speakingTime');
const interruptionSpan = document.getElementById('interruptionCount');
const volumeValueSpan = document.getElementById('volumeValue');
const volumeFill = document.getElementById('volumeFill');
const pitchValueSpan = document.getElementById('pitchValue');
const statusText = document.getElementById('statusText');
const liveDot = document.getElementById('liveDot');
const liveLabel = document.getElementById('liveLabel');
const interruptionLogBody = document.getElementById('interruptionLogBody');
const toneTimeline = document.getElementById('toneTimeline');

let isLoginMode = true;
let interruptionLog = [];

// ========== AUTH FUNCTIONS ==========
function switchMode() {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        authTitle.innerText = 'Login';
        authSubmitBtn.innerText = 'Login';
        switchAuth.innerText = "Don't have an account? Sign up";
        nameGroup.style.display = 'none';
    } else {
        authTitle.innerText = 'Sign Up';
        authSubmitBtn.innerText = 'Sign Up';
        switchAuth.innerText = 'Already have an account? Login';
        nameGroup.style.display = 'block';
    }
}

async function handleAuth() {
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    if (!isLoginMode) {
        const name = signupName.value.trim();
        if (!name) {
            alert('Please enter your name');
            return;
        }
    }
    
    const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/signup';
    const body = isLoginMode 
        ? { email, password }
        : { name: signupName.value.trim(), email, password };
    
    try {
        const response = await fetch(`http://localhost:3000${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.error || 'Authentication failed');
            return;
        }
        
        authToken = data.token;
        currentUser = { id: data.userId, name: data.name };
        
        // Show user info and hide auth
        authSection.style.display = 'none';
        userInfo.style.display = 'flex';
        analysisCard.style.display = 'block';
        userNameDisplay.innerText = data.name;
        
        statusText.innerText = 'Logged in. Ready to start.';
        
    } catch (error) {
        alert('Connection error: ' + error.message);
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    isRecording = false;
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) audioContext.close();
    
    authSection.style.display = 'block';
    userInfo.style.display = 'none';
    analysisCard.style.display = 'none';
    authEmail.value = '';
    authPassword.value = '';
    if (signupName) signupName.value = '';
    isLoginMode = true;
    authTitle.innerText = 'Login';
    authSubmitBtn.innerText = 'Login';
    switchAuth.innerText = "Don't have an account? Sign up";
    nameGroup.style.display = 'none';
}

// ========== SAVE REPORT TO BACKEND ==========
async function saveReportToCloud() {
    if (!authToken) {
        alert('Please login first');
        return;
    }
    
    const sessionData = {
        speakingTime: speakingSeconds,
        interruptionCount: interruptionCount,
        sessionDuration: speakingSeconds,
        interruptionLog: interruptionLog.slice(0, 20)
    };
    
    try {
        const response = await fetch('http://localhost:3000/api/meetings/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(sessionData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            alert(data.error || 'Failed to save report');
            return;
        }
        
        alert(`✅ Report saved successfully!\nSpeaking: ${speakingSeconds}s\nInterruptions: ${interruptionCount}`);
        
    } catch (error) {
        alert('Error saving report: ' + error.message);
    }
}

// ========== AUDIO ANALYSIS FUNCTIONS ==========
function drawWaveform(dataArray) {
    const canvas = document.getElementById('waveformCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = '#1D9E75';
    ctx.lineWidth = 1.5;
    
    const sliceWidth = width / dataArray.length;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        const y = v * (height / 2) + (height / 2);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
    }
    ctx.stroke();
}

function estimatePitch(dataArray, sampleRate) {
    let maxCorr = 0, maxLag = 0;
    for (let lag = 20; lag < 300; lag++) {
        let corr = 0;
        for (let i = 0; i < dataArray.length - lag; i++) {
            const v1 = (dataArray[i] - 128) / 128;
            const v2 = (dataArray[i + lag] - 128) / 128;
            corr += v1 * v2;
        }
        if (corr > maxCorr) { maxCorr = corr; maxLag = lag; }
    }
    if (maxLag > 0 && maxCorr > 30) {
        return Math.min(500, Math.max(80, Math.round(sampleRate / maxLag)));
    }
    return 0;
}

function updateTonePills(volume, pitch) {
    const pillCalm = document.getElementById('pillCalm');
    const pillNeutral = document.getElementById('pillNeutral');
    const pillTense = document.getElementById('pillTense');
    
    pillCalm.classList.remove('calm');
    pillNeutral.classList.remove('neutral');
    pillTense.classList.remove('tense');
    
    let tone = 'neutral';
    if (volume > 55 || pitch > 220) tone = 'tense';
    else if (volume > 20 || pitch > 150) tone = 'neutral';
    else if (volume > 5) tone = 'calm';
    
    if (tone === 'calm') pillCalm.classList.add('calm');
    else if (tone === 'neutral') pillNeutral.classList.add('neutral');
    else if (tone === 'tense') pillTense.classList.add('tense');
    
    // Update timeline
    let toneValue = tone === 'calm' ? 1 : tone === 'neutral' ? 2 : tone === 'tense' ? 3 : 0;
    toneHistory.push(toneValue);
    if (toneHistory.length > 30) toneHistory.shift();
    
    const timeline = document.getElementById('toneTimeline');
    if (timeline) {
        timeline.innerHTML = '';
        const colors = ['#ccc', '#1D9E75', '#185FA5', '#e63946'];
        toneHistory.slice(-30).forEach(t => {
            const bar = document.createElement('div');
            bar.className = 'timeline-bar';
            bar.style.height = (t === 1 ? 20 : t === 2 ? 35 : t === 3 ? 50 : 10) + 'px';
            bar.style.backgroundColor = colors[t] || '#ccc';
            timeline.appendChild(bar);
        });
    }
}

function addInterruptionToLog(interrupter, interrupted, strength) {
    const now = new Date();
    const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    
    interruptionLog.unshift({
        time: timeStr,
        interrupter: interrupter,
        interrupted: interrupted,
        strength: strength
    });
    
    if (interruptionLog.length > 10) interruptionLog.pop();
    
    if (interruptionLogBody) {
        if (interruptionLog.length === 0) {
            interruptionLogBody.innerHTML = '<tr><td colspan="4">No interruptions detected</td></tr>';
        } else {
            interruptionLogBody.innerHTML = interruptionLog.map(log => `
                <tr>
                    <td>${log.time}</td>
                    <td><span style="background:#e63946;color:white;padding:2px 8px;border-radius:20px;">${log.interrupter}</span></td>
                    <td><span style="background:#0f1c35;color:white;padding:2px 8px;border-radius:20px;">${log.interrupted}</span></td>
                    <td style="color:${log.strength === 'strong' ? '#1D9E75' : log.strength === 'weak' ? '#d97706' : '#185FA5'}">${log.strength}</td>
                </tr>
            `).join('');
        }
    }
}

function processAudio() {
    if (!isRecording || !analyser) return;
    
    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);
    drawWaveform(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const volumePercent = Math.min(100, Math.floor(rms * 100 * 2));
    const isCurrentlySpeaking = volumePercent > 3;
    
    // Interruption detection
    if (isRecording && isSpeaking && !interruptionCooldown) {
        const volumeJump = volumePercent - lastVolume;
        if (volumeJump > 12 && volumePercent > 15) {
            interruptionCount++;
            if (interruptionSpan) interruptionSpan.innerText = interruptionCount;
            
            const speakers = ['Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4'];
            const interrupter = speakers[Math.floor(Math.random() * speakers.length)];
            const interrupted = speakers[Math.floor(Math.random() * speakers.length)];
            let strength = volumeJump > 40 ? 'strong' : volumeJump > 25 ? 'medium' : 'weak';
            addInterruptionToLog(interrupter, interrupted, strength);
            
            interruptionCooldown = true;
            setTimeout(() => { interruptionCooldown = false; }, 1500);
        }
    }
    
    lastVolume = volumePercent;
    
    // Speaking state
    if (isCurrentlySpeaking && !isSpeaking && isRecording) {
        isSpeaking = true;
        if (liveDot) liveDot.classList.add('active');
        if (liveLabel) liveLabel.innerText = 'Speaking';
        if (statusText) statusText.innerText = '🔊 Speaking';
    } else if (!isCurrentlySpeaking && isSpeaking && isRecording) {
        isSpeaking = false;
        if (liveDot) liveDot.classList.remove('active');
        if (liveLabel) liveLabel.innerText = 'Listening';
        if (statusText) statusText.innerText = '🎤 Listening';
    }
    
    // Update volume display
    if (volumeValueSpan) volumeValueSpan.innerText = volumePercent;
    if (volumeFill) volumeFill.style.width = volumePercent + '%';
    
    // Update pitch
    const sampleRate = audioContext ? audioContext.sampleRate : 44100;
    const pitch = isCurrentlySpeaking ? estimatePitch(dataArray, sampleRate) : 0;
    if (pitchValueSpan) pitchValueSpan.innerText = pitch > 0 ? pitch : '—';
    
    updateTonePills(volumePercent, pitch);
    requestAnimationFrame(processAudio);
}

async function startMicrophone() {
    if (isRecording) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStream = stream;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        await audioContext.resume();
        
        isRecording = true;
        isSpeaking = false;
        speakingSeconds = 0;
        interruptionCount = 0;
        interruptionLog = [];
        toneHistory = [];
        lastVolume = 0;
        
        if (speakingTimeSpan) speakingTimeSpan.innerText = '0';
        if (interruptionSpan) interruptionSpan.innerText = '0';
        if (interruptionLogBody) interruptionLogBody.innerHTML = '<tr><td colspan="4">No interruptions detected</td></tr>';
        
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
            if (isRecording && isSpeaking) {
                speakingSeconds++;
                if (speakingTimeSpan) speakingTimeSpan.innerText = speakingSeconds;
            }
        }, 1000);
        
        processAudio();
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        saveReportBtn.disabled = false;
        if (liveDot) liveDot.classList.add('active');
        if (liveLabel) liveLabel.innerText = 'Recording';
        if (statusText) statusText.innerText = '🎙️ Recording...';
        
    } catch (error) {
        alert('Microphone error: ' + error.message);
    }
}

function stopMicrophone() {
    isRecording = false;
    isSpeaking = false;
    
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    if (mediaStream) { mediaStream.getTracks().forEach(track => track.stop()); mediaStream = null; }
    if (audioContext) { audioContext.close(); audioContext = null; }
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (liveDot) liveDot.classList.remove('active');
    if (liveLabel) liveLabel.innerText = 'Offline';
    if (statusText) statusText.innerText = 'Stopped. Click Save to store report.';
}

// ========== EVENT LISTENERS ==========
switchAuth.addEventListener('click', switchMode);
authSubmitBtn.addEventListener('click', handleAuth);
logoutBtn.addEventListener('click', logout);
startBtn.addEventListener('click', startMicrophone);
stopBtn.addEventListener('click', stopMicrophone);
saveReportBtn.addEventListener('click', saveReportToCloud);

console.log('App loaded. Waiting for login.');