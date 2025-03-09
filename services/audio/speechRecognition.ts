/**
 * DISABLED Speech Recognition Service
 * This is a stub implementation that doesn't actually recognize speech
 */

// Simple event callbacks
type RecognitionCallback = (text: string) => void;
type ErrorCallback = (error: Error) => void;

/**
 * Disabled speech recognition service
 */
class SpeechRecognitionService {
  private isListening: boolean = false;
  private onRecognitionCallback: RecognitionCallback | null = null;
  private onPartialResultCallback: RecognitionCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;
  
  /**
   * Initialize the speech recognition service (does nothing)
   */
  async init(): Promise<void> {
    console.log('Speech recognition initialization disabled');
    return Promise.resolve();
  }
  
  /**
   * Start speech recognition (simulated)
   */
  async start(options: { 
    onRecognized?: RecognitionCallback, 
    onPartialResult?: RecognitionCallback,
    onError?: ErrorCallback 
  } = {}): Promise<void> {
    console.log('Speech recognition start disabled');
    
    // Store callbacks
    this.onRecognitionCallback = options.onRecognized || null;
    this.onPartialResultCallback = options.onPartialResult || null;
    this.onErrorCallback = options.onError || null;
    
    // Set as listening
    this.isListening = true;
    
    // Simulate partial results after a delay
    if (this.onPartialResultCallback) {
      setTimeout(() => {
        if (this.isListening && this.onPartialResultCallback) {
          this.onPartialResultCallback('Simulated partial result...');
        }
      }, 1500);
    }
    
    // Simulate a final result after a longer delay
    setTimeout(() => {
      if (this.isListening && this.onRecognitionCallback) {
        this.onRecognitionCallback('Simulated speech recognition result');
        this.isListening = false;
      }
    }, 3000);
    
    return Promise.resolve();
  }
  
  /**
   * Stop speech recognition (simulated)
   */
  async stop(): Promise<void> {
    console.log('Speech recognition stop disabled');
    this.isListening = false;
    return Promise.resolve();
  }
  
  /**
   * Check if speech recognition is active
   */
  isRecognizing(): boolean {
    return this.isListening;
  }
  
  /**
   * Clean up resources (does nothing)
   */
  async cleanup(): Promise<void> {
    console.log('Speech recognition cleanup disabled');
    this.isListening = false;
    this.onRecognitionCallback = null;
    this.onPartialResultCallback = null;
    this.onErrorCallback = null;
    return Promise.resolve();
  }
}

// Export singleton instance
export const speechRecognition = new SpeechRecognitionService(); 