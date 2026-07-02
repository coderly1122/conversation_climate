// ============================================
// MICROPHONE MANAGER
// ============================================

export class MicrophoneManager {
    constructor() {
        this.streams = [];
        this.mixedStream = null;
        this.isMixing = false;
        this.audioContext = null;
    }

    async getAvailableMicrophones() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'audioinput');
        } catch (error) {
            console.error('Error getting microphones:', error);
            return [];
        }
    }

    async startMicrophones(deviceIds) {
        try {
            this.stopAll();
            this.streams = [];
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            for (let i = 0; i < deviceIds.length; i++) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: { exact: deviceIds[i] },
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                this.streams.push(stream);
                console.log(`✅ Mic ${i + 1} started`);
            }

            if (this.streams.length === 1) {
                this.mixedStream = this.streams[0];
                this.isMixing = true;
                return this.mixedStream;
            }

            this.mixedStream = await this.mixStreams(this.streams);
            this.isMixing = true;
            return this.mixedStream;
        } catch (error) {
            console.error('Error starting microphones:', error);
            throw error;
        }
    }

    async mixStreams(streams) {
        if (streams.length === 0) throw new Error('No streams to mix');
        if (streams.length === 1) return streams[0];

        const dest = this.audioContext.createMediaStreamDestination();
        for (let i = 0; i < streams.length; i++) {
            const source = this.audioContext.createMediaStreamSource(streams[i]);
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = 1.0 / streams.length;
            source.connect(gainNode);
            gainNode.connect(dest);
        }
        return dest.stream;
    }

    getMixedStream() { return this.mixedStream; }
    getCount() { return this.streams.length; }
    isActive() { return this.isMixing; }

    stopAll() {
        this.isMixing = false;
        this.streams.forEach(stream => {
            stream.getTracks().forEach(track => track.stop());
        });
        this.streams = [];
        this.mixedStream = null;
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        console.log('✅ All microphones stopped');
    }
}