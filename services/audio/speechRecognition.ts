import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

// Simulated speech recognition service since we're using expo-speech
class SpeechRecognitionService {
  private isListening: boolean = false;
  private onResultCallback: ((result: string) => void) | null = null;
  private onErrorCallback: ((error: any) => void) | null = null;
  private voiceRecognitionTimeout: NodeJS.Timeout | null = null;

  // Initialize speech recognition
  async init(): Promise<boolean> {
    // Check if we're on a supported platform
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      console.warn('Speech recognition simulation is not supported on this platform');
      return false;
    }

    try {
      // We'll just return true since we're simulating
      return true;
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      return false;
    }
  }

  // Start listening for voice input (simulated)
  async startListening(options: {
    onResult: (result: string) => void,
    onError?: (error: any) => void,
    language?: string,
    partialResults?: boolean,
  }): Promise<boolean> {
    if (this.isListening) {
      await this.stopListening();
    }

    const { onResult, onError } = options;
    this.onResultCallback = onResult;
    this.onErrorCallback = onError || ((error: any) => console.error('Speech recognition error:', error));

    try {
      this.isListening = true;
      
      // Simulate voice recognition with a timeout
      // In a real implementation, we would use the actual speech recognition API
      this.voiceRecognitionTimeout = setTimeout(() => {
        if (this.onResultCallback) {
          // Return a simulated response after 2 seconds
          this.onResultCallback("I choose option one");
        }
        this.isListening = false;
      }, 2000);
      
      return true;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this.isListening = false;
      return false;
    }
  }

  // Stop listening for voice input
  async stopListening(): Promise<void> {
    if (!this.isListening) return;
    
    try {
      if (this.voiceRecognitionTimeout) {
        clearTimeout(this.voiceRecognitionTimeout);
        this.voiceRecognitionTimeout = null;
      }
      this.isListening = false;
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
    }
  }

  // Check if speech recognition is currently active
  isRecognitionActive(): boolean {
    return this.isListening;
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    await this.stopListening();
  }
}

// Create a singleton instance
export const speechRecognition = new SpeechRecognitionService();
export default speechRecognition; 