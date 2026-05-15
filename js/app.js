

let mediaStream = null;
let audioContext = null;
let sourceNode = null;
let isSpeaking = false;
let speakingSeconds = 0;
let intervalId = null;
let isRecording = false;

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const meter = document.getElementById('meter');
const speakingTimeSpan = document.getElementById('speakingTime');
const statusSpan = document.getElementById('status');

// Simple Voice Activity Detection
// Checks volume level – if loud enough, user is speaking
function checkVoiceActivity(analyser, dataArray) {
    analyser.getByteTimeDomainData(dataArray);
    
    let maxSample = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        maxSample = Math.max(maxSample, Math.abs(v));
    }
    
    // Volume threshold (0.05 = quiet room, adjust if needed)
    const isCurrentlySpeaking = maxSample > 0.05;
    
    if (isCurrentlySpeaking && !isSpeaking && isRecording) {
        // Just started speaking
        isSpeaking = true;
        meter.classList.add('speaking');
        meter.innerHTML = '<span>🎤 SPEAKING</span>';
        statusSpan.innerText = 'Speaking...';
    } else if (!isCurrentlySpeaking && isSpeaking && isRecording) {
        // Just stopped speaking
        isSpeaking = false;
        meter.classList.remove('speaking');
        meter.innerHTML = '<span>🔴</span>';
        statusSpan.innerText = 'Silence / Listening';
    }
    
    requestAnimationFrame(() => checkVoiceActivity(analyser, dataArray));
}

// Start the microphone and setup audio processing
async function startMicrophone() {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStream = stream;
        
        // Create Audio Context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        sourceNode = audioContext.createMediaStreamSource(stream);
        
        // Create analyser node for volume detection
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Connect: source -> analyser (we don't send to destination to avoid echo)
        sourceNode.connect(analyser);
        
        // Start audio context (requires user interaction)
        await audioContext.resume();
        
        // Start voice activity detection
        checkVoiceActivity(analyser, dataArray);
        
        // Start counting speaking time every second
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(() => {
            if (isRecording && isSpeaking) {
                speakingSeconds++;
                speakingTimeSpan.innerText = speakingSeconds;
            }
        }, 1000);
        
        isRecording = true;
        statusSpan.innerText = 'Recording – microphone active';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        console.log('✅ Microphone active');
        
    } catch (error) {
        console.error('Error accessing microphone:', error);
        statusSpan.innerText = 'Error: ' + (error.message || 'Microphone permission denied');
        alert('Could not access microphone. Please allow microphone permissions and reload.');
    }
}

// Stop everything
function stopMicrophone() {
    isRecording = false;
    isSpeaking = false;
    
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    
    meter.classList.remove('speaking');
    meter.innerHTML = '<span>⏹️</span>';
    statusSpan.innerText = 'Stopped';
    startBtn.disabled = false;
    stopBtn.disabled = true;
    
    console.log('✅ Stopped. Speaking time:', speakingSeconds, 'seconds');
}

// Button event listeners
startBtn.addEventListener('click', startMicrophone);
stopBtn.addEventListener('click', stopMicrophone);