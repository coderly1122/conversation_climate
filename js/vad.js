

class VoiceActivityDetector {
    constructor(options = {}) {
        // Sensitivity: lower value = more sensitive (0.01 to 0.10)
        this.threshold = options.threshold || 0.05;
        
        // Minimum speaking time (seconds) – prevents short noises
        this.minSpeakingTime = options.minSpeakingTime || 0.3;
        
        // Minimum silence time (seconds) – prevents tiny gaps
        this.minSilenceTime = options.minSilenceTime || 0.2;
        
        // Current state
        this.isSpeaking = false;
        this.speakingSeconds = 0;
        this.silenceSeconds = 0;
        
        // Callback functions
        this.onSpeakingStarted = options.onSpeakingStarted || null;
        this.onSpeakingStopped = options.onSpeakingStopped || null;
        this.onVolumeUpdate = options.onVolumeUpdate || null;
        
        // Internal tracking
        this._speakingStartTime = 0;
        this._lastVolume = 0;
        this._debounceTimer = null;
    }
    
    // Process a volume value (0 to 1) – call this in your audio loop
    processVolume(volume) {
        this._lastVolume = volume;
        
        // Call volume update callback if provided
        if (this.onVolumeUpdate) {
            this.onVolumeUpdate(volume);
        }
        
        const isLoud = volume > this.threshold;
        
        if (isLoud && !this.isSpeaking) {
            // Potential speaking start – add debounce
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                if (this._lastVolume > this.threshold) {
                    this._startSpeaking();
                }
            }, this.minSpeakingTime * 1000);
            
        } else if (!isLoud && this.isSpeaking) {
            // Potential speaking stop – add debounce
            if (this._debounceTimer) clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => {
                if (this._lastVolume <= this.threshold) {
                    this._stopSpeaking();
                }
            }, this.minSilenceTime * 1000);
        }
    }
    
    // Called when speaking starts
    _startSpeaking() {
        if (this.isSpeaking) return;
        this.isSpeaking = true;
        this._speakingStartTime = Date.now();
        
        if (this.onSpeakingStarted) {
            this.onSpeakingStarted();
        }
        
        console.log('🎤 VAD: Speaking started');
    }
    
    // Called when speaking stops
    _stopSpeaking() {
        if (!this.isSpeaking) return;
        
        const duration = (Date.now() - this._speakingStartTime) / 1000;
        this.speakingSeconds += duration;
        this.isSpeaking = false;
        
        if (this.onSpeakingStopped) {
            this.onSpeakingStopped(duration);
        }
        
        console.log(`🔇 VAD: Speaking stopped (duration: ${duration.toFixed(2)}s)`);
    }
    
    // Reset counters
    reset() {
        this.speakingSeconds = 0;
        this.silenceSeconds = 0;
        this.isSpeaking = false;
        this._speakingStartTime = 0;
        if (this._debounceTimer) clearTimeout(this._debounceTimer);
        console.log('🔄 VAD: Reset');
    }
    
    // Get total speaking time
    getTotalSpeakingTime() {
        let total = this.speakingSeconds;
        if (this.isSpeaking && this._speakingStartTime > 0) {
            total += (Date.now() - this._speakingStartTime) / 1000;
        }
        return total;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceActivityDetector;
}