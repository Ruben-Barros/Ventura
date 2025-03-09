import * as Speech from 'expo-speech';

// Simplified log levels
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// Basic options for TTS
interface TTSOptions {
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: any) => void;
  pitch?: number;
  rate?: number;
  volume?: number;
  language?: string;
}

// Simple text-to-speech service
class TextToSpeechService {
  private isSpeaking: boolean = false;
  private logLevel: LogLevel = LogLevel.ERROR;

  // Set the logging level
  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  // Log messages based on level
  private log(level: LogLevel, ...messages: any[]) {
    if (level <= this.logLevel) {
      const prefix = ['', 'ERROR', 'WARN', 'INFO', 'DEBUG'][level];
      console.log(`[TTS:${prefix}]`, ...messages);
    }
  }

  // Initialize TTS
  async init(): Promise<void> {
    try {
      this.log(LogLevel.INFO, 'Initializing text-to-speech service');
      // Nothing special needed for initialization with Expo Speech
      return Promise.resolve();
    } catch (error) {
      this.log(LogLevel.ERROR, 'Failed to initialize TTS service:', error);
      throw error;
    }
  }

  // Basic speak function
  async speak(text: string, options: TTSOptions = {}): Promise<boolean> {
    try {
      // Skip empty text
      if (!text?.trim()) {
        this.log(LogLevel.WARN, 'Empty text provided to TTS service');
        return false;
      }

      // Stop any ongoing speech
      await this.stop();

      this.isSpeaking = true;
      
      const speechOptions = {
        language: options.language || 'en-US',
        pitch: options.pitch || 1.0,
        rate: options.rate || 1.0,
        onStart: options.onStart,
        onDone: () => {
          this.isSpeaking = false;
          if (options.onComplete) options.onComplete();
        },
        onStopped: () => {
          this.isSpeaking = false;
        },
        onError: (error: any) => {
          this.isSpeaking = false;
          if (options.onError) options.onError(error);
          this.log(LogLevel.ERROR, 'Speech error:', error);
        },
      };

      this.log(LogLevel.INFO, `Speaking text with length: ${text.length}`);
      await Speech.speak(text, speechOptions);
      
      return true;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error in speak function:', error);
      this.isSpeaking = false;
      if (options.onError) options.onError(error);
      return false;
    }
  }

  // Stop speaking
  async stop(): Promise<void> {
    try {
      if (this.isSpeaking) {
        this.log(LogLevel.INFO, 'Stopping speech');
        await Speech.stop();
        this.isSpeaking = false;
      }
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error stopping speech:', error);
    }
  }

  // Check if speech is active
  isSpeechActive(): boolean {
    return this.isSpeaking;
  }
}

// Export a singleton instance
const textToSpeech = new TextToSpeechService();
export default textToSpeech; 