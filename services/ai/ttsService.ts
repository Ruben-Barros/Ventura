/**
 * TTS service implementation using Google Cloud Text-to-Speech REST API
 */
import * as Speech from 'expo-speech'; // Keep for getAvailableVoicesAsync if needed later
import { Audio } from 'expo-av';
import Constants from 'expo-constants';

// Interface for Google Cloud TTS request
interface GoogleTTSRequest {
  input: { text: string };
  voice: { languageCode: string; name?: string; ssmlGender?: string }; // Name is preferred, gender as fallback
  audioConfig: { audioEncoding: 'LINEAR16' | 'MP3'; sampleRateHertz?: number }; // LINEAR16 or MP3
}

// Interface for Google Cloud TTS response
interface GoogleTTSResponse {
  audioContent: string; // Base64 encoded audio
}

// Placeholder for Chirp voice names - REPLACE with actual identifiers from Google Cloud Docs
// See: https://cloud.google.com/text-to-speech/docs/voices
// Chirp voices might require setting the 'model' field or specific names.
const CHIRP_VOICES: { [key: string]: { name: string; languageCode: string; sampleRateHertz?: number } } = {
  'narrator': { name: 'en-US-Standard-A', languageCode: 'en-US' }, // Example standard voice
  'chirp-en-us': { name: 'en-US-Neural2-A', languageCode: 'en-US' }, // Example Neural2 voice, check if Chirp uses similar naming
  // Add more Chirp voices here once identifiers are known
};

// Export voice info for UI (using the names defined above)
export const KOKORO_VOICES = Object.keys(CHIRP_VOICES).reduce((acc, key) => {
    acc[key] = { name: key, description: `Google Cloud Voice (${CHIRP_VOICES[key].name})` };
    return acc;
}, {} as { [key: string]: { name: string, description: string } });


// Sample quotes remain the same
export const SAMPLE_QUOTES = {
  short: "Hello, this is a test using Google Cloud Text-to-Speech. How does it sound?",
  medium: "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet.",
  story: "Once upon a time, in a forest far away, there lived a wise old owl. Each night, the owl would perch atop the tallest tree.",
  poetic: "Two roads diverged in a yellow wood, And sorry I could not travel both And be one traveler, long I stood.",
  technical: "Google Cloud Text-to-Speech converts text into human-like speech using advanced deep learning technologies."
};

export enum LogLevel {
  NONE = 0, ERROR = 1, WARN = 2, INFO = 3, DEBUG = 4
}

interface SpeakOptions {
  onStart?: () => void;
  onDone?: () => void;
  onError?: (error: any) => void;
  // onProgress is not directly supported by expo-speech
  pitch?: number; // Note: Pitch/Rate might need adjustment in audioConfig or might not be directly supported for all voices/encodings
  rate?: number;
  voice?: string; // Use the key from CHIRP_VOICES (e.g., 'narrator', 'chirp-en-us')
  language?: string;
}

class GoogleTTSService {
  private currentVoiceName: string = 'narrator';
  private sound: Audio.Sound | null = null;
  private apiKey: string | undefined = Constants.expoConfig?.extra?.googleTtsApiKey; // Get key from app.json extra
  private logLevel: LogLevel = LogLevel.INFO;
  private isSpeaking = false;
  private availableVoices: Speech.Voice[] = []; // Store native voices if needed for fallback/listing

