import * as Speech from 'expo-speech';
import * as FileSystem from 'expo-file-system';
import { Platform, Vibration } from 'react-native';

// Log levels to control verbosity
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// Simulated Kokoro TTS implementation
// In a real app, you would use the actual Kokoro TTS library
class KokoroTTS {
  private voice: string = 'default';
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private language: string = 'en-US';
  private volume: number = 1.0;
  private logLevel: LogLevel = LogLevel.ERROR; // Default to only errors

  async initialize() {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 500));
    this.log(LogLevel.INFO, 'Kokoro TTS initialized successfully');
    
    try {
      // Test if speech is available
      await Speech.isSpeakingAsync();
      return true;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error testing speech availability:', error);
      return false;
    }
  }

  async getVoices() {
    try {
      // Use expo-speech voices but enhance the names for Kokoro simulation
      const expVoices = await Speech.getAvailableVoicesAsync();
      
      // Create enhanced voice objects with Kokoro-specific properties
      return expVoices.map(voice => ({
        ...voice,
        name: `Kokoro ${voice.identifier.split('.').pop()}`,
        quality: voice.quality || 'enhanced',
        // Add Kokoro-specific properties
        emotion: 'neutral',
        expressiveness: 8,
        clarity: 9
      }));
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error getting Kokoro voices:', error);
      return [];
    }
  }

  async setVoice(voiceId: string) {
    this.voice = voiceId;
  }

  async setRate(rate: number) {
    this.rate = rate;
  }

  async setPitch(pitch: number) {
    this.pitch = pitch;
  }

  async setLanguage(language: string) {
    this.language = language;
  }
  
  async setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private log(level: LogLevel, ...messages: any[]) {
    if (level <= this.logLevel) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(...messages);
          break;
        case LogLevel.WARN:
          console.warn(...messages);
          break;
        case LogLevel.INFO:
          console.log(...messages);
          break;
        case LogLevel.DEBUG:
          console.debug(...messages);
          break;
      }
    }
  }

  async speak(text: string, options: any = {}) {
    const { onComplete, onError, onStart } = options;
    
    try {
      // Check if speech is already in progress - stop it first
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        this.log(LogLevel.INFO, 'Speech already in progress, stopping it first');
        console.log('AUDIO DEBUG: Speech already in progress, stopping it first');
        await Speech.stop();
      }
      
      // Apply text preprocessing for more natural speech
      const processedText = this.processTextForNaturalSpeech(text);
      
      // Make sure volume is at maximum level
      this.volume = 1.0;
      
      // Log before speaking for debugging
      this.log(LogLevel.INFO, `Starting to speak (${processedText.length} chars) with volume=${this.volume}`);
      console.log(`Starting to speak (${processedText.length} chars) with volume=${this.volume}`);
      console.log('AUDIO DEBUG: Starting speech with expo-speech, volume=1.0');
      
      // Call onStart callback immediately if provided
      if (onStart) {
        onStart();
        console.log('AUDIO DEBUG: onStart callback fired');
      }
      
      // System alert to notify user that speech should be heard
      if (Platform && Platform.OS === 'ios') {
        // On iOS, vibrate the device to indicate speech is starting
        if (Vibration) {
          Vibration.vibrate(200);
        }
      }
      
      // Use expo-speech with enhanced configuration and explicit volume
      await Speech.speak(processedText, {
        voice: this.voice !== 'default' ? this.voice : undefined,
        rate: this.rate,
        pitch: this.pitch,
        language: this.language,
        onDone: () => {
          this.log(LogLevel.INFO, 'Speech completed successfully');
          console.log('Speech completed successfully');
          console.log('AUDIO DEBUG: Speech completed successfully');
          if (onComplete) {
            onComplete();
            console.log('AUDIO DEBUG: onComplete callback fired');
          }
        },
        onError: (error) => {
          this.log(LogLevel.ERROR, 'Speech error:', error);
          console.log('Speech error:', error);
          console.log('AUDIO DEBUG: Speech error:', error);
          if (onError) onError(error);
        },
        // Explicitly set volume to maximum
        volume: 1.0
      });
      
      this.log(LogLevel.DEBUG, `Speech in progress (${processedText.length} chars) with rate=${this.rate}, pitch=${this.pitch}, volume=${this.volume}`);
      console.log('AUDIO DEBUG: Speech in progress');
      
      // Return a promise that resolves when the speak method completes (not necessarily when speech finishes)
      return Promise.resolve();
    } catch (error) {
      this.log(LogLevel.ERROR, "Speech error:", error);
      console.error('Speech error in catch block:', error);
      console.log('AUDIO DEBUG: Speech error in catch block:', error);
      if (onError) onError(error);
      throw error;
    }
  }

  async stop() {
    try {
      await Speech.stop();
    } catch (error) {
      this.log(LogLevel.ERROR, "Error stopping speech:", error);
    }
  }

  async cleanup() {
    await this.stop();
  }

  // Process text to make it sound more natural
  private processTextForNaturalSpeech(text: string): string {
    // Add slight pauses after punctuation for more natural speech
    let processed = text
      .replace(/\./g, '. ') // Add slight pause after periods
      .replace(/\,/g, ', ') // Add slight pause after commas
      .replace(/\!/g, '! ') // Add slight pause after exclamation points
      .replace(/\?/g, '? ') // Add slight pause after question marks
      .replace(/\s+/g, ' '); // Remove extra spaces
      
    return processed;
  }
}

