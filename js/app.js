window.mediaStream = null;
window.audioContext = null;
window.sourceNode = null;
window.isSpeaking = false;
window.speakingSeconds = 0;
window.intervalId = null;
window.isRecording = false;
window.interruptionCount = 0;
window.lastSpeakingStart = 0;
window.gracePeriod = false;
window.graceTimer = null;
window.sessionStartTime = null;

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const speakingTimeSpan = document.getElementById('speakingTime');
const interruptionSpan = document.getElementById('interruptionCount');
const volumeValueSpan = document.getElementById('volumeValue');
const volumeFill = document.getElementById('volumeFill');
const statusIconSpan = document.getElementById('statusIcon');
const meter = document.getElementById('meter');

function updateDisplay() {
    if (speakingTimeSpan) speakingTimeSpan.innerText = window.speakingSeconds;
    if (interruptionSpan) interruptionSpan.innerText = window.interruptionCount;
}

function checkVoiceActivity(analyser, dataArray) {
    analyser.getByteTimeDomainData(dataArray);
    
    let maxSample = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        maxSample = Math.max(maxSample, Math.abs(v));
    }
    
    const isCurrentlySpeaking = maxSample > 0.05;
    const now = Date.now();
    
    if (isCurrentlySpeaking && !window.isSpeaking && window.isRecording) {
        const timeSinceLastStop = now - window.lastSpeakingStart;
        if (window.lastSpeakingStart > 0 && timeSinceLastStop < 500 && !window.gracePeriod) {
            window.interruptionCount++;
            updateDisplay();
            window.gracePeriod = true;
            if (window.graceTimer) clearTimeout(window.graceTimer);
            window.graceTimer = setTimeout(() => { window.gracePeriod = false; }, 1000);
        }
        window.isSpeaking = true;
        if (meter) {
            meter.classList.add('speaking');
            meter.innerHTML = '<span>🎤</span>';
        }
        if (statusIconSpan) statusIconSpan.innerHTML = '🔊';
    } else if (!isCurrentlySpeaking && window.isSpeaking && window.isRecording) {
        window.isSpeaking = false;
        window.lastSpeakingStart = now;
        if (meter) {
            meter.classList.remove('speaking');
            meter.innerHTML = '<span>🔴</span>';
        }
        if (statusIconSpan) statusIconSpan.innerHTML = '⚪';
    }
    
    // Volume calculation
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const volumePercent = Math.min(100, Math.floor(rms * 100 * 2));
    
    if (volumeValueSpan) volumeValueSpan.innerText = volumePercent;
    if (volumeFill) volumeFill.style.width = volumePercent + '%';
    
    if (volumePercent > 60) {
        if (volumeFill) volumeFill.style.background = '#E63946';
    } else if (volumePercent > 30) {
        if (volumeFill) volumeFill.style.background = '#E9C46A';
    } else {
        if (volumeFill) volumeFill.style.background = '#2A9D8F';
    }
    
    requestAnimationFrame(() => checkVoiceActivity(analyser, dataArray));
}

async function startMicrophone() {
    if (window.isRecording) {
        console.log('Already recording');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        window.mediaStream = stream;
        
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        window.sourceNode = window.audioContext.createMediaStreamSource(stream);
        
        const analyser = window.audioContext.createAnalyser();
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        window.sourceNode.connect(analyser);
        await window.audioContext.resume();
        
        window.isRecording = true;
        window.speakingSeconds = 0;
        window.interruptionCount = 0;
        window.lastSpeakingStart = 0;
        window.sessionStartTime = Date.now();
        updateDisplay();
        
        if (window.intervalId) clearInterval(window.intervalId);
        window.intervalId = setInterval(() => {
            if (window.isRecording && window.isSpeaking) {
                window.speakingSeconds++;
                updateDisplay();
            }
        }, 1000);
        
        checkVoiceActivity(analyser, dataArray);
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        if (statusIconSpan) statusIconSpan.innerHTML = '🎙️';
        
        console.log('✅ Microphone active');
    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please allow permissions and refresh.');
    }
}

function stopMicrophone() {
    window.isRecording = false;
    window.isSpeaking = false;
    
    if (window.intervalId) {
        clearInterval(window.intervalId);
        window.intervalId = null;
    }
    
    if (window.mediaStream) {
        window.mediaStream.getTracks().forEach(track => track.stop());
        window.mediaStream = null;
    }
    
    if (window.audioContext) {
        window.audioContext.close();
        window.audioContext = null;
    }
    
    if (window.graceTimer) clearTimeout(window.graceTimer);
    
    if (meter) {
        meter.classList.remove('speaking');
        meter.innerHTML = '<span>⏹️</span>';
    }
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (statusIconSpan) statusIconSpan.innerHTML = '⏹️';
    
    console.log(`✅ Stopped. Speaking: ${window.speakingSeconds}s, Interruptions: ${window.interruptionCount}`);
}

// Event listeners
if (startBtn) startBtn.addEventListener('click', startMicrophone);
if (stopBtn) stopBtn.addEventListener('click', stopMicrophone);

console.log('Voice Analyzer ready. Click Start Microphone button.');