  constructor() {
      if (!this.apiKey) {
          console.error("[GoogleTTS Service] ERROR: API key not found. Please set 'googleTtsApiKey' in app.json's 'extra' field.");
      }
  }

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
    console.log(`[GoogleTTS Service] Log level set to ${level}`);
  }

  /**
   * Initialize the TTS service. Sets up audio mode and fetches native voices.
   */
  async init(): Promise<boolean> {
    try {
      console.log('GoogleTTS Service: Initializing...');
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1, // MixWithOthers
        interruptionModeAndroid: 2, // DuckOthers
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });
      // Fetch native voices for potential listing or fallback (optional)
      // this.availableVoices = await Speech.getAvailableVoicesAsync();
      // console.log(`GoogleTTS Service: Found ${this.availableVoices.length} native voices.`);
      console.log('GoogleTTS Service: Initialized.');
      return true;
    } catch (error) {
      console.error('GoogleTTS Service: Initialization error', error);
      return false;
    }
  }

  /**
   * Set the desired voice name (maps to CHIRP_VOICES keys).
   */
  setVoice(voiceName: string): void {
    if (CHIRP_VOICES[voiceName]) {
      this.currentVoiceName = voiceName;
      console.log(`GoogleTTS Service: Desired voice set to ${voiceName}`);
    } else {
      console.warn(`GoogleTTS Service: Unknown voice ${voiceName}, using default 'narrator'.`);
      this.currentVoiceName = 'narrator';
    }
  }

  /**
   * Cleanup: Unload any active sound object.
   */
  async cleanup(): Promise<void> {
    console.log('GoogleTTS Service: Cleaning up...');
    await this.stop();
  }

  /**
   * Stop any ongoing speech playback.
   */
  async stop(): Promise<void> {
    if (this.isSpeaking && this.sound) {
      console.log('GoogleTTS Service: Stopping speech...');
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        console.log('GoogleTTS Service: Playback stopped and unloaded.');
      } catch (error) {
        console.error('GoogleTTS Service: Error stopping sound:', error);
      } finally {
        this.sound = null;
        this.isSpeaking = false;
      }
    } else {
         console.log('GoogleTTS Service: No active speech to stop.');
    }
  }

  /**
   * Speak the provided text using Google Cloud TTS API.
   */
  async speak(
    text: string | null | undefined, // Allow null/undefined in signature
    options?: SpeakOptions
  ): Promise<void> {
    // Explicitly check if text is a valid string before proceeding
    if (typeof text !== 'string' || !text) {
      const error = new Error('GoogleTTS Service: Attempted to speak with invalid text.');
      console.error(`[GoogleTTS Service] ${error.message}`);
      options?.onError?.(error);
      this.isSpeaking = false; // Ensure speaking state is reset
      return;
    }

    if (!this.apiKey) {
       const error = new Error('Google Cloud TTS API key is missing.');
       console.error(`[GoogleTTS Service] ${error.message}`);
       options?.onError?.(error);
       return;
    }
    if (this.isSpeaking) {
        console.warn("[GoogleTTS Service] Already speaking, stopping previous utterance.");
        await this.stop();
    }

    this.isSpeaking = true;
    options?.onStart?.();
    // Now we know 'text' is a valid string
    console.log(`[GoogleTTS Service] Requesting speech for text (length: ${text.length})...`);

    const voiceInfo = CHIRP_VOICES[options?.voice || this.currentVoiceName] || CHIRP_VOICES['narrator'];
    const audioEncoding = 'MP3';

    const requestBody: GoogleTTSRequest = {
      input: { text: text },
      voice: {
        languageCode: voiceInfo.languageCode,
        name: voiceInfo.name,
        // Add 'model': 'chirp' here if required by documentation
      },
      audioConfig: {
        audioEncoding: audioEncoding,
        // sampleRateHertz: voiceInfo.sampleRateHertz // Optional
        // Add speakingRate/pitch here if supported
      }
    };

     if (options?.rate && requestBody.audioConfig) {
        (requestBody.audioConfig as any).speakingRate = options.rate;
     }
     if (options?.pitch && requestBody.audioConfig) {
        (requestBody.audioConfig as any).pitch = options.pitch;
     }


    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Google TTS API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
      }

      const result: GoogleTTSResponse = await response.json();

      if (!result.audioContent) {
        throw new Error('Google TTS API response missing audioContent.');
      }

      console.log(`[GoogleTTS Service] Received audio data (base64 length: ${result.audioContent.length})`);

      await this.stop(); // Ensure previous sound stopped
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${result.audioContent}` },
        { shouldPlay: true, volume: 1.0 },
        (playbackStatus) => { // Use arrow function for status updates
          if (!playbackStatus.isLoaded) {
            if (playbackStatus.error) {
              console.error(`[GoogleTTS Service] Playback Error: ${playbackStatus.error}`);
              this.sound = null;
              this.isSpeaking = false;
              options?.onError?.(new Error(playbackStatus.error));
            }
          } else {
            if (playbackStatus.didJustFinish) {
              console.log("[GoogleTTS Service] Playback finished.");
              this.sound = null;
              this.isSpeaking = false;
              options?.onDone?.();
              // Unload async after finishing
              sound.unloadAsync().catch(e => console.error("Error unloading sound:", e));
            }
          }
        }
      );
      this.sound = sound;

    } catch (error) {
      console.error('[GoogleTTS Service] Error in speak:', error);
      this.isSpeaking = false;
      options?.onError?.(error);
    }
  }

  /**
   * Check if the service is ready (API key must be present).
   */
  isReady(): boolean {
    return !!this.apiKey;
  }

  /**
   * Get available voices (returns predefined list for now).
   */
  getVoices(): { identifier: string, name: string, language: string }[] {
     // TODO: Optionally implement call to Google Cloud voices:list endpoint
     return Object.entries(CHIRP_VOICES).map(([key, value]) => ({
         identifier: value.name,
         name: key,
         language: value.languageCode
     }));
  }

   /**
    * Get voice descriptions.
    */
   getVoiceDescription(voice: string): string {
      const voiceInfo = KOKORO_VOICES[voice];
      return voiceInfo?.description || 'Select a voice style.';
   }
}

// Export a singleton instance
const ttsService = new GoogleTTSService();
export default ttsService;