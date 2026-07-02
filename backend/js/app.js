// ============================================
// CONVERSATION CLIMATE - APP.JS
// ============================================

const BACKEND_URL = 'http://localhost:3000';

// Auth state
let authToken = null;
let currentUser = null;

// Audio state
let mediaStream = null;
let audioContext = null;
let analyser = null;
let isRecording = false;
let isSpeaking = false;
let speakingSeconds = 0;
let intervalId = null;
let interruptionCount = 0;
let lastVolume = 0;

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const saveReportBtn = document.getElementById('saveReportBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const speakingTimeSpan = document.getElementById('speakingTime');
const interruptionSpan = document.getElementById('interruptionCount');
const volumeValueSpan = document.getElementById('volumeValue');
const volumeFill = document.getElementById('volumeFill');
const statusText = document.getElementById('statusText');
const liveDot = document.getElementById('liveDot');
const liveLabel = document.getElementById('liveLabel');

// ========== AUDIO FUNCTIONS ==========

function calculateVolume(dataArray) {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    return Math.min(100, Math.floor(rms * 100 * 2));
}

function processAudio() {
    if (!isRecording || !analyser) return;
    
    const dataArray = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(dataArray);
    
    const volume = calculateVolume(dataArray);
    const isCurrentlySpeaking = volume > 5;
    
    if (isCurrentlySpeaking && !isSpeaking && isRecording) {
        isSpeaking = true;
        liveDot.classList.add('active');
        liveLabel.innerText = 'Speaking';
        statusText.innerText = '🔊 Speaking';
    } else if (!isCurrentlySpeaking && isSpeaking && isRecording) {
        isSpeaking = false;
        liveDot.classList.remove('active');
        liveLabel.innerText = 'Listening';
        statusText.innerText = '🎤 Listening';
    }
    
    if (isRecording && isSpeaking) {
        const volumeJump = volume - lastVolume;
        if (volumeJump > 15 && volume > 20) {
            interruptionCount++;
            interruptionSpan.innerText = interruptionCount;
        }
    }
    lastVolume = volume;
    
    volumeValueSpan.innerText = volume;
    volumeFill.style.width = volume + '%';
    
    requestAnimationFrame(processAudio);
}

async function startMicrophone() {
    if (isRecording) return;
    
    try {
        let stream;
        if (window.multiMicStream) {
            stream = window.multiMicStream;
        } else {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        mediaStream = stream;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        await audioContext.resume();
        
        isRecording = true;
        isSpeaking = false;
        speakingSeconds = 0;
        interruptionCount = 0;
        lastVolume = 0;
        
        speakingTimeSpan.innerText = '0';
        interruptionSpan.innerText = '0';
        
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
            if (isRecording && isSpeaking) {
                speakingSeconds++;
                speakingTimeSpan.innerText = speakingSeconds;
            }
        }, 1000);
        
        processAudio();
        
        startBtn.disabled = true;
        stopBtn.disabled = false;
        saveReportBtn.disabled = false;
        if (downloadPdfBtn) downloadPdfBtn.disabled = true;
        liveDot.classList.add('active');
        liveLabel.innerText = 'Recording';
        statusText.innerText = '🎙️ Recording...';
        
    } catch (error) {
        alert('Microphone error: ' + error.message);
    }
}

function stopMicrophone() {
    isRecording = false;
    isSpeaking = false;
    
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    if (mediaStream) { mediaStream.getTracks().forEach(t => t.stop()); mediaStream = null; }
    if (audioContext) { audioContext.close(); audioContext = null; }
    
    if (window.multiMicManager) {
        window.multiMicManager.stopAll();
        window.multiMicManager = null;
        window.multiMicStream = null;
    }
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    if (downloadPdfBtn) downloadPdfBtn.disabled = false;
    liveDot.classList.remove('active');
    liveLabel.innerText = 'Offline';
    statusText.innerText = `Stopped. ${speakingSeconds}s, ${interruptionCount} interruptions`;
}

// ========== EVENT LISTENERS ==========
if (startBtn) startBtn.addEventListener('click', startMicrophone);
if (stopBtn) stopBtn.addEventListener('click', stopMicrophone);