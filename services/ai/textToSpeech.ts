/**
 * DISABLED Text-to-Speech Service
 * This is a completely disabled version that doesn't actually play any speech
 */

// Keep log levels for compatibility
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// Basic options interface for compatibility
interface TTSOptions {
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: any) => void;
  pitch?: number;
  rate?: number;
  volume?: number;
  language?: string;
}

/**
 * Disabled Text-to-Speech service that simulates functionality without actually playing speech
 */
class TextToSpeechService {
  private isSpeaking: boolean = false;
  private logLevel: LogLevel = LogLevel.ERROR;

  // Set the logging level (for compatibility)
  setLogLevel(level: LogLevel) {
    this.logLevel = level;
    console.log(`[DISABLED TTS] Log level set to ${level}`);
  }

  // Log messages based on level (for debugging)
  private log(level: LogLevel, ...messages: any[]) {
    if (level <= this.logLevel) {
      const prefix = ['', 'ERROR', 'WARN', 'INFO', 'DEBUG'][level];
      console.log(`[DISABLED TTS:${prefix}]`, ...messages);
    }
  }

  // Initialize TTS (does nothing)
  async init(): Promise<void> {
    this.log(LogLevel.INFO, 'TTS initialization disabled');
    return Promise.resolve();
  }

  // Speak function that just simulates speaking with a delay
  async speak(text: string, options: TTSOptions = {}): Promise<boolean> {
    try {
      this.log(LogLevel.INFO, `TTS speak disabled - text length: ${text?.length || 0}`);
      
      // Skip empty text
      if (!text?.trim()) {
        this.log(LogLevel.WARN, 'Empty text provided (disabled)');
        return false;
      }

      // Call onStart immediately
      if (options.onStart) {
        setTimeout(() => options.onStart?.(), 10);
      }
      
      // We're "speaking" now
      this.isSpeaking = true;
      
      // Simulate speech duration based on text length
      const wordsCount = text.split(/\s+/).length;
      const averageWordDuration = 300; // milliseconds per word
      const estimatedDuration = Math.max(1000, wordsCount * averageWordDuration);
      
      this.log(LogLevel.INFO, `Simulating speech for ${estimatedDuration}ms (${wordsCount} words)`);
      
      // Use setTimeout to simulate speech completion after the estimated duration
      return new Promise<boolean>((resolve) => {
        setTimeout(() => {
          this.isSpeaking = false;
          if (options.onComplete) {
            options.onComplete();
          }
          resolve(true);
        }, estimatedDuration);
      });
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error in speak function (disabled):', error);
      this.isSpeaking = false;
      if (options.onError) options.onError(error);
      return false;
    }
  }

  // Stop speaking (just resets state)
  async stop(): Promise<void> {
    if (this.isSpeaking) {
      this.log(LogLevel.INFO, 'Stopping speech (disabled)');
      this.isSpeaking = false;
    }
    return Promise.resolve();
  }

  // Check if speech is active
  isSpeechActive(): boolean {
    return this.isSpeaking;
  }
  
  // Clean up resources (does nothing)
  async cleanup(): Promise<void> {
    this.log(LogLevel.INFO, 'TTS service cleaned up (disabled)');
    this.isSpeaking = false;
    return Promise.resolve();
  }
}

// Export a singleton instance
const textToSpeech = new TextToSpeechService();
export default textToSpeech; 