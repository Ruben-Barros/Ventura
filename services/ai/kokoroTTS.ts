/**
 * Kokoro TTS service implementation using expo-speech
 */
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av'; // Keep for audio mode settings

// Export voice info (keep existing structure, but mapping might change)
// Note: These names now need to map to native voice identifiers if possible
export { voices as KOKORO_VOICES } from './kokoro/voices';

// Sample quotes remain the same
export const SAMPLE_QUOTES = {
  short: "Hello, this is a test of the Expo Speech system. How does it sound?",
  medium: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet.",
  story: "Once upon a time, in a forest far away, there lived a wise old owl. Each night, the owl would perch atop the tallest tree.",
  poetic: "Two roads diverged in a yellow wood, And sorry I could not travel both And be one traveler, long I stood.",
  technical: "Expo Speech utilizes the native text-to-speech capabilities of the underlying operating system."
};

export enum LogLevel {
  NONE = 0, ERROR = 1, WARN = 2, INFO = 3, DEBUG = 4
}

interface SpeakOptions {
  onStart?: () => void;
  onDone?: () => void; // Renamed from onComplete for expo-speech
  onError?: (error: any) => void;
  // onProgress is not directly supported by expo-speech
  pitch?: number; // Added pitch option
  rate?: number; // Renamed from speed for expo-speech
  voice?: string; // Voice identifier (platform specific)
  language?: string; // Language code (e.g., 'en-US')
}

class KokoroTTS {
  private currentVoiceName: string = 'narrator'; // Store desired name
  private currentVoiceIdentifier: string | undefined = undefined; // Store native identifier if found
  private availableVoices: Speech.Voice[] = [];
  private logLevel: LogLevel = LogLevel.INFO;

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
    console.log(`[ExpoSpeech TTS Service] Log level set to ${level}`);
  }

  /**
   * Initialize the TTS service. Fetches available voices.
   */
  async init(): Promise<boolean> {
    try {
      console.log('ExpoSpeech TTS Service: Initializing...');
      // Set audio mode (still relevant for playback behavior)
       await Audio.setAudioModeAsync({
         playsInSilentModeIOS: true,
         staysActiveInBackground: true,
         // Use numeric values directly as constants might be deprecated/changed
         interruptionModeIOS: 1, // MixWithOthers
         interruptionModeAndroid: 2, // DuckOthers
         shouldDuckAndroid: true,
         playThroughEarpieceAndroid: false
       });
      this.availableVoices = await Speech.getAvailableVoicesAsync();
      console.log(`ExpoSpeech TTS Service: Initialized. Found ${this.availableVoices.length} voices.`);
      // Attempt to find identifier for default voice
      this.findVoiceIdentifier(this.currentVoiceName);
      return true;
    } catch (error) {
      console.error('ExpoSpeech TTS Service: Initialization error', error);
      return false;
    }
  }

  /**
   * Find a native voice identifier matching a desired name (simple matching).
   */
  private findVoiceIdentifier(name: string): string | undefined {
     // Prioritize finding the identifier again if availableVoices is populated
     if (this.availableVoices.length > 0) {
        const lowerCaseName = name.toLowerCase();
        // Simple matching logic (can be improved)
        const found = this.availableVoices.find(v =>
            v.name.toLowerCase().includes(lowerCaseName) ||
            v.identifier.toLowerCase().includes(lowerCaseName)
        );
        this.currentVoiceIdentifier = found?.identifier;
        if(found) {
            console.log(`[ExpoSpeech TTS Service] Mapped '${name}' to identifier '${found.identifier}'`);
        } else {
            console.warn(`[ExpoSpeech TTS Service] Could not find a native voice matching '${name}'. Using default.`);
            this.currentVoiceIdentifier = undefined; // Use default
        }
     } else {
         console.warn(`[ExpoSpeech TTS Service] Available voices not loaded yet. Cannot map '${name}'.`);
         this.currentVoiceIdentifier = undefined; // Use default until voices load
     }
     return this.currentVoiceIdentifier;
  }


  /**
   * Set the desired voice name. Tries to find a matching native identifier.
   */
  setVoice(voiceName: string): void {
    this.currentVoiceName = voiceName;
    // Attempt to find the identifier when the voice is set
    this.findVoiceIdentifier(voiceName);
    console.log(`ExpoSpeech TTS Service: Desired voice set to ${voiceName}. Identifier: ${this.currentVoiceIdentifier || 'default'}`);
  }

  /**
   * Cleanup (no-op for expo-speech)
   */
  async cleanup(): Promise<void> {
    console.log('ExpoSpeech TTS Service: Cleanup (no-op)');
    // Stop any speech just in case
    await this.stop();
  }

  /**
   * Stop any ongoing speech.
   */
  async stop(): Promise<void> {
    console.log('ExpoSpeech TTS Service: Stopping speech...');
    await Speech.stop();
    console.log('ExpoSpeech TTS Service: Speech stopped.');
  }

  /**
   * Speak the provided text using expo-speech.
   */
  async speak(
    text: string,
    options?: SpeakOptions
  ): Promise<void> {
    try {
      console.log(`ExpoSpeech TTS Service: Speaking text (length: ${text.length})...`);
      // Ensure voices are loaded if not already
      if (this.availableVoices.length === 0) {
          await this.init(); // Re-fetch voices if needed
      }
      // Re-attempt finding identifier just before speaking
      const voiceIdentifier = this.findVoiceIdentifier(this.currentVoiceName);

      Speech.speak(text, {
        language: options?.language || 'en-US', // Default language
        pitch: options?.pitch || 1.0,
        rate: options?.rate || 1.0,
        voice: voiceIdentifier, // Use found identifier or let system default
        onStart: options?.onStart,
        onDone: options?.onDone,
        onError: options?.onError,
      });
    } catch (error) {
       console.error('ExpoSpeech TTS Service: Error in speak:', error);
       if (options?.onError) options.onError(error);
    }
  }

  /**
   * Check if the service is ready (always true for expo-speech after init).
   */
  isReady(): boolean {
    // expo-speech is generally ready immediately, but we depend on availableVoices
    return this.availableVoices.length > 0;
  }

  /**
   * Get available voices fetched during init.
   */
  getVoices(): Speech.Voice[] {
    return this.availableVoices;
  }

   /**
    * Get voice descriptions (remains the same)
    */
   getVoiceDescription(voice: string): string {
      // This mapping is now less direct, as native voices vary.
      // Keep for UI consistency, but acknowledge it's approximate.
      switch(voice) {
       case 'warm': return 'A gentle, inviting tone (native voice varies).';
       case 'clear': return 'A crisp, articulate voice (native voice varies).';
       // ... add descriptions for other names ...
       case 'narrator': return 'A balanced, engaging voice (native voice varies).';
       default: return 'Select a voice style (native voice varies).';
     }
   }
}

// Export a singleton instance
const kokoroTTS = new KokoroTTS();
export default kokoroTTS;
