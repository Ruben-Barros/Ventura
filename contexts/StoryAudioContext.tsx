import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { storyAudioPlayer, AudioTrackType } from '../services/audio/storyAudioPlayer';
import textToSpeech from '../services/ai/textToSpeech';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { useStoryExperience } from './StoryExperienceContext';
import { Platform } from 'react-native';

// Define placeholder audio for development - using LOCAL files as requested
const LOCAL_AUDIO = {
  // Local audio files - these files now exist as empty placeholders in the assets/audio directory
  intro: require('../assets/audio/intro_chime.mp3'),
  choicePrompt: require('../assets/audio/choice_prompt.mp3'),
  choiceSelected: require('../assets/audio/choice_selected.mp3'),
  forestAmbiance: require('../assets/audio/forest_ambiance.mp3'),
  caveAmbiance: require('../assets/audio/cave_ambiance.mp3'),
  footsteps: require('../assets/audio/footsteps.mp3')
};

// Define the context state type
interface StoryAudioContextState {
  isIntroPlaying: boolean;
  isNarrationPlaying: boolean;
  isAudioReady: boolean;
  isAtChoicePoint: boolean;
  isAmbianceActive: boolean;
  ambianceType: string;
  narrationPosition: number;
  narrationDuration: number;
  currentVoice: string;
  pauseNarration: () => Promise<void>;
  resumeNarration: () => Promise<void>;
  playIntroSequence: () => Promise<void>;
  startNarration: (text: string, ssml?: boolean) => Promise<void>;
  handleChoiceSelected: (choiceId: string, choiceText: string) => Promise<void>;
  setCurrentEnvironment: (environment: string) => Promise<void>;
  playEffectSound: (effectName: string) => Promise<void>;
  stopAllAudio: () => Promise<void>;
  setVoice: (voiceKey: string) => void;
}

// Create the context with default values
const StoryAudioContext = createContext<StoryAudioContextState>({
  isIntroPlaying: false,
  isNarrationPlaying: false,
  isAudioReady: false,
  isAtChoicePoint: false,
  isAmbianceActive: false,
  ambianceType: 'forest',
  narrationPosition: 0,
  narrationDuration: 0,
  currentVoice: 'warm',
  pauseNarration: async () => {},
  resumeNarration: async () => {},
  playIntroSequence: async () => {},
  startNarration: async () => {},
  handleChoiceSelected: async () => {},
  setCurrentEnvironment: async () => {},
  playEffectSound: async () => {},
  stopAllAudio: async () => {},
  setVoice: () => {},
});

