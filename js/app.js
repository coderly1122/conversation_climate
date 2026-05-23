// Member A - Voice Analyzer with Simulated Interruption Log

window.mediaStream = null;
window.audioContext = null;
window.sourceNode = null;
window.isSpeaking = false;
window.speakingSeconds = 0;
window.intervalId = null;
window.isRecording = false;
window.interruptionCount = 0;
window.sessionStartTime = null;
window.interruptionCooldown = false;

// For interruption log (simulated)
let interruptionLog = [];
let lastVolume = 0;
let speakerNames = ['Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4'];
let currentSpeakerIndex = 0;

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const speakingTimeSpan = document.getElementById('speakingTime');
const interruptionSpan = document.getElementById('interruptionCount');
const volumeValueSpan = document.getElementById('volumeValue');
const volumeFill = document.getElementById('volumeFill');
const statusIconSpan = document.getElementById('statusIcon');
const meter = document.getElementById('meter');
const interruptionLogBody = document.getElementById('interruptionLogBody');

function updateDisplay() {
    if (speakingTimeSpan) speakingTimeSpan.innerText = window.speakingSeconds;
    if (interruptionSpan) interruptionSpan.innerText = window.interruptionCount;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function addInterruptionToLog(interrupter, interrupted, strength) {
    const sessionSeconds = window.sessionStartTime ? (Date.now() - window.sessionStartTime) / 1000 : 0;
    const timeStr = formatTime(sessionSeconds);
    
    interruptionLog.unshift({
        time: timeStr,
        interrupter: interrupter,
        interrupted: interrupted,
        strength: strength
    });
    
    // Keep only last 10 interruptions
    if (interruptionLog.length > 10) interruptionLog.pop();
    
    updateInterruptionLogDisplay();
}

function updateInterruptionLogDisplay() {
    if (!interruptionLogBody) return;
    
    if (interruptionLog.length === 0) {
        interruptionLogBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No interruptions detected yet</td></tr>';
        return;
    }
    
    interruptionLogBody.innerHTML = interruptionLog.map(log => {
        let strengthClass = '';
        let strengthText = '';
        
        switch(log.strength) {
            case 'strong':
                strengthClass = 'signal-strong';
                strengthText = 'Strong 🔊';
                break;
            case 'medium':
                strengthClass = 'signal-medium';
                strengthText = 'Medium 📢';
                break;
            case 'weak':
                strengthClass = 'signal-weak';
                strengthText = 'Weak 🔉';
                break;
            default:
                strengthClass = 'signal-medium';
                strengthText = 'Medium';
        }
        
        return `
            <tr>
                <td>${log.time}</td>
                <td><span class="interruption-badge badge-interrupter">${log.interrupter}</span></td>
                <td><span class="interruption-badge badge-interrupted">${log.interrupted}</span></td>
                <td class="${strengthClass}">${strengthText}</td>
            </tr>
        `;
    }).join('');
}

function checkVoiceActivity(analyser, dataArray) {
    analyser.getByteTimeDomainData(dataArray);
    
    // Calculate volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const volumePercent = Math.min(100, Math.floor(rms * 100 * 2));
    const isCurrentlySpeaking = volumePercent > 3;
    
    // INTERRUPTION DETECTION with simulated speaker identification
    if (window.isRecording && window.isSpeaking && !window.interruptionCooldown) {
        const volumeJump = volumePercent - lastVolume;
        
        // Volume spike = potential interruption
        if (volumeJump > 12 && volumePercent > 15) {
            window.interruptionCount++;
            updateDisplay();
            
            // SIMULATED: Rotate through speakers to show who interrupted whom
            currentSpeakerIndex = (currentSpeakerIndex + 1) % speakerNames.length;
            const interrupter = speakerNames[currentSpeakerIndex];
            
            // Determine interrupted speaker (previous speaker in list)
            const interruptedIndex = (currentSpeakerIndex - 1 + speakerNames.length) % speakerNames.length;
            const interrupted = speakerNames[interruptedIndex];
            
            // Determine signal strength based on volume jump
            let strength = 'medium';
            if (volumeJump > 40) strength = 'strong';
            else if (volumeJump > 25) strength = 'medium';
            else strength = 'weak';
            
            // Add to log
            addInterruptionToLog(interrupter, interrupted, strength);
            
            // Visual feedback
            const interruptionCard = document.getElementById('interruptionCount');
            if (interruptionCard) {
                interruptionCard.style.transition = 'all 0.2s';
                interruptionCard.style.transform = 'scale(1.3)';
                interruptionCard.style.color = '#E63946';
                setTimeout(() => {
                    interruptionCard.style.transform = 'scale(1)';
                    interruptionCard.style.color = '#1E2A5E';
                }, 300);
            }
            
            if (meter) {
                meter.style.backgroundColor = '#E63946';
                setTimeout(() => {
                    if (window.isSpeaking) meter.style.backgroundColor = '#2A9D8F';
                    else meter.style.backgroundColor = '#e0e0e0';
                }, 200);
            }
            
            window.interruptionCooldown = true;
            setTimeout(() => { window.interruptionCooldown = false; }, 1500);
            
            console.log(`🔔 Interruption: ${interrupter} interrupted ${interrupted} (${strength})`);
        }
    }
    
    lastVolume = volumePercent;
    
    // Speaking state management
    if (isCurrentlySpeaking && !window.isSpeaking && window.isRecording) {
        window.isSpeaking = true;
        if (meter) {
            meter.classList.add('speaking');
            meter.innerHTML = '<span>🎤 SPEAKING</span>';
        }
        if (statusIconSpan) statusIconSpan.innerHTML = '🔊';
        
    } else if (!isCurrentlySpeaking && window.isSpeaking && window.isRecording) {
        window.isSpeaking = false;
        if (meter) {
            meter.classList.remove('speaking');
            meter.innerHTML = '<span>🔴 IDLE</span>';
        }
        if (statusIconSpan) statusIconSpan.innerHTML = '⚪';
    }
    
    // Update volume display
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
        
        // Reset all
        window.isRecording = true;
        window.speakingSeconds = 0;
        window.interruptionCount = 0;
        window.sessionStartTime = Date.now();
        lastVolume = 0;
        window.interruptionCooldown = false;
        interruptionLog = [];
        currentSpeakerIndex = 0;
        updateDisplay();
        updateInterruptionLogDisplay();
        
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
        
        console.log('✅ Microphone active - Interruption analysis ready');
    } catch (error) {
        console.error('Error:', error);
        alert('Could not access microphone. Please allow permissions.');
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
    
    if (meter) {
        meter.classList.remove('speaking');
        meter.innerHTML = '<span>⏹️</span>';
    }
    if (startBtn) startBtn.disabled = false;
    if (stopBtn) stopBtn.disabled = true;
    if (statusIconSpan) statusIconSpan.innerHTML = '⏹️';
    if (volumeFill) volumeFill.style.width = '0%';
    if (volumeValueSpan) volumeValueSpan.innerText = '0';
    
    console.log(`✅ Stopped. Speaking: ${window.speakingSeconds}s, Interruptions: ${window.interruptionCount}`);
}

// Event listeners
if (startBtn) startBtn.addEventListener('click', startMicrophone);
if (stopBtn) stopBtn.addEventListener('click', stopMicrophone);

console.log('Voice Analyzer ready with simulated interruption analysis');