interface TTSOptions {
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: any) => void;
  useSSML?: boolean; // Add this option to support SSML
  pitch?: number;
  rate?: number;
  volume?: number;
  language?: string;
}

// Service for converting text to speech audio using Kokoro TTS
class TextToSpeechService {
  private isSpeaking: boolean = false;
  private kokoroTTS: KokoroTTS | null = null;
  private availableVoices: any[] = [];
  private initializationComplete: boolean = false;
  private logLevel: LogLevel = LogLevel.ERROR; // Default to only errors

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
    if (this.kokoroTTS) {
      this.kokoroTTS.setLogLevel(level);
    }
  }

  private log(level: LogLevel, ...messages: any[]) {
    if (level <= this.logLevel) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(...messages);
          break;
        case LogLevel.WARN:
          console.warn(...messages);
          break;
        case LogLevel.INFO:
          console.log(...messages);
          break;
        case LogLevel.DEBUG:
          console.debug(...messages);
          break;
      }
    }
  }

  // Initialize text-to-speech capabilities
  async init(): Promise<void> {
    if (this.initializationComplete) {
      this.log(LogLevel.DEBUG, 'TTS already initialized, skipping');
      return;
    }
    
    try {
      this.log(LogLevel.INFO, 'Initializing Kokoro TTS service...');
      // Initialize Kokoro TTS
      this.kokoroTTS = new KokoroTTS();
      this.kokoroTTS.setLogLevel(this.logLevel);
      const initialized = await this.kokoroTTS.initialize();
      
      if (!initialized) {
        throw new Error('Failed to initialize Kokoro TTS engine');
      }
      
      // Load available voices
      this.availableVoices = await this.kokoroTTS.getVoices();
      this.log(LogLevel.INFO, `Loaded ${this.availableVoices.length} voices for Kokoro TTS`);
      this.initializationComplete = true;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error initializing Kokoro TTS:', error);
      this.initializationComplete = false;
    }
  }

  // Get all available voices
  getAvailableVoices(): any[] {
    return this.availableVoices;
  }

  // Get voices by language (e.g., 'en-US')
  getVoicesByLanguage(languageCode: string): any[] {
    return this.availableVoices.filter(voice => voice.language.startsWith(languageCode));
  }

  // Get voices by quality (e.g., 'enhanced' for high-quality voices)
  getVoicesByQuality(quality: string): any[] {
    return this.availableVoices.filter(voice => voice.quality === quality);
  }

  /**
   * Speak text with TTS
   * @param text Text or SSML to speak
   * @param options Options for speech synthesis
   */
  async speak(text: string, options: TTSOptions = {}): Promise<boolean> {
    try {
      // Skip empty text
      if (!text?.trim()) {
        console.warn('Empty text provided to TTS service');
        return false;
      }

      // Check if already initialized
      if (!this.initializationComplete) {
        await this.init();
      }

      // Stop any ongoing speech
      await this.stop();

      // Set the voice parameters if provided
      if (options.pitch) this.kokoroTTS.setPitch(options.pitch);
      if (options.rate) this.kokoroTTS.setRate(options.rate);
      if (options.volume) this.kokoroTTS.setVolume(options.volume);
      if (options.language) this.kokoroTTS.setLanguage(options.language);

      // Set callback handlers
      const callbacks = {
        onStart: options.onStart || (() => {}),
        onComplete: options.onComplete || (() => {}),
        onError: options.onError || ((error: any) => console.error('TTS error:', error)),
      };

      // Make sure we have active status
      this.isSpeaking = true;
      
      // Process SSML if enabled
      let processedText = text;
      if (options.useSSML) {
        console.log('Using SSML for enhanced narration');
        processedText = this.processSpeechTagsForCompat(text);
      }

      console.log(`Speaking text with length: ${processedText.length}`);
      // Start speaking with the TTS engine
      await this.kokoroTTS.speak(processedText, callbacks);

      return true;
    } catch (error) {
      console.error('Error in speak function:', error);
      options.onError?.(error);
      this.isSpeaking = false;
      return false;
    }
  }
  
  /**
   * Process SSML tags to ensure compatibility with the TTS engine
   * Some TTS engines may not support all SSML tags
   */
  private processSpeechTagsForCompat(ssmlText: string): string {
    try {
      // If it's not SSML, just return the text
      if (!ssmlText.includes('<speak>')) {
        return ssmlText;
      }
      
      console.log('Processing SSML tags for compatibility');
      
      // Extract the content between <speak> tags
      const match = ssmlText.match(/<speak>([\s\S]*)<\/speak>/);
      if (!match) {
        console.warn('Invalid SSML structure, returning original text');
        return ssmlText;
      }
      
      let content = match[1];
      
      // Process prosody tags for rate, pitch, and volume
      let modifiedContent = content;
      
      // Process break tags
      modifiedContent = modifiedContent.replace(
        /<break\s+time="(\d+)ms"\s*\/>/g, 
        (_, ms) => {
          // Convert break tags to pauses
          const seconds = parseInt(ms) / 1000;
          return ` [pause:${seconds}] `;
        }
      );
      
      // Process prosody tags
      modifiedContent = modifiedContent.replace(
        /<prosody\s+rate="([^"]*)"\s+pitch="([^"]*)"\s+volume="([^"]*)"\s*>([\s\S]*)<\/prosody>/g,
        (_, rate, pitch, volume, content) => {
          // Store these values for setting on the TTS engine
          this.kokoroTTS.setRate(parseFloat(rate));
          this.kokoroTTS.setPitch(parseFloat(pitch));
          this.kokoroTTS.setVolume(parseFloat(volume));
          
          // Return the content without the prosody tags
          return content;
        }
      );
      
      console.log('SSML processed for compatibility');
      return modifiedContent;
    } catch (error) {
      console.error('Error processing SSML tags:', error);
      return ssmlText; // Return original text on error
    }
  }

  // Stop any ongoing speech
  async stop(): Promise<void> {
    try {
      if (this.kokoroTTS) {
        await this.kokoroTTS.stop();
      }
      this.isSpeaking = false;
    } catch (error) {
      this.log(LogLevel.ERROR, 'Error stopping Kokoro TTS speech:', error);
    }
  }

  // Check if text-to-speech is currently active
  isSpeechActive(): boolean {
    return this.isSpeaking;
  }

  // Generate a unique identifier for an audio file based on text content
  private generateAudioId(text: string): string {
    // Create a simple hash from the text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `audio_${Math.abs(hash).toString(16)}`;
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    await this.stop();
    if (this.kokoroTTS) {
      await this.kokoroTTS.cleanup();
    }
  }
}

// Create a singleton instance
export const textToSpeech = new TextToSpeechService();

// Set the log level for development/production
// For production, set it to LogLevel.ERROR or LogLevel.NONE
// For development, you can use LogLevel.INFO
textToSpeech.setLogLevel(LogLevel.INFO);  // Increase log level to see what's happening

export default textToSpeech; 