// Provider component
export const StoryAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isIntroPlaying, setIsIntroPlaying] = useState<boolean>(false);
  const [isNarrationPlaying, setIsNarrationPlaying] = useState<boolean>(false);
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false);
  const [isAtChoicePoint, setIsAtChoicePoint] = useState<boolean>(false);
  const [isAmbianceActive, setIsAmbianceActive] = useState<boolean>(false);
  const [ambianceType, setAmbianceType] = useState<string>('forest'); // Default environment
  const [environment, setEnvironment] = useState<string>('forest'); // Initialize environment here
  const [narrationPosition, setNarrationPosition] = useState<number>(0);
  const [narrationDuration, setNarrationDuration] = useState<number>(0);
  const [currentVoice, setCurrentVoice] = useState<string>('warm');
  
  // Access the story experience context
  const { state, currentStory } = useStoryExperience();
  
  // Track loaded audio resources
  const loadedResources = useRef<Set<string>>(new Set());
  
  // Flag for whether sound effects are enabled (no network errors)
  const [hasSoundEffects, setHasSoundEffects] = useState(false);
  
  // Reference to track initialization status
  const isInitialized = useRef<boolean>(false);
  
  // Initialize audio on component mount
  useEffect(() => {
    const setupAudio = async () => {
      try {
        // Initialize the audio player
        await storyAudioPlayer.init();
        
        // Initialize text-to-speech
        await textToSpeech.init();
        
        // Set the default voice
        textToSpeech.setVoice(currentVoice);
        
        // Set up audio update callback
        storyAudioPlayer.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setNarrationPosition(status.positionMillis || 0);
            setNarrationDuration(status.durationMillis || 0);
            setIsNarrationPlaying(status.isPlaying);
          }
        });
        
        // Pre-load common audio resources
        const hasEffectsLoaded = await preloadAudioResources();
        setHasSoundEffects(hasEffectsLoaded);
        
        setIsAudioReady(true);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
        // Even if there's an error, we'll still set audio as ready
        // so the app can function with just text-to-speech
        setIsAudioReady(true);
        setHasSoundEffects(false);
      }
    };
    
    setupAudio();
    
    // Clean up on unmount
    return () => {
      cleanupAudio();
    };
  }, []);
  
  // Preload essential audio resources
  const preloadAudioResources = async () => {
    // We'll track if at least one audio resource loaded successfully
    let anyResourceLoaded = false;
    
    try {
      // Try to load the intro sound first using LOCAL audio files
      try {
        await storyAudioPlayer.loadAudioAsset(
          LOCAL_AUDIO.intro,
          'intro_chime',
          AudioTrackType.INTRO,
          { volume: 0.9 }
        );
        console.log('Successfully loaded intro_chime from local file');
        loadedResources.current.add('intro_chime');
        anyResourceLoaded = true;
        
        // If intro loaded, try loading other sounds
        if (anyResourceLoaded) {
          await loadOtherSoundEffects();
        }
      } catch (introError) {
        console.error('Failed to load intro_chime from local file:', introError);
        // Even if intro fails, try loading other sounds
        try {
          await loadOtherSoundEffects();
        } catch (otherError) {
          console.error('Failed to load other sound effects:', otherError);
        }
      }
    } catch (error) {
      console.error('Error in preloadAudioResources:', error);
    }
    
    return anyResourceLoaded;
  };
  
  // Helper function to load the other sound effects
  const loadOtherSoundEffects = async () => {
    // Choice prompt
    try {
      await storyAudioPlayer.loadAudioAsset(
        LOCAL_AUDIO.choicePrompt, 
        'choice_prompt',
        AudioTrackType.CHOICE_CUE,
        { volume: 0.7 }
      );
      console.log('Successfully loaded choice_prompt from local file');
      loadedResources.current.add('choice_prompt');
    } catch (error) {
      console.error('Failed to load choice_prompt from local file:', error);
    }
    
    // Choice selected sound
    try {
      await storyAudioPlayer.loadAudioAsset(
        LOCAL_AUDIO.choiceSelected,
        'choice_selected',
        AudioTrackType.EFFECT,
        { volume: 0.7 }
      );
      console.log('Successfully loaded choice_selected from local file');
      loadedResources.current.add('choice_selected');
    } catch (error) {
      console.error('Failed to load choice_selected from local file:', error);
    }
    
    // Forest ambiance
    try {
      await storyAudioPlayer.loadAudioAsset(
        LOCAL_AUDIO.forestAmbiance,
        'forest_ambiance',
        AudioTrackType.AMBIENT,
        { loop: true, volume: 0.2 }
      );
      console.log('Successfully loaded forest_ambiance from local file');
      loadedResources.current.add('forest_ambiance');
    } catch (error) {
      console.error('Failed to load forest_ambiance from local file:', error);
    }
    
    // If footsteps not already loaded, add them too
    if (!loadedResources.current.has('footsteps')) {
      try {
        await storyAudioPlayer.loadAudioAsset(
          LOCAL_AUDIO.footsteps,
          'footsteps',
          AudioTrackType.EFFECT,
          { volume: 0.7 }
        );
        console.log('Successfully loaded footsteps from local file');
        loadedResources.current.add('footsteps');
      } catch (error) {
        console.error('Failed to load footsteps from local file:', error);
      }
    }
  };
  
  // Clean up audio resources
  const cleanupAudio = async () => {
    try {
      // Stop all playback
      await stopAllAudio();
      
      // Clean up audio player
      await storyAudioPlayer.cleanup();
      
      // Clean up TTS
      await textToSpeech.cleanup();
      
      console.log('Audio resources cleaned up');
    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
  };
  
  // Set voice for narration
  const setVoice = (voiceKey: string) => {
    textToSpeech.setVoice(voiceKey);
    setCurrentVoice(voiceKey);
  };
  
  // Play intro sequence before starting narration
  const playIntroSequence = async () => {
    console.log("Starting intro sequence...");
    
    // Set intro playing state
    setIsIntroPlaying(true);
    
    try {
      // Before trying to play, verify the track is really loaded
      if (hasSoundEffects && loadedResources.current.has('intro_chime')) {
        console.log("Attempting to play intro_chime...");
        try {
          await storyAudioPlayer.playTrack('intro_chime', {
            volume: 0.6,
            fadeIn: 1000
          });
          console.log("Intro sound playing successfully");
        } catch (error) {
          console.warn("Failed to play intro sound, but continuing with narration", error);
        }
      } else {
        console.log("Intro sound not available, skipping directly to narration");
      }
      
      // Set the environment for the first segment
      try {
        // Use the environment from the storyExperience context
        const initialEnvironment = currentStory?.currentSegment?.environment || 'forest';
        await setCurrentEnvironment(initialEnvironment);
        console.log(`Environment set to ${initialEnvironment}`);
      } catch (envError) {
        console.error("Error setting environment:", envError);
        // Continue despite environment error
      }
      
      // Delay completion slightly to avoid jumping straight to narration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mark intro as complete
      setIsIntroPlaying(false);
    } catch (error) {
      console.error("Error in intro sequence:", error);
      // Ensure we don't stay in intro playing state
      setIsIntroPlaying(false);
    }
  };
  
  /**
   * Start narration with the given text
   */
  const startNarration = async (text: string, ssml: boolean = false) => {
    try {
      console.log(`=== Starting narration (${text.length} chars) ===`);
      
      // Stop any ongoing audio first
      console.log('Stopping any existing audio...');
      await stopAllAudio();
      
      // Set narration state to playing
      setIsNarrationPlaying(true);
      
      // Force an audio mode setting here to ensure audio works
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          interruptionModeIOS: 1,
          interruptionModeAndroid: 1,
          playThroughEarpieceAndroid: false
        });
        console.log('Audio mode set successfully for narration');
      } catch (err) {
        console.warn('Failed to set audio mode, but continuing anyway:', err);
      }
      
      // Always use SSML for better quality if in SSML mode
      const formattedText = ssml ? text : `<speak>${text}</speak>`;
      
      // Reinitialize Kokoro TTS service to ensure it's ready
      console.log('Ensuring TTS service is ready...');
      await textToSpeech.init();
      
      // Set the voice again to ensure it's using the correct voice
      textToSpeech.setVoice(currentVoice);
      
      // Start narration with Kokoro TTS - with a delay to ensure everything is ready
      console.log("Calling Kokoro TTS speak() with maximum volume (1.0)");
      
      // Use a promise to track completion
      const narrationPromise = new Promise<boolean>((resolve) => {
        setTimeout(async () => {
          try {
            const success = await textToSpeech.speak(formattedText, {
              ssml: true, // Always use SSML for better quality
              voice: currentVoice,
              volume: 1.0, // Maximum volume
              rate: 1.0,   // Normal rate
              onStart: () => {
                console.log('TTS narration started successfully');
                setIsNarrationPlaying(true);
              },
              onComplete: () => {
                console.log('TTS narration completed');
                setIsNarrationPlaying(false);
                setIsAtChoicePoint(true);
                resolve(true);
              },
              onError: (error) => {
                console.error('Error during TTS narration:', error);
                setIsNarrationPlaying(false);
                resolve(false);
              }
            });
            
            if (!success) {
              console.warn('TTS speak() returned false, narration may not have started');
              setIsNarrationPlaying(false);
              resolve(false);
              
              // As a fallback, try once more with a longer delay
              setTimeout(async () => {
                console.log('Attempting narration again after initial failure...');
                try {
                  await textToSpeech.speak(formattedText, {
                    ssml: true,
                    voice: currentVoice,
                    volume: 1.0,
                    rate: 1.0
                  });
                } catch (retryErr) {
                  console.error('Retry failed:', retryErr);
                }
              }, 1000);
            }
          } catch (error) {
            console.error('Error calling TTS speak():', error);
            setIsNarrationPlaying(false);
            resolve(false);
          }
        }, 500); // 500ms delay to ensure everything is ready
      });
      
      // Don't wait for the promise to resolve before returning
      return Promise.resolve();
    } catch (error) {
      console.error('Error in startNarration:', error);
      setIsNarrationPlaying(false);
      return Promise.reject(error);
    }
  };
  
  // Pause narration (for choices)
  const pauseNarration = async () => {
    try {
      if (isNarrationPlaying) {
        await textToSpeech.pause();
        setIsNarrationPlaying(false);
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Error pausing narration:', error);
      return Promise.reject(error);
    }
  };
  
  // Resume narration after a pause
  const resumeNarration = async () => {
    try {
      if (!isNarrationPlaying && !isAtChoicePoint) {
        await textToSpeech.resume();
        setIsNarrationPlaying(true);
      }
      return Promise.resolve();
    } catch (error) {
      console.error('Error resuming narration:', error);
      return Promise.reject(error);
    }
  };
  
  // Handle when a choice is selected
  const handleChoiceSelected = async (choiceId: string, choiceText: string) => {
    try {
      // We're no longer at a choice point
      setIsAtChoicePoint(false);
      
      // Play choice selected sound if available and sound effects are enabled
      if (hasSoundEffects && loadedResources.current.has('choice_selected')) {
        await storyAudioPlayer.playTrack('choice_selected');
      }
      
      // Play footsteps effect if the choice is about movement
      if (hasSoundEffects && 
          (choiceText.toLowerCase().includes('follow') || 
           choiceText.toLowerCase().includes('walk') || 
           choiceText.toLowerCase().includes('go')) &&
          loadedResources.current.has('footsteps')) {
        await storyAudioPlayer.playTrack('footsteps');
      }
      
      // Wait a moment before continuing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error handling choice selection:', error);
      return Promise.reject(error);
    }
  };
  
  // Set the current environment/ambiance
  const setCurrentEnvironment = async (newEnvironment: string) => {
    console.log(`Setting environment to "${newEnvironment}"`);
    
    try {
      // Update environment state first
      setEnvironment(newEnvironment || 'forest');
      
      // Don't proceed if sound effects aren't available
      if (!hasSoundEffects) {
        console.log('Sound effects disabled, skipping ambient sounds');
        return;
      }
      
      // Stop current ambient sounds if playing
      if (isAmbianceActive) {
        try {
          await storyAudioPlayer.stopTracksByType(AudioTrackType.AMBIENT);
          setIsAmbianceActive(false);
        } catch (stopError) {
          console.warn('Error stopping previous ambient sounds:', stopError);
          // Continue even if stopping fails
        }
      }
      
      // Load and play new ambiance based on environment
      if (newEnvironment === 'forest' && loadedResources.current.has('forest_ambiance')) {
        try {
          await storyAudioPlayer.playTrack('forest_ambiance', {
            fadeIn: 1000,
            loop: true,
            volume: 0.15
          });
          setIsAmbianceActive(true);
          setAmbianceType('forest');
          console.log('Forest ambiance playing');
        } catch (playError) {
          console.warn('Failed to play forest ambiance:', playError);
        }
      } else if (newEnvironment === 'cave') {
        // Ensure cave ambiance is loaded first
        await loadCaveEnvironment();
        
        if (loadedResources.current.has('cave_ambiance')) {
          try {
            await storyAudioPlayer.playTrack('cave_ambiance', {
              fadeIn: 1000,
              loop: true,
              volume: 0.15
            });
            setIsAmbianceActive(true);
            setAmbianceType('cave');
            console.log('Cave ambiance playing');
          } catch (playError) {
            console.warn('Failed to play cave ambiance:', playError);
          }
        }
      } else {
        console.log(`No ambiance available for environment: ${newEnvironment}`);
      }
    } catch (error) {
      console.error('Error setting environment:', error);
      // Return but don't throw, allowing story to continue without ambiance
    }
  };
  
  // Play a sound effect by name
  const playEffectSound = async (effectName: string) => {
    try {
      // Skip if sound effects are disabled or the effect isn't loaded
      if (!hasSoundEffects || !loadedResources.current.has(effectName)) {
        console.warn(`Effect ${effectName} is not loaded or sound effects are disabled`);
        return Promise.resolve();
      }
      
      // Play the effect
      await storyAudioPlayer.playTrack(effectName);
      
      return Promise.resolve();
    } catch (error) {
      console.error(`Error playing effect ${effectName}:`, error);
      return Promise.reject(error);
    }
  };
  
  // Stop all audio playback
  const stopAllAudio = async () => {
    try {
      // Stop all audio tracks if sound effects are enabled
      if (hasSoundEffects) {
        await storyAudioPlayer.stop();
      }
      
      // Stop TTS
      await textToSpeech.stop();
      
      // Reset state
      setIsIntroPlaying(false);
      setIsNarrationPlaying(false);
      setIsAtChoicePoint(false);
      setIsAmbianceActive(false);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error stopping all audio:', error);
      return Promise.reject(error);
    }
  };
  
  // Helper function to load cave environment sounds
  const loadCaveEnvironment = async () => {
    // Check if environment is defined and is 'cave' before proceeding
    if (!environment) {
      console.warn('Environment not initialized yet, defaulting to forest');
      return;
    }
    
    if (environment === 'cave' && !loadedResources.current.has('cave_ambiance')) {
      try {
        await storyAudioPlayer.loadAudioAsset(
          LOCAL_AUDIO.caveAmbiance,
          'cave_ambiance',
          AudioTrackType.AMBIENT,
          { volume: 0.15, loop: true }
        );
        console.log('Successfully loaded cave_ambiance from local file');
        loadedResources.current.add('cave_ambiance');
      } catch (error) {
        console.warn('Failed to load cave_ambiance from local file', error);
      }
    }
  };
  
  // Create the context value object
  const contextValue: StoryAudioContextState = {
    isIntroPlaying,
    isNarrationPlaying,
    isAudioReady,
    isAtChoicePoint,
    isAmbianceActive,
    ambianceType,
    narrationPosition,
    narrationDuration,
    currentVoice,
    pauseNarration,
    resumeNarration,
    playIntroSequence,
    startNarration,
    handleChoiceSelected,
    setCurrentEnvironment,
    playEffectSound,
    stopAllAudio,
    setVoice,
  };
  
  return (
    <StoryAudioContext.Provider value={contextValue}>
      {children}
    </StoryAudioContext.Provider>
  );
};

// Custom hook to use the audio context
export const useStoryAudio = () => {
  const context = useContext(StoryAudioContext);
  
  if (!context) {
    throw new Error('useStoryAudio must be used within a StoryAudioProvider');
  }
  
  return context;
};

export default StoryAudioContext; 