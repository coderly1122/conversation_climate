// ============================================
// TENSORFLOW.JS SPEECH COMMANDS - AI MODULE
// ============================================

let recognizer = null;
let isListening = false;
let aiStatusElement = null;
let statusTextElement = null;
let interruptionCallback = null;

export function initAI(statusEl, statusTextEl, onInterrupt) {
    aiStatusElement = statusEl;
    statusTextElement = statusTextEl;
    interruptionCallback = onInterrupt;
    loadAIModel();
}

async function loadAIModel() {
    try {
        if (aiStatusElement) {
            aiStatusElement.innerText = '📥 Loading AI model...';
        }
        
        recognizer = await speechCommands.create('BROWSER_FFT');
        await recognizer.ensureModelLoaded();
        
        const aiBtn = document.getElementById('aiBtn');
        if (aiBtn) {
            aiBtn.disabled = false;
            aiBtn.innerText = '🧠 AI Ready';
        }
        
        if (aiStatusElement) {
            aiStatusElement.innerText = '✅ AI model loaded successfully!';
            aiStatusElement.style.color = '#2A9D8F';
        }
        
        console.log('✅ AI Model loaded successfully');
    } catch (error) {
        console.error('Error loading AI model:', error);
        if (aiStatusElement) {
            aiStatusElement.innerText = '❌ AI model failed to load. Please refresh.';
            aiStatusElement.style.color = '#E63946';
        }
    }
}

export function toggleAIDetection() {
    if (isListening) {
        stopAIDetection();
    } else {
        startAIDetection();
    }
}

function startAIDetection() {
    if (!recognizer) {
        if (aiStatusElement) {
            aiStatusElement.innerText = '⚠️ AI model not loaded yet. Please wait.';
        }
        return;
    }
    
    if (isListening) return;
    
    isListening = true;
    const aiBtn = document.getElementById('aiBtn');
    if (aiBtn) aiBtn.innerText = '🔊 Listening...';
    if (aiStatusElement) {
        aiStatusElement.innerText = '🎤 AI is listening for commands...';
        aiStatusElement.style.color = '#6C63FF';
    }
    
    const words = ['_background_noise_', '_unknown_', 'yes', 'no', 'up', 'down', 'left', 'right',
                   'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'zero',
                   'go', 'stop'];
    
    recognizer.listen(result => {
        const scores = result.scores;
        const maxScoreIndex = scores.indexOf(Math.max(...scores));
        const detectedWord = words[maxScoreIndex];
        const confidence = scores[maxScoreIndex];
        
        if (confidence > 0.7 && detectedWord !== '_background_noise_' && detectedWord !== '_unknown_') {
            // Update status
            if (statusTextElement) {
                statusTextElement.innerText = `🔊 Detected: ${detectedWord} (${Math.round(confidence * 100)}%)`;
            }
            console.log(`🎤 Detected: ${detectedWord} (${Math.round(confidence * 100)}%)`);
            
            // Trigger interruption on keywords
            if ((detectedWord === 'stop' || detectedWord === 'no') && interruptionCallback) {
                interruptionCallback();
            }
        }
    }, {
        includeSpectrogram: false,
        probabilityThreshold: 0.70,
        invokeCallbackOnNoiseAndUnknown: false,
        overlapFactor: 0.50
    });
}

function stopAIDetection() {
    if (recognizer && isListening) {
        recognizer.stopListening();
        isListening = false;
        const aiBtn = document.getElementById('aiBtn');
        if (aiBtn) aiBtn.innerText = '🧠 Start AI Detection';
        if (aiStatusElement) {
            aiStatusElement.innerText = '⏹️ AI stopped listening';
            aiStatusElement.style.color = '#666';
        }
        if (statusTextElement) {
            statusTextElement.innerText = 'AI Detection stopped';
        }
    }
}