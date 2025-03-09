import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { textToSpeech } from '../ai/textToSpeech';
import SoundAssets from '../../assets/sounds';

// Emotion types for narration styling using SSML
export enum EmotionType {
  NEUTRAL = 'neutral',
  HAPPY = 'happy',
  FEARFUL = 'fearful',
  SAD = 'sad',
  MYSTERIOUS = 'mysterious',
  EXCITED = 'excited',
}

// Track types for managing multiple audio layers
export enum TrackType {
  NARRATION = 'narration',
  AMBIENT = 'ambient',
  EFFECT = 'effect',
  UI = 'ui',
}

// Configuration for audio effects
interface AudioEffectConfig {
  reverb?: boolean;
  echo?: boolean;
  volume: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

// Sound asset mapping - using centralized assets
const SOUND_ASSETS = {
  // UI Sounds
  INTRO_CHIME: SoundAssets.introChime,
  CHOICE_PROMPT: SoundAssets.choiceBell,
  CHOICE_SELECT: SoundAssets.choiceSelect,
  
  // Ambient Sounds
  FOREST_AMBIANCE: SoundAssets.forestAmbiance,
  CAVE_AMBIANCE: SoundAssets.caveAmbiance,
  VILLAGE_AMBIANCE: SoundAssets.villageAmbiance,
  
  // Effects
  FOOTSTEPS: SoundAssets.footsteps,
  DOOR_OPEN: SoundAssets.doorOpen,
  MAGIC_SPELL: SoundAssets.magicSpell,
};

class KokoroAudioService {
  private activeTracks: Map<string, Audio.Sound> = new Map();
  private trackVolumes: Map<string, number> = new Map();
  public isInitialized: boolean = false;
  private currentNarrationText: string = '';
  private isChoiceMode: boolean = false;
  
  // Initialize the audio service
  async initialize() {
    try {
      console.log('Initializing KokoroAudioService');
      
      // Request audio permissions
      await Audio.requestPermissionsAsync();
      
      // Set audio mode for optimal quality
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
        playThroughEarpieceAndroid: false,
      });
      
