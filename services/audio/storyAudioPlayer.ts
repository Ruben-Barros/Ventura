/**
 * DISABLED Audio Player for Story Experience
 * All audio functionality is completely disabled in this version
 */
class StoryAudioPlayer {
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private position: number = 0;
  private duration: number = 0;
  
  // Placeholder for callbacks
  private onPlaybackStatusUpdate: ((status: any) => void) | null = null;
  private onPlaybackComplete: (() => void) | null = null;
  
  constructor() {
    console.log('Story Audio Player initialized (DISABLED)');
  }
  
  /**
   * Initialize the audio player (stub)
   */
  async init(): Promise<void> {
    console.log('Audio player initialization (DISABLED)');
    return Promise.resolve();
  }
  
  /**
   * Load audio from a URI (stub - does nothing)
   */
  async loadAudio(uri: string): Promise<void> {
    console.log('Audio loading disabled - URI:', uri);
    this.duration = 30000; // Pretend it's a 30 second clip
    
    // Simulate loading completion
    if (this.onPlaybackStatusUpdate) {
      this.onPlaybackStatusUpdate({
        isLoaded: true,
        isPlaying: false,
        isPaused: false,
        positionMillis: 0,
        durationMillis: this.duration,
        didJustFinish: false
      });
    }
    
    return Promise.resolve();
  }
  
  /**
   * Play the loaded audio (stub - simulates playback)
   */
  async play(): Promise<void> {
    console.log('Audio play disabled');
    this.isPlaying = true;
    this.isPaused = false;
    
    // Notify status update
    if (this.onPlaybackStatusUpdate) {
      this.onPlaybackStatusUpdate({
        isLoaded: true,
        isPlaying: true,
        isPaused: false,
        positionMillis: this.position,
        durationMillis: this.duration,
        didJustFinish: false
      });
    }
    
    return Promise.resolve();
  }
  
  /**
   * Pause the playing audio (stub)
   */
  async pause(): Promise<void> {
    console.log('Audio pause disabled');
    this.isPlaying = false;
    this.isPaused = true;
    
    // Notify status update
    if (this.onPlaybackStatusUpdate) {
      this.onPlaybackStatusUpdate({
        isLoaded: true,
        isPlaying: false,
        isPaused: true,
        positionMillis: this.position,
        durationMillis: this.duration,
        didJustFinish: false
      });
    }
    
    return Promise.resolve();
  }
  
  /**
   * Stop the audio playback (stub)
   */
  async stop(): Promise<void> {
    console.log('Audio stop disabled');
    this.isPlaying = false;
    this.isPaused = false;
    this.position = 0;
    
    // Notify status update
    if (this.onPlaybackStatusUpdate) {
      this.onPlaybackStatusUpdate({
        isLoaded: true,
        isPlaying: false,
        isPaused: false,
        positionMillis: 0,
        durationMillis: this.duration,
        didJustFinish: false
      });
    }
    
    return Promise.resolve();
  }
  
  /**
   * Rewind the audio by specified seconds (stub)
   */
  async rewind(seconds: number = 10): Promise<void> {
    console.log('Audio rewind disabled -', seconds, 'seconds');
    return Promise.resolve();
  }
  
  /**
   * Fast forward the audio by specified seconds (stub)
   */
  async fastForward(seconds: number = 10): Promise<void> {
    console.log('Audio fast-forward disabled -', seconds, 'seconds');
    return Promise.resolve();
  }
  
  /**
   * Seek to a specific position in milliseconds (stub)
   */
  async seekTo(positionMillis: number): Promise<void> {
    console.log('Audio seek disabled - position:', positionMillis);
    this.position = Math.min(positionMillis, this.duration);
    
    // Notify status update
    if (this.onPlaybackStatusUpdate) {
      this.onPlaybackStatusUpdate({
        isLoaded: true,
        isPlaying: this.isPlaying,
        isPaused: this.isPaused,
        positionMillis: this.position,
        durationMillis: this.duration,
        didJustFinish: false
      });
    }
    
    return Promise.resolve();
  }
  
  /**
   * Set the playback rate/speed (stub)
   */
  async setRate(rate: number): Promise<void> {
    console.log('Audio rate change disabled - rate:', rate);
    return Promise.resolve();
  }
  
  /**
   * Unload the audio (stub)
   */
  async unloadAudio(): Promise<void> {
    console.log('Audio unload disabled');
    this.isPlaying = false;
    this.isPaused = false;
    this.position = 0;
    this.duration = 0;
    
    return Promise.resolve();
  }
  
  /**
   * Set a callback for playback status updates
   */
  setOnPlaybackStatusUpdate(callback: (status: any) => void): void {
    this.onPlaybackStatusUpdate = callback;
  }
  
  /**
   * Set a callback for when playback completes
   */
  setOnPlaybackComplete(callback: () => void): void {
    this.onPlaybackComplete = callback;
  }
  
  /**
   * Set a callback for when playback finishes (alias for compatibility)
   */
  setOnPlaybackFinished(callback: () => void): void {
    console.log('Using setOnPlaybackFinished (alias for setOnPlaybackComplete)');
    this.onPlaybackComplete = callback;
  }
  
  /**
   * Clean up resources (stub)
   */
  async cleanup(): Promise<void> {
    console.log('Audio player cleanup (DISABLED)');
    this.isPlaying = false;
    this.isPaused = false;
    this.position = 0;
    this.duration = 0;
    this.onPlaybackStatusUpdate = null;
    this.onPlaybackComplete = null;
    
    return Promise.resolve();
  }
}

// Export a singleton instance
export const storyAudioPlayer = new StoryAudioPlayer(); 