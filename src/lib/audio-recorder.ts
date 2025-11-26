/**
 * Audio recording utility for voice notes in comments
 * Records audio, compresses it, and converts to base64
 * Max duration: 10 seconds
 * Target size: ~10KB
 */

export interface VoiceRecording {
  data: string; // base64 audio data
  duration: number; // duration in seconds
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private startTime: number = 0;
  private maxDuration: number = 10; // 10 seconds max
  private stream: MediaStream | null = null;

  /**
   * Start recording audio
   * @returns Promise that resolves when recording starts
   */
  async startRecording(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1, // Mono
          sampleRate: 8000, // 8kHz (phone quality)
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      // Create MediaRecorder with low-quality settings
      const options = {
        mimeType: 'audio/webm;codecs=opus', // Opus codec for best compression
        audioBitsPerSecond: 8000, // 8kbps - very low bitrate
      };

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];
      this.startTime = Date.now();

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start();

      // Auto-stop after max duration
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.stopRecording();
        }
      }, this.maxDuration * 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Could not access microphone. Please grant permission.');
    }
  }

  /**
   * Stop recording and return the audio data
   * @returns Promise with voice recording data
   */
  async stopRecording(): Promise<VoiceRecording> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          // Calculate duration
          const duration = Math.min(
            (Date.now() - this.startTime) / 1000,
            this.maxDuration
          );

          // Create blob from chunks
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          
          // Convert to base64
          const base64 = await this.blobToBase64(audioBlob);

          // Clean up
          this.cleanup();

          console.log(`🎤 Recorded ${duration.toFixed(1)}s, size: ${Math.round(base64.length / 1024)}KB`);

          resolve({
            data: base64,
            duration: Math.round(duration * 10) / 10, // Round to 1 decimal
          });
        } catch (error) {
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel recording without saving
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  /**
   * Get current recording duration
   */
  getCurrentDuration(): number {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      return 0;
    }
    return Math.min(
      (Date.now() - this.startTime) / 1000,
      this.maxDuration
    );
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

/**
 * Play a voice note from base64 data
 * @param base64Data - Base64 audio data
 * @returns Audio element for playback control
 */
export function playVoiceNote(base64Data: string): HTMLAudioElement {
  const audio = new Audio(base64Data);
  audio.play();
  return audio;
}

/**
 * Get formatted duration string (e.g., "0:05")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