      this.isInitialized = true;
      console.log('KokoroAudioService initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing KokoroAudioService:', error);
      return false;
    }
  }
  
  // Preload commonly used sounds
  async preloadSounds() {
    try {
      const soundsToPreload = [
        SOUND_ASSETS.INTRO_CHIME,
        SOUND_ASSETS.CHOICE_PROMPT,
        SOUND_ASSETS.CHOICE_SELECT
      ];
      
      for (const soundAsset of soundsToPreload) {
        const sound = new Audio.Sound();
        await sound.loadAsync(soundAsset);
        console.log(`Preloaded sound successfully`);
        // Unload after preloading to save memory, we'll reload when needed
        await sound.unloadAsync();
      }
      
      return true;
    } catch (error) {
      console.error('Error preloading sounds:', error);
      return false;
    }
  }
  
  // Play intro sound with fade-out effect
  async playIntroSound(fadeOutDuration = 2000) {
    try {
      // Create the sound object
      const sound = new Audio.Sound();
      
      // Load intro sound
      await sound.loadAsync(SOUND_ASSETS.INTRO_CHIME);
      
      // Set full volume
      await sound.setVolumeAsync(1.0);
      
      // Store in active tracks
      this.activeTracks.set(TrackType.UI, sound);
      this.trackVolumes.set(TrackType.UI, 1.0);
      
      // Play the sound
      await sound.playAsync();
      
      // Set up fade-out
      const fadeSteps = 20;
      const fadeInterval = fadeOutDuration / fadeSteps;
      const volumeDecrement = 1.0 / fadeSteps;
      
      // Fade out intro sound
      return new Promise<void>(resolve => {
        let currentStep = 0;
        
        const fadeIntervalId = setInterval(async () => {
          currentStep++;
          
          if (currentStep >= fadeSteps) {
            clearInterval(fadeIntervalId);
            await this.stopTrack(TrackType.UI);
            resolve();
          } else {
            const newVolume = 1.0 - (currentStep * volumeDecrement);
            await sound.setVolumeAsync(newVolume);
            this.trackVolumes.set(TrackType.UI, newVolume);
          }
        }, fadeInterval);
      });
    } catch (error) {
      console.error('Error playing intro sound:', error);
    }
  }
  
  // Start narration with emotional inflection using SSML
  async startNarration(text: string, emotion: EmotionType = EmotionType.NEUTRAL) {
    try {
      this.currentNarrationText = text;
      
      // Generate SSML text with emotional inflection
      const ssmlText = this.generateSSMLWithEmotion(text, emotion);
      
      // Use the textToSpeech service with SSML
      const result = await textToSpeech.speak(ssmlText, {
        useSSML: true,
        onStart: () => {
          console.log('KOKORO: Narration started');
        },
        onComplete: () => {
          console.log('KOKORO: Narration completed');
        },
        onError: (error) => {
          console.error('KOKORO: Narration error', error);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error starting narration:', error);
    }
  }
  
  // Pause narration for choices
  async pauseNarrationForChoices() {
    try {
      this.isChoiceMode = true;
      
      // Pause the TTS narration
      await textToSpeech.stop();
      
      // Play the choice prompt sound
      await this.playChoicePromptSound();
      
      // Lower the volume of ambient tracks
      for (const [trackId, sound] of this.activeTracks.entries()) {
        if (trackId.startsWith(TrackType.AMBIENT)) {
          const currentVolume = this.trackVolumes.get(trackId) || 1.0;
          await sound.setVolumeAsync(currentVolume * 0.3); // Reduce to 30%
          this.trackVolumes.set(trackId, currentVolume * 0.3);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error pausing narration for choices:', error);
      return false;
    }
  }
  
  // Play the choice prompt sound (bell)
  async playChoicePromptSound() {
    try {
      // Create the sound object
      const sound = new Audio.Sound();
      
      // Load choice prompt sound
      await sound.loadAsync(SOUND_ASSETS.CHOICE_PROMPT);
      
      // Set volume
      await sound.setVolumeAsync(0.7);
      
      // Play the sound once
      await sound.playAsync();
      
      // Clean up when done
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error playing choice prompt sound:', error);
      return false;
    }
  }
  
  // Resume narration after choice has been made
  async resumeNarrationAfterChoice(text: string, emotion: EmotionType = EmotionType.NEUTRAL) {
    try {
      this.isChoiceMode = false;
      
      // Restore ambient track volumes
      for (const [trackId, sound] of this.activeTracks.entries()) {
        if (trackId.startsWith(TrackType.AMBIENT)) {
          const originalVolume = this.trackVolumes.get(trackId) || 0.3;
          await sound.setVolumeAsync(originalVolume / 0.3); // Restore to original volume
          this.trackVolumes.set(trackId, originalVolume / 0.3);
        }
      }
      
      // Play a selection sound effect
      await this.playChoiceEffect('default');
      
      // Small delay before resuming narration
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Start new narration with the text
      return this.startNarration(text, emotion);
    } catch (error) {
      console.error('Error resuming narration after choice:', error);
    }
  }
  
  // Start background ambiance
  async startAmbiance(type: 'forest' | 'cave' | 'village', config: AudioEffectConfig = { volume: 0.4 }) {
    try {
      // Stop any existing ambiance
      await this.stopTrack(`${TrackType.AMBIENT}_current`);
      
      // Select ambiance file based on type
      let ambianceAsset;
      switch (type) {
        case 'forest':
          ambianceAsset = SOUND_ASSETS.FOREST_AMBIANCE;
          break;
        case 'cave':
          ambianceAsset = SOUND_ASSETS.CAVE_AMBIANCE;
          break;
        case 'village':
          ambianceAsset = SOUND_ASSETS.VILLAGE_AMBIANCE;
          break;
        default:
          ambianceAsset = SOUND_ASSETS.FOREST_AMBIANCE;
      }
      
      // Create the sound object
      const sound = new Audio.Sound();
      
      // Load ambiance sound
      await sound.loadAsync(ambianceAsset);
      
      // Set volume (start silent if fading in)
      const initialVolume = config.fadeInDuration ? 0.0 : config.volume;
      await sound.setVolumeAsync(initialVolume);
      
      // Set looping
      await sound.setIsLoopingAsync(true);
      
      // Store in active tracks
      const trackId = `${TrackType.AMBIENT}_current`;
      this.activeTracks.set(trackId, sound);
      this.trackVolumes.set(trackId, config.volume);
      
      // Play the sound
      await sound.playAsync();
      
      // Apply fade-in if specified
      if (config.fadeInDuration) {
        await this.fadeInTrack(trackId, config.volume, config.fadeInDuration);
      }
      
      return true;
    } catch (error) {
      console.error(`Error starting ${type} ambiance:`, error);
      return false;
    }
  }
  
  // Play choice-specific sound effect
  async playChoiceEffect(type: 'footsteps' | 'door' | 'magic' | 'default') {
    try {
      // Select effect file based on type
      let effectAsset;
      let volume = 0.6;
      
      switch (type) {
        case 'footsteps':
          effectAsset = SOUND_ASSETS.FOOTSTEPS;
          volume = 0.5;
          break;
        case 'door':
          effectAsset = SOUND_ASSETS.DOOR_OPEN;
          volume = 0.7;
          break;
        case 'magic':
          effectAsset = SOUND_ASSETS.MAGIC_SPELL;
          volume = 0.6;
          break;
        default:
          effectAsset = SOUND_ASSETS.CHOICE_SELECT;
          volume = 0.5;
      }
      
      // Create the sound object
      const sound = new Audio.Sound();
      
      // Load effect sound
      await sound.loadAsync(effectAsset);
      
      // Set volume
      await sound.setVolumeAsync(volume);
      
      // Play the sound
      await sound.playAsync();
      
      // Clean up when done
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
      
      return true;
    } catch (error) {
      console.error(`Error playing ${type} effect:`, error);
      return false;
    }
  }
  
  // Apply scene effect (reverb, echo)
  async applySceneEffect(effectType: 'reverb' | 'echo') {
    // Implementation would require a more advanced audio processing library
    // For now, we'll just simulate the effect with a console log
    console.log(`Applied scene effect: ${effectType}`);
    return true;
  }
  
  // Helper function to fade in a track
  private async fadeInTrack(trackId: string, targetVolume: number, duration: number = 1000) {
    try {
      const sound = this.activeTracks.get(trackId);
      if (!sound) return false;
      
      const fadeSteps = 20;
      const fadeInterval = duration / fadeSteps;
      const volumeIncrement = targetVolume / fadeSteps;
      
      // Start from 0 volume
      await sound.setVolumeAsync(0);
      let currentVolume = 0;
      
      // Fade in
      return new Promise<boolean>(resolve => {
        let currentStep = 0;
        
        const fadeIntervalId = setInterval(async () => {
          currentStep++;
          currentVolume += volumeIncrement;
          
          if (currentStep >= fadeSteps) {
            clearInterval(fadeIntervalId);
            await sound.setVolumeAsync(targetVolume);
            this.trackVolumes.set(trackId, targetVolume);
            resolve(true);
          } else {
            await sound.setVolumeAsync(currentVolume);
          }
        }, fadeInterval);
      });
    } catch (error) {
      console.error(`Error fading in track ${trackId}:`, error);
      return false;
    }
  }
  
  // Helper function to fade out a track
  private async fadeOutTrack(trackId: string, duration: number = 1000) {
    try {
      const sound = this.activeTracks.get(trackId);
      if (!sound) return false;
      
      const fadeSteps = 20;
      const fadeInterval = duration / fadeSteps;
      const currentVolume = this.trackVolumes.get(trackId) || 1.0;
      const volumeDecrement = currentVolume / fadeSteps;
      
      return new Promise<boolean>(resolve => {
        let currentStep = 0;
        let volume = currentVolume;
        
        const fadeIntervalId = setInterval(async () => {
          currentStep++;
          volume -= volumeDecrement;
          
          if (currentStep >= fadeSteps || volume <= 0) {
            clearInterval(fadeIntervalId);
            await sound.setVolumeAsync(0);
            resolve(true);
          } else {
            await sound.setVolumeAsync(volume);
          }
        }, fadeInterval);
      });
    } catch (error) {
      console.error(`Error fading out track ${trackId}:`, error);
      return false;
    }
  }
  
  // Helper function to stop a track
  async stopTrack(trackId: string) {
    try {
      const sound = this.activeTracks.get(trackId);
      if (!sound) return false;
      
      // Fade out before stopping
      await this.fadeOutTrack(trackId, 500);
      
      // Stop and unload
      await sound.stopAsync();
      await sound.unloadAsync();
      
      // Remove from active tracks
      this.activeTracks.delete(trackId);
      this.trackVolumes.delete(trackId);
      
      return true;
    } catch (error) {
      console.error(`Error stopping track ${trackId}:`, error);
      
      // Clean up even if there was an error
      this.activeTracks.delete(trackId);
      this.trackVolumes.delete(trackId);
      
      return false;
    }
  }
  
  // Helper function to generate SSML with emotional inflection
  private generateSSMLWithEmotion(text: string, emotion: EmotionType): string {
    // Configure voice parameters based on emotion
    let rate = '1.0';
    let pitch = '1.0';
    let volume = '1.0';
    
    switch (emotion) {
      case EmotionType.HAPPY:
        pitch = '1.2';
        rate = '1.1';
        break;
      case EmotionType.FEARFUL:
        pitch = '1.3';
        rate = '1.2';
        volume = '0.9';
        break;
      case EmotionType.SAD:
        pitch = '0.8';
        rate = '0.9';
        volume = '0.8';
        break;
      case EmotionType.MYSTERIOUS:
        pitch = '0.9';
        rate = '0.9';
        volume = '0.9';
        break;
      case EmotionType.EXCITED:
        pitch = '1.3';
        rate = '1.2';
        volume = '1.0';
        break;
      default:
        // Neutral - use defaults
        break;
    }
    
    // Wrap the text in SSML tags
    const ssmlText = `
      <speak>
        <prosody rate="${rate}" pitch="${pitch}" volume="${volume}">
          ${this.processTextForNaturalSpeech(text)}
        </prosody>
      </speak>
    `.trim();
    
    return ssmlText;
  }
  
  // Helper function to process text for more natural speech
  private processTextForNaturalSpeech(text: string): string {
    // Add prosody boundaries and breaks at punctuation for more natural speech
    return text
      .replace(/\.\s+/g, '.<break time="500ms"/> ')
      .replace(/!\s+/g, '!<break time="500ms"/> ')
      .replace(/\?\s+/g, '?<break time="500ms"/> ')
      .replace(/,\s+/g, ',<break time="250ms"/> ');
  }
  
  // Clean up audio resources
  async cleanup() {
    try {
      // Stop all active tracks
      for (const [trackId, sound] of this.activeTracks.entries()) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (error) {
          console.error(`Error cleaning up track ${trackId}:`, error);
        }
      }
      
      // Clear the maps
      this.activeTracks.clear();
      this.trackVolumes.clear();
      
      console.log('KokoroAudioService cleaned up successfully');
      return true;
    } catch (error) {
      console.error('Error cleaning up KokoroAudioService:', error);
      return false;
    }
  }
}

// Export a singleton instance
export const kokoroAudio = new KokoroAudioService(); 