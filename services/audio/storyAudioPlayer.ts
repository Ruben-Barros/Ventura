import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

// Audio player for story narration
class StoryAudioPlayer {
  private sound: Audio.Sound | null = null;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private duration: number = 0;
  private position: number = 0;

  // Event listeners
  private onPlaybackStatusUpdate: ((status: Audio.PlaybackStatus) => void) | null = null;
  private onPlaybackFinished: (() => void) | null = null;

  // Initialize the audio player
  async init() {
    try {
      console.log('Initializing audio player and requesting permissions');
      
      // Request audio permissions
      const permissionResponse = await Audio.requestPermissionsAsync();
      console.log('Audio permission status:', permissionResponse.status);
      
      // Set audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // Use speaker
        allowsRecordingIOS: false,
      });
      
      console.log('Audio mode set successfully');
    } catch (error) {
      console.error('Error initializing audio player:', error);
      throw error;
    }
  }

  // Load audio from a URL or local URI
  async loadAudio(uri: string): Promise<void> {
    // Unload any existing audio
    await this.unloadAudio();

    try {
      console.log('Starting to load audio from:', uri);
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        this.handlePlaybackStatusUpdate
      );
      
      this.sound = sound;
      const status = await sound.getStatusAsync();
      
      if (status.isLoaded) {
        this.duration = status.durationMillis || 0;
        console.log('Audio loaded successfully with duration:', this.duration);
      } else {
        console.warn('Audio loaded but not in loaded state:', status);
      }
      
      console.log('Audio loading completed for:', uri);
    } catch (error) {
      console.error('Error loading audio:', error);
      throw error;
    }
  }

  // Handle status updates during playback
  private handlePlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    console.log('Audio playback status update:', status);
    if (status.isLoaded) {
      this.isPlaying = status.isPlaying;
      this.isPaused = status.isPlaying === false && status.positionMillis > 0;
      this.position = status.positionMillis;
      
      // Call the external status update callback if provided
      if (this.onPlaybackStatusUpdate) {
        this.onPlaybackStatusUpdate(status);
      }
      
      // Check if playback has finished
      if (status.didJustFinish && this.onPlaybackFinished) {
        console.log('Audio playback finished');
        this.onPlaybackFinished();
      }
    } else if (status.error) {
      console.error('Audio playback error:', status.error);
    }
  };

  // Start or resume playback
  async play(): Promise<void> {
    if (!this.sound) {
      console.error('Attempted to play audio but no sound is loaded');
      console.log('AUDIO DEBUG: No sound loaded when attempting to play');
      return;
    }
    
    try {
      console.log('Starting audio playback');
      console.log('AUDIO DEBUG: Setting volume to maximum (1.0) before playing');
      
      // Set volume to maximum
      await this.sound.setVolumeAsync(1.0);
      
      // Ensure audio mode is set correctly again just before playing
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // Use speaker
        allowsRecordingIOS: false,
      });
      console.log('AUDIO DEBUG: Audio mode reset before playback');
      
      // Get status before playing to verify settings
      const statusBefore = await this.sound.getStatusAsync();
      console.log('AUDIO DEBUG: Status before play:', JSON.stringify(statusBefore));
      
      // Play the audio
      const playResult = await this.sound.playAsync();
      console.log('AUDIO DEBUG: Play result:', JSON.stringify(playResult));
      
      // Get status after playing to verify it's actually playing
      const statusAfter = await this.sound.getStatusAsync();
      console.log('AUDIO DEBUG: Status after play:', JSON.stringify(statusAfter));
      
      console.log('Audio playback started successfully');
      
      // Add an extra alert to notify the user
      if (playResult.isLoaded && playResult.isPlaying) {
        console.log('AUDIO DEBUG: Playback confirmed - audio should be audible now');
      } else {
        console.log('AUDIO DEBUG: Playback may not have started correctly');
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      console.error('AUDIO DEBUG: Detailed play error:', JSON.stringify(error));
      throw error;
    }
  }

  // Pause playback
  async pause(): Promise<void> {
    if (!this.sound || !this.isPlaying) return;
    
    try {
      await this.sound.pauseAsync();
    } catch (error) {
      console.error('Error pausing audio:', error);
      throw error;
    }
  }

  // Stop playback and reset position
  async stop(): Promise<void> {
    if (!this.sound) return;
    
    try {
      await this.sound.stopAsync();
      await this.sound.setPositionAsync(0);
    } catch (error) {
      console.error('Error stopping audio:', error);
      throw error;
    }
  }

  // Rewind by a specified number of seconds
  async rewind(seconds: number = 10): Promise<void> {
    if (!this.sound) return;
    
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.max(0, status.positionMillis - (seconds * 1000));
        await this.sound.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Error rewinding audio:', error);
      throw error;
    }
  }

  // Fast forward by a specified number of seconds
  async fastForward(seconds: number = 10): Promise<void> {
    if (!this.sound) return;
    
    try {
      const status = await this.sound.getStatusAsync();
      if (status.isLoaded) {
        const newPosition = Math.min(
          this.duration,
          status.positionMillis + (seconds * 1000)
        );
        await this.sound.setPositionAsync(newPosition);
      }
    } catch (error) {
      console.error('Error fast-forwarding audio:', error);
      throw error;
    }
  }

  // Set the playback position
  async seekTo(positionMillis: number): Promise<void> {
    if (!this.sound) return;
    
    try {
      await this.sound.setPositionAsync(positionMillis);
    } catch (error) {
      console.error('Error seeking audio:', error);
      throw error;
    }
  }

  // Set playback speed
  async setRate(rate: number): Promise<void> {
    if (!this.sound) return;
    
    try {
      await this.sound.setRateAsync(rate, true);
    } catch (error) {
      console.error('Error setting audio rate:', error);
      throw error;
    }
  }

  // Unload the audio resource
  async unloadAudio(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
        this.sound = null;
        this.isPlaying = false;
        this.isPaused = false;
        this.duration = 0;
        this.position = 0;
      } catch (error) {
        console.error('Error unloading audio:', error);
        throw error;
      }
    }
  }

  // Set callback for playback status updates
  setOnPlaybackStatusUpdate(callback: (status: Audio.PlaybackStatus) => void): void {
    this.onPlaybackStatusUpdate = callback;
  }

  // Set callback for when playback finishes
  setOnPlaybackFinished(callback: () => void): void {
    this.onPlaybackFinished = callback;
  }

  // Fade out audio over specified duration and then stop
  async fadeOut(durationMs: number = 1000): Promise<void> {
    if (!this.sound || !this.isPlaying) {
      console.warn('Cannot fade out: sound is null or not playing');
      return;
    }
    
    try {
      console.log(`Starting fade out over ${durationMs}ms`);
      // Get current status to check volume
      const status = await this.sound.getStatusAsync();
      if (!status.isLoaded) {
        console.warn('Cannot fade out: sound not loaded');
        return;
      }
      
      const startVolume = status.volume || 1.0;
      const steps = 10; // Number of volume reduction steps
      const interval = durationMs / steps;
      const volumeStep = startVolume / steps;
      
      console.log(`Fade out starting from volume ${startVolume} with ${steps} steps, each ${interval}ms`);
      
      // Gradually reduce volume
      for (let i = 1; i <= steps; i++) {
        const newVolume = startVolume - (volumeStep * i);
        console.log(`Fade step ${i}/${steps}: setting volume to ${newVolume.toFixed(2)}`);
        await this.sound.setVolumeAsync(Math.max(0, newVolume));
        // Wait for the next volume reduction
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      
      // Finally stop the audio after fade-out completes
      await this.stop();
      console.log('Fade out completed and audio stopped');
      
      // Restore default volume for next playback
      await this.sound.setVolumeAsync(1.0);
      
      // Store callback locally to prevent race conditions
      const onFinished = this.onPlaybackFinished;
      
      // Small delay to ensure stop completes before callback fires
      setTimeout(() => {
        // Manually trigger the onPlaybackFinished callback if it exists
        if (onFinished) {
          console.log('Executing onPlaybackFinished callback after fade out');
          onFinished();
        } else {
          console.warn('No onPlaybackFinished callback set');
        }
      }, 100);
    } catch (error) {
      console.error('Error during audio fade out:', error);
      // Attempt to stop audio and reset volume in case of error
      try {
        await this.stop();
        if (this.sound) {
          await this.sound.setVolumeAsync(1.0);
        }
        
        // Even in error case, try to trigger callback
        if (this.onPlaybackFinished) {
          console.log('Executing onPlaybackFinished callback after fade error');
          this.onPlaybackFinished();
        }
      } catch (stopError) {
        console.error('Error stopping audio after fade error:', stopError);
      }
    }
  }

  // Get current playback position in milliseconds
  getPosition(): number {
    return this.position;
  }

  // Get total duration in milliseconds
  getDuration(): number {
    return this.duration;
  }

  // Check if audio is currently playing
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Check if audio is currently paused
  getIsPaused(): boolean {
    return this.isPaused;
  }

  // Clean up resources when component unmounts
  async cleanup(): Promise<void> {
    await this.unloadAudio();
  }
}

// Create a singleton instance
export const storyAudioPlayer = new StoryAudioPlayer();
export default storyAudioPlayer; 