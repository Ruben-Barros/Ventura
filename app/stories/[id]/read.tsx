import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  ImageBackground, 
  Dimensions, 
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  Vibration,
  Easing
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Divider, Portal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import textToSpeech, { LogLevel } from '../../../services/ai/textToSpeech';
import * as Reanimated from 'react-native-reanimated';

import { useAuth } from '../../../contexts/AuthContext';
import { useStoryExperience } from '../../../contexts/StoryExperienceContext';
import { 
  InputMode, 
  VisualMode,
  StoryExperienceMode,
  StoryChoiceWithKarma 
} from '../../../types/storyExperience.types';
import { KarmaType } from '../../../services/game/karmaSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Typography from '../../../components/ui/Typography';
import Button from '../../../components/ui/Button';
import { useStoryteller } from '../../../contexts/StorytellerContext';
import { throttle } from 'lodash';
import AnimatedBackground from '../../../components/ui/AnimatedBackground';
import { useCompatibleAnimation as useCompatAnimationFallback } from '../../../components/ui/AnimationFallback';

const { width, height } = Dimensions.get('window');

// Add this interface near the top of the file, below the imports
interface Choice {
  id: string;
  text: string;
  karma?: number;
}

// Define the AudioControlsProps interface
interface AudioControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPausePlay: () => void;
  onRewind: (seconds?: number) => Promise<void>;
  onFastForward: (seconds?: number) => Promise<void>;
  disabled: boolean;
}

// Enhanced audio progress bar component with waveform visualization
const ProgressBar = ({ currentTime, duration, onSeek }) => {
  const progress = duration > 0 ? currentTime / duration : 0;
  
  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <View style={styles.progressContainer}>
      <Typography variant="caption" style={styles.timeText}>
        {formatTime(currentTime)}
      </Typography>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFg, { width: `${progress * 100}%` }]} />
        </View>
        <Pressable 
          style={styles.progressBarTouch} 
          onPress={(e) => {
            const touchX = e.nativeEvent.locationX;
            const barWidth = width - 120;
            const seekPosition = (touchX / barWidth) * duration;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSeek(seekPosition);
          }}
        />
      </View>
      
      <Typography variant="caption" style={styles.timeText}>
        {formatTime(duration)}
      </Typography>
    </View>
  );
};

// Enhanced audio controls with improved visuals
const AudioControls = React.memo(({ 
  isPlaying, 
  isPaused, 
  onPausePlay, 
  onRewind, 
  onFastForward,
  disabled
}: AudioControlsProps) => {
  return (
    <View style={styles.audioControls}>
      <TouchableOpacity 
        onPress={() => onRewind(10)} 
        style={styles.audioButton}
        disabled={disabled}
      >
        <Ionicons name="play-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={onPausePlay} 
        style={[styles.audioButton, styles.playButton]}
        disabled={disabled}
      >
        <Ionicons 
          name={isPlaying && !isPaused ? "pause" : "play"} 
          size={32} 
          color="#FFFFFF" 
        />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={() => onFastForward(10)} 
        style={styles.audioButton}
        disabled={disabled}
      >
        <Ionicons name="play-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
});

// Enhanced choice button with icons and animations
const ChoiceButton = React.memo(({ 
  choice, 
  onSelect, 
  disabled 
}: { 
  choice: Choice; 
  onSelect: (choice: Choice) => void; 
  disabled: boolean;
}) => {
  return (
    <TouchableOpacity
      style={[styles.choiceButton, disabled && styles.choiceButtonDisabled]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onSelect(choice);
      }}
      disabled={disabled}
    >
      <Typography variant="body1" style={styles.choiceText}>
        {choice.text}
      </Typography>
      {choice.karma !== undefined && (
        <View style={styles.karmaContainer}>
          <MaterialCommunityIcons 
            name={choice.karma >= 0 ? "heart" : "heart-broken"} 
            size={16} 
            color={choice.karma >= 0 ? "#FF6B6B" : "#FF6B6B"} 
          />
          <Typography variant="caption" style={styles.karmaText}>
            {Math.abs(choice.karma)}
          </Typography>
        </View>
      )}
    </TouchableOpacity>
  );
});

// Karma indicator component
const KarmaIndicator = ({ score }) => {
  let karmaType = KarmaType.NEUTRAL;
  let karmaColor = '#CCCCCC';
  let karmaText = 'Neutral';
  let karmaIcon = 'ellipsis-horizontal';
  
  if (score >= 30) {
    karmaType = KarmaType.GOOD;
    karmaColor = '#FFD700';
    karmaText = 'Good';
    karmaIcon = 'sunny';
  } else if (score <= -30) {
    karmaType = KarmaType.EVIL;
    karmaColor = '#FF6B6B';
    karmaText = 'Evil';
    karmaIcon = 'thunderstorm';
  }
  
  return (
    <View style={styles.karmaIndicator}>
      <Ionicons name={karmaIcon as any} size={16} color={karmaColor} />
      <Typography variant="caption" style={{ color: karmaColor, marginLeft: 4 }}>
        {karmaText} ({score})
      </Typography>
    </View>
  );
};

// Voice input indicator
const VoiceInputIndicator = ({ isActive, onCancel }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isActive]);
  
  if (!isActive) return null;
  
  return (
    <View style={styles.voiceIndicatorContainer}>
      <Animated.View 
        style={[
          styles.voiceIndicator,
          { transform: [{ scale: pulseAnim }] }
        ]}
      >
        <Ionicons name="mic" size={30} color="#FFFFFF" />
      </Animated.View>
      <Typography variant="caption" style={styles.voiceListeningText}>
        Listening... Say your choice
      </Typography>
      <TouchableOpacity 
        style={styles.voiceCancelButton}
        onPress={onCancel}
      >
        <Typography variant="button" style={styles.voiceCancelText}>
          Cancel
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

// Update the WaveformBar component to use the animation fallback system
const WaveformBar = ({ index, totalBars, audioLevel = 0.5 }) => {
  const leftPercent = (index / (totalBars - 1)) * 100;
  
  // Make the height responsive to audio level if provided
  // Otherwise use a random height that's more substantial
  const heightMultiplier = audioLevel || (0.3 + Math.random() * 0.4);
  const baseHeight = 20 + (heightMultiplier * 40);
  
  // Try to use our animation fallback
  const compatAnim = useCompatAnimationFallback(0);
  const { state } = useStoryExperience();
  const isPlaying = state.playbackState?.isPlaying || false;
  
  // Update the animation value when playing changes
  useEffect(() => {
    if (isPlaying) {
      // Create a random duration for natural effect
      const duration = 800 + Math.random() * 600;
      
      // Loop the animation by changing the target value
      const loop = () => {
        compatAnim.animate(1, duration, Easing.inOut(Easing.ease));
        
        // Schedule the reverse animation
        setTimeout(() => {
          compatAnim.animate(0, duration, Easing.inOut(Easing.ease));
          
          // And schedule the next iteration
          setTimeout(loop, duration);
        }, duration);
      };
      
      // Start the loop
      loop();
    } else {
      // Reset when not playing
      compatAnim.animate(0, 300);
    }
  }, [isPlaying]);
  
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${leftPercent}%`,
        bottom: 0,
        width: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Increased opacity for better visibility
        borderRadius: 2,
        height: compatAnim.value.interpolate({
          inputRange: [0, 1],
          outputRange: [baseHeight * 0.6, baseHeight]
        })
      }}
    />
  );
};

// Update SmallWaveformBar for the audio controls with compatible animation
const SmallWaveformBar = ({ index, totalBars = 10, isPlaying }) => {
  const leftPercent = (index / (totalBars - 1)) * 100;
  const baseHeight = 5 + Math.random() * 15;
  
  // Use our compatible animation system
  const compatAnim = useCompatAnimationFallback(0);
  
  useEffect(() => {
    if (isPlaying) {
      // Create random durations for natural effect
      const duration = 700 + Math.random() * 500;
      
      // Loop the animation by changing the target value
      const loop = () => {
        compatAnim.animate(1, duration, Easing.inOut(Easing.ease));
        
        // Schedule the reverse animation
        setTimeout(() => {
          compatAnim.animate(0, duration, Easing.inOut(Easing.ease));
          
          // And schedule the next iteration
          setTimeout(loop, duration);
        }, duration);
      };
      
      // Start the loop
      loop();
    } else {
      // Reset when not playing
      compatAnim.animate(0, 300);
    }
  }, [isPlaying]);
  
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${leftPercent}%`,
        bottom: 0,
        width: 2,
        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Increased opacity for better visibility
        borderRadius: 1,
        height: compatAnim.value.interpolate({
          inputRange: [0, 1],
          outputRange: [baseHeight * 0.6, baseHeight]
        })
      }}
    />
  );
};

// Main story reading screen component
export const StoryReadScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const storyId = Array.isArray(id) ? id[0] : id;
  
  // Context and state hooks
  const { user } = useAuth();
  const { state, initializeStory, pauseAudio, playAudio, rewindAudio, fastForwardAudio, makeChoice } = useStoryExperience();
  
  // Add direct audio test function
  const testDirectAudio = async () => {
    try {
      console.log('Testing direct audio playback');
      
      // Set up audio mode first
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false, // Use speaker
        allowsRecordingIOS: false,
      });
      
      // Use text-to-speech for reliability
      console.log('Using text-to-speech for audio test');
      await textToSpeech.init();
      
      // First, try short message at maximum volume
      console.log('AUDIO DEBUG: Speaking test message at maximum volume');
      await textToSpeech.speak("This is a test of the audio system. If you can hear this message, audio is working correctly.", {
        onStart: () => console.log('TTS test started'),
        onComplete: () => console.log('TTS test completed'),
        onError: (error) => console.error('TTS test error:', error)
      });
      
      // Alert to let user know sound should be playing
      alert('Audio test has been triggered. You should hear voice saying "This is a test of the audio system..."');
      
      console.log('Audio test completed');
    } catch (error) {
      console.error('Error during direct audio test:', error);
      alert(`Audio test failed with error: ${error.message}`);
    }
  };
  
  // Destructure frequently accessed state properties for better readability 
  // and to prevent unnecessary renders
  const { 
    availableChoices, 
    currentAudioSegment, 
    playbackState,
    isAtChoicePoint, 
    selectedChoice,
    isProcessingChoice,
    isLoadingNextSegment 
  } = state;
  
  // Add debug information state
  const [debugInfo, setDebugInfo] = useState({});
  
  const isPlaying = playbackState.isPlaying;
  const isPaused = playbackState.isPaused;
  const karmaScore = state.karmaScore;
  const preferredInputMode = state.userSettings.preferredInputMode;
  
  // Get storyteller context for story data
  const { selectedStoryteller } = useStoryteller();
  
  // Mock story data since we don't have a getStoryById function in the context
  const story = useMemo(() => {
    return {
      id: storyId,
      title: "The Forest of Whispers",
      description: "Venture into an ancient forest where the trees share secrets and magical beings dwell in hidden glades.",
      coverImageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000",
      // Add any other properties needed by the UI
    };
  }, [storyId]);
  
  // Local state
  const [showTranscript, setShowTranscript] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<'preparing' | 'generating' | 'finalizing' | 'ready' | 'transition'>('preparing');
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState('');
  const [hasSeenTooltip, setHasSeenTooltip] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showManualPlayButton, setShowManualPlayButton] = useState(false);
  const fireflyAnimation = useRef(null);
  const audioFeedbackAnim = useRef(new Animated.Value(1)).current;
  const [audioStatus, setAudioStatus] = useState({ level: 0.5 });
  
  // Loading screen messages to increase engagement
  const loadingMessages = useMemo(() => ({
    preparing: [
      "Once upon a time in a digital realm...",
      "Gathering the elements of your adventure...",
      "Summoning mythical creatures...",
      "Brewing potions of imagination..."
    ],
    generating: [
      "Crafting your hero's journey...",
      "Weaving plot twists and turns...",
      "Creating magical encounters...",
      "Forging the path of destiny..."
    ],
    finalizing: [
      "Polishing the narrative gems...",
      "Tuning the harmony of story and sound...",
      "Setting the stage for your entrance...",
      "The world awaits your arrival..."
    ],
    transition: [
      "The story awakens...",
      "Reality fades as imagination takes hold...",
      "Your adventure begins now...",
      "Stepping through the portal..."
    ]
  }), []);

  // Animation values for loading screen
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const progressOpacity = useRef(new Animated.Value(1)).current;
  
  // Define progressWidth as a number value, not a string with percentage
  const progressWidth = useMemo(() => {
    const phases = ['preparing', 'generating', 'finalizing', 'transition', 'ready'];
    const currentPhaseIndex = phases.indexOf(loadingPhase);
    const totalPhases = phases.length - 1; // Exclude 'ready'
    const percentComplete = (currentPhaseIndex / totalPhases) * 100;
    return Math.min(percentComplete, 100);
  }, [loadingPhase]);

  // Create pulse animation for the transition phase
  useEffect(() => {
    if (loadingPhase === 'transition') {
      // Start a pulsing animation for transition phase
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      ).start();
      
      // Also fade the progress bar slightly
      Animated.timing(progressOpacity, {
        toValue: 0.7,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset animations for other phases
      scaleAnimation.setValue(1);
      progressOpacity.setValue(1);
    }
  }, [loadingPhase, scaleAnimation, progressOpacity]);

  // Cycle through loading messages for better engagement
  useEffect(() => {
    if (isProcessingChoice) {
      // Start with preparation phase
      setLoadingPhase('preparing');
      setCurrentLoadingMessage(loadingMessages.preparing[0]);
      
      // Cycle through preparation messages
      let preparingIndex = 0;
      const preparingInterval = setInterval(() => {
        preparingIndex = (preparingIndex + 1) % loadingMessages.preparing.length;
        setCurrentLoadingMessage(loadingMessages.preparing[preparingIndex]);
      }, 2500);
      
      // Move to generating phase after 3 seconds
      const generatingTimeout = setTimeout(() => {
        clearInterval(preparingInterval);
        setLoadingPhase('generating');
        
        // Cycle through generating messages
        let generatingIndex = 0;
        setCurrentLoadingMessage(loadingMessages.generating[generatingIndex]);
        
        const generatingInterval = setInterval(() => {
          generatingIndex = (generatingIndex + 1) % loadingMessages.generating.length;
          setCurrentLoadingMessage(loadingMessages.generating[generatingIndex]);
        }, 2500);
        
        // Move to finalizing phase after another 3 seconds
        const finalizingTimeout = setTimeout(() => {
          clearInterval(generatingInterval);
          setLoadingPhase('finalizing');
          
          // Cycle through finalizing messages
          let finalizingIndex = 0;
          setCurrentLoadingMessage(loadingMessages.finalizing[finalizingIndex]);
          
          const finalizingInterval = setInterval(() => {
            finalizingIndex = (finalizingIndex + 1) % loadingMessages.finalizing.length;
            setCurrentLoadingMessage(loadingMessages.finalizing[finalizingIndex]);
          }, 2500);
          
          // Move to transition phase at around 9 seconds (to sync with audio fade)
          const transitionTimeout = setTimeout(() => {
            clearInterval(finalizingInterval);
            setLoadingPhase('transition');
            
            // Cycle through transition messages
            let transitionIndex = 0;
            setCurrentLoadingMessage(loadingMessages.transition[transitionIndex]);
            
            const transitionInterval = setInterval(() => {
              transitionIndex = (transitionIndex + 1) % loadingMessages.transition.length;
              setCurrentLoadingMessage(loadingMessages.transition[transitionIndex]);
            }, 2000); // Faster transitions here to match audio fade
            
            // Clean up the transition interval when loading completes
            return () => clearInterval(transitionInterval);
          }, 3000);
          
          return () => {
            clearInterval(finalizingInterval);
            clearTimeout(transitionTimeout);
          };
        }, 3000);
        
        return () => {
          clearInterval(preparingInterval);
          clearTimeout(generatingTimeout);
        };
      }, 3000);
      
      return () => {
        clearInterval(preparingInterval);
        clearTimeout(generatingTimeout);
      };
    }
  }, [isProcessingChoice, loadingMessages]);
  
  // Throttle state updates to prevent excessive re-renders
  const updateDebugInfo = useCallback(throttle((newInfo) => {
    setDebugInfo(current => ({ ...current, ...newInfo }));
  }, 500), []);
  
  // Add transition state for audio
  const [isIntroPlaying, setIsIntroPlaying] = useState(false);
  const [introFadingOut, setIntroFadingOut] = useState(false);
  const [narrationStarting, setNarrationStarting] = useState(false);
  
  // Initialize the story when the component mounts (once only)
  useEffect(() => {
    // Set log level to ERROR to minimize console output
    textToSpeech.setLogLevel(LogLevel.INFO); // Use INFO to see more details
    
    let isActive = true;
    let directNarrationActive = false;
    
    const loadStory = async () => {
      try {
        if (!isActive) return;
        
        // Initialize audio mode first
        console.log('Setting up audio mode...');
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false, // Use speaker
          allowsRecordingIOS: false,
        });
        console.log('Audio mode set successfully');
        
        // Initialize TTS service first
        console.log('Initializing TTS service...');
        await textToSpeech.init();
        if (isActive) {
          console.log('TTS initialized successfully');
          updateDebugInfo({ ttsInitialized: true });
        }
        
        // Then load the story
        console.log('About to call initializeStory for story ID:', storyId);
        
        // Keep a reference to the loading state
        setLoadingPhase('generating');
        
        // Call the initialize story function
        await initializeStory(storyId);
        console.log('Story initialization completed');
        
        // Create a safety timeout to check for state
        let checkAttempts = 0;
        const maxAttempts = 5;
        
        const checkState = () => {
          checkAttempts++;
          console.log(`Checking state attempt ${checkAttempts}...`);
          
          // Check if the component is still mounted
          if (!isActive) return;
          
          // Log the current state for debugging
          console.log('Current state after initialization:', { 
            hasStory: !!state.storyId,
            storyId: state.storyId,
            currentSegmentExists: !!state.currentSegment,
            segmentId: state.currentSegment?.id || 'none'
          });
          
          if (state.currentSegment) {
            console.log('Current segment is available:', state.currentSegment.id);
            updateDebugInfo({ 
              segmentLoaded: true,
              segmentId: state.currentSegment.id,
              hasContent: !!state.currentSegment.content
            });
            
            // Mark audio as ready AND start intro sequence
            setAudioReady(true);
            setLoadingPhase('ready');
            
            // Start the intro audio sequence automatically
            playIntroSequence();
            
            // Zoom in background slightly when starting automatically
            Animated.timing(backgroundZoom, {
              toValue: 1.05,
              duration: 1000,
              useNativeDriver: true
            }).start();
          } else if (checkAttempts < maxAttempts) {
            // Try again after a delay
            console.log(`Segment not available yet, retrying in 300ms (attempt ${checkAttempts}/${maxAttempts})...`);
            setTimeout(checkState, 300);
          } else {
            // After max attempts, implement direct narration as fallback
            console.warn('Failed to detect segment in state after multiple attempts - using direct narration fallback');
            
            // Use direct narration as fallback
            startDirectNarration();
          }
        };
        
        // Function to play the intro sequence with proper transitions
        const playIntroSequence = async () => {
          try {
            console.log('Starting intro sequence with auto-playback...');
            
            // Set loading state to complete and audio as ready
            setLoadingPhase('ready');
            setAudioReady(true);
            
            // Set state that intro is playing
            setIsIntroPlaying(true);
            
            // First narrate a brief intro
            const introText = "Welcome to the Forest of Whispers.";
            
            // Start the waveform animation
            const animateWaveform = () => {
              setAudioStatus(prev => ({ 
                level: 0.3 + Math.random() * 0.7 
              }));
            };
            
            // Start updating audio levels every 200ms
            const audioLevelInterval = setInterval(animateWaveform, 200);
            
            try {
              // Play intro with callbacks
              await textToSpeech.speak(introText, {
                onStart: () => {
                  console.log('Intro narration started');
                  
                  // Start visual feedback for audio
                  Animated.timing(audioFeedbackAnim, {
                    toValue: 1.2,
                    duration: 800,
                    useNativeDriver: true
                  }).start();
                },
                onComplete: async () => {
                  console.log('Intro narration completed');
                  
                  // Clear the audio level interval
                  clearInterval(audioLevelInterval);
                  
                  // Add a clear pause between intro and main narration (2 seconds)
                  console.log('Adding pause between intro and main narration');
                  setIntroFadingOut(true);
                  
                  // Wait for pause to complete
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  // Reset intro state
                  setIsIntroPlaying(false);
                  setIntroFadingOut(false);
                  
                  // Begin main narration
                  console.log('Starting main narration after pause');
                  startMainNarration();
                },
                onError: (error) => {
                  console.error('Error during intro playback:', error);
                  clearInterval(audioLevelInterval);
                  
                  // Skip to main narration on error
                  setIsIntroPlaying(false);
                  startMainNarration();
                }
              });
            } catch (error) {
              console.error('Error during TTS speak:', error);
              clearInterval(audioLevelInterval);
              
              // Skip to main narration
              setIsIntroPlaying(false);
              startMainNarration();
            }
          } catch (error) {
            console.error('Error in playIntroSequence:', error);
            // Fallback to direct narration
            setIsIntroPlaying(false);
            startMainNarration();
          }
        };
        
        // Function to start the main narration
        const startMainNarration = async () => {
          try {
            console.log('Starting main narration');
            
            // Ensure we're showing the correct UI state
            setLoadingPhase('ready');
            setAudioReady(true);
            
            // Automatically start playing the main narration
            await playAudio();
            
            // Zoom in background slightly for immersive effect
            Animated.timing(backgroundZoom, {
              toValue: 1.05,
              duration: 1500,
              useNativeDriver: true
            }).start();
            
          } catch (error) {
            console.error('Error starting main narration:', error);
            // Show manual play button as last resort
            setShowManualPlayButton(true);
          }
        }
        
        // Function to start direct narration (bypassing the normal flow)
        const startDirectNarration = async () => {
          try {
            directNarrationActive = true;
            console.log('Starting direct narration as fallback');
            console.log('AUDIO DEBUG: Initializing direct narration with TTS');
            
            // Extended immersive introduction for manual start (15 seconds when narrated)
            const introText = `You find yourself standing at the edge of a vast, ancient forest that seems to breathe with a life of its own. The towering trees stretch their gnarled branches toward the darkening sky, their leaves whispering secrets carried by the wind. The air is thick with the scent of moss, pine, and something otherworldly that you can't quite identify. A narrow, winding path disappears into the shadows between the trees, beckoning you forward. As you take your first step, a distant melody seems to float through the air – perhaps just the wind, or perhaps something more. The forest holds many stories, and yours is about to begin. The choices you make from this moment forward will shape not only your path but who you will become. Take a deep breath, and step into the unknown.`;
            
            // Initialize TTS if needed
            const attemptTTS = async () => {
              try {
                console.log('AUDIO DEBUG: Attempting to initialize TTS');
                await textToSpeech.init();
                console.log('AUDIO DEBUG: TTS initialized successfully');
                
                // Set audio to ready state
                setAudioReady(true);
                
                // Speak the introduction
                console.log('AUDIO DEBUG: Starting to speak intro text');
                await textToSpeech.speak(introText, {
                  onStart: () => {
                    console.log('AUDIO DEBUG: TTS onStart callback fired');
                    updateDebugInfo({ isPlaying: true, isPaused: false });
                  },
                  onComplete: () => {
                    console.log('AUDIO DEBUG: TTS onComplete callback fired');
                  },
                  onError: (error) => {
                    console.error('AUDIO DEBUG: TTS error in callback:', error);
                  }
                });
                console.log('AUDIO DEBUG: TTS speak method completed');
              } catch (error) {
                console.error('AUDIO DEBUG: Failed to initialize TTS:', error);
                // Retry once after a short delay
                setTimeout(attemptTTS, 1000);
              }
            };
            
            // Start TTS attempt
            attemptTTS();
            
            // Zoom in background slightly when starting
            Animated.timing(backgroundZoom, {
              toValue: 1.05,
              duration: 1000,
              useNativeDriver: true
            }).start();
          } catch (error) {
            console.error('Failed to start direct narration:', error);
            setShowManualPlayButton(true);
          }
        };
        
        // Start the state checking process
        checkState();
        
        // Add a safety timeout for direct narration if nothing else worked
        setTimeout(() => {
          console.log('10 seconds timeout check - ensuring narration starts');
          if (!directNarrationActive && !isPlaying && isActive) {
            console.log('No narration detected after 10 seconds, using direct fallback');
            startDirectNarration();
          }
        }, 10000);
        
      } catch (error) {
        console.error('Error loading story:', error);
        if (isActive) {
          alert('Could not load story. Please try again.');
        }
      }
    };
    
    loadStory();
    
    // Cleanup function for when component unmounts
    return () => {
      isActive = false;
      directNarrationActive = false;
      pauseAudio();
      textToSpeech.stop();
      textToSpeech.cleanup();
    };
  }, [storyId]); // Only depends on storyId
  
  // Monitor voice input state for choice selection
  useEffect(() => {
    if (isAtChoicePoint && preferredInputMode === 'voice') {
      // In a real app, we would activate the microphone here
      // For demo purposes, we'll just log it
      console.log('Voice input ready for choice selection');
    }
  }, [isAtChoicePoint, preferredInputMode]);
  
  // Monitor the TTS playing state
  useEffect(() => {
    updateDebugInfo({ ttsPlaying: textToSpeech.isSpeechActive() });
    
    // Polling is not ideal but helps debug TTS issues
    const checkInterval = setInterval(() => {
      updateDebugInfo({ ttsPlaying: textToSpeech.isSpeechActive() });
    }, 2000);
    
    return () => clearInterval(checkInterval);
  }, [updateDebugInfo]);
  
  // Handle back button press
  const handleBackPress = useCallback(() => {
    pauseAudio();
    router.back();
  }, [router, pauseAudio]);
  
  // Toggle transcript visibility
  const toggleTranscript = useCallback(() => {
    setShowTranscript(prev => !prev);
  }, []);
  
  // Handle choice selection
  const handleSelectChoice = useCallback((choice) => {
    console.log('Selected choice:', choice.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    makeChoice(choice.id);
  }, [makeChoice]);
  
  // Handle voice input for choosing options
  const handleStartVoiceInput = useCallback(() => {
    setIsVoiceActive(true);
    // In a real app, we would start listening for voice input here
    
    // Mock voice recognition for demo
    setTimeout(() => {
      setIsVoiceActive(false);
      // Select a random choice for demo purposes
      if (availableChoices.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableChoices.length);
        handleSelectChoice(availableChoices[randomIndex]);
      }
    }, 3000);
  }, [availableChoices, handleSelectChoice]);
  
  // Add missing handler for canceling voice input
  const handleCancelVoiceInput = useCallback(() => {
    setIsVoiceActive(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);
  
  // Animation values for dynamic background
  const backgroundZoom = useRef(new Animated.Value(1)).current;
  
  // Effect to animate background when story plays
  useEffect(() => {
    if (isPlaying && !isPaused) {
      // Zoom in the background slightly for immersion
      Animated.timing(backgroundZoom, {
        toValue: 1.05,
        duration: 10000,
        useNativeDriver: true
      }).start();
    } else {
      // Reset zoom when paused
      Animated.timing(backgroundZoom, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }).start();
    }
  }, [isPlaying, isPaused]);
  
  // Toggle playback with haptic feedback
  const togglePlaybackWithFeedback = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  }, [isPlaying, pauseAudio, playAudio]);
  
  // Handle seeking to a specific position in the audio
  const seekToPosition = useCallback((position) => {
    console.log('Seeking to position:', position);
    
    // Try using TTS seek if audio player isn't available
    try {
      // Using direct function call instead of seekTo method
      console.log('Attempting to seek by restarting TTS at current position');
      if (currentAudioSegment?.transcript) {
        textToSpeech.stop();
        // Restart with current transcript
        textToSpeech.speak(currentAudioSegment.transcript);
      }
    } catch (error) {
      console.error('Error seeking to position:', error);
    }
  }, [currentAudioSegment]);
  
  // Check if user has seen tooltip before
  useEffect(() => {
    const checkTooltipStatus = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenTooltip');
        if (value !== null) {
          setHasSeenTooltip(true);
        } else {
          setShowTooltip(true);
          // Hide tooltip after 5 seconds
          setTimeout(() => {
            setShowTooltip(false);
            // Save that user has seen tooltip
            AsyncStorage.setItem('hasSeenTooltip', 'true');
          }, 5000);
        }
      } catch (error) {
        console.error('Error checking tooltip status:', error);
      }
    };
    
    checkTooltipStatus();
  }, []);

  // Pulse animation for audio feedback
  useEffect(() => {
    if (isPlaying && !isPaused) {
      // Create a pulsing animation for audio feedback
      Animated.loop(
        Animated.sequence([
          Animated.timing(audioFeedbackAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(audioFeedbackAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      // Stop animation when audio is not playing
      audioFeedbackAnim.stopAnimation();
      audioFeedbackAnim.setValue(1);
    }
  }, [isPlaying, isPaused, audioFeedbackAnim]);
  
  // Monitor for choice point and stop narration if needed
  useEffect(() => {
    if (isAtChoicePoint && isPlaying) {
      console.log('At choice point, pausing narration until user makes a choice');
      pauseAudio();
      textToSpeech.stop();
    }
  }, [isAtChoicePoint, isPlaying]);
  
  // Main render
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: '',
          headerShown: false,
        }}
      />
      
      {/* Main Story View (when not loading or error) */}
      {!isProcessingChoice && !state.error && (
        <>
          {/* Story title at top */}
          <View style={styles.titleContainer}>
            <Typography variant="h6" style={styles.storyTitle}>
              Chapter 1: The Forest's Edge
            </Typography>
          </View>
        
          {/* Story progress timeline */}
          <View style={styles.timelineContainer}>
            <View style={styles.timelineTrack}>
              <View style={styles.timelineProgress} />
              
              {/* Milestone markers */}
              <View style={[styles.timelineDot, styles.timelineDotActive]}>
                <View style={styles.timelineDotInner} />
              </View>
              
              <View style={[styles.timelineDot, styles.timelineDotUpcoming, {left: '33%'}]}>
                <View style={styles.timelineDotInnerEmpty} />
              </View>
              
              <View style={[styles.timelineDot, styles.timelineDotUpcoming, {left: '66%'}]}>
                <View style={styles.timelineDotInnerEmpty} />
              </View>
              
              <View style={[styles.timelineDot, styles.timelineDotUpcoming, {right: 0}]}>
                <View style={styles.timelineDotInnerEmpty} />
              </View>
            </View>
          </View>
          
          {/* Floating pause button when story is playing */}
          {audioReady && isPlaying && (
            <TouchableOpacity 
              style={styles.floatingPauseButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                togglePlaybackWithFeedback();
              }}
              accessibilityLabel={isPaused ? "Play Kokoro TTS audio" : "Pause Kokoro TTS audio"}
            >
              <Ionicons 
                name={isPaused ? "play" : "pause"} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
          )}
          
          {/* Main content area */}
          <View style={styles.content}>
            {/* Karma indicator (if karma system is active) */}
            {state.userSettings.showKarmaChanges && (
              <View style={styles.karmaContainer}>
                <KarmaIndicator score={karmaScore} />
              </View>
            )}
            
            {/* Initial story start button (if audio not started) */}
            {!audioReady && (
              <View style={styles.startOverlay}>
                <View style={styles.startButtonContainer}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Typography variant="h5" style={styles.startText}>
                    Preparing your story...
                  </Typography>
                  <Typography variant="body1" style={styles.startSubText}>
                    Narration will begin automatically
                  </Typography>
                </View>
              </View>
            )}
            
            {/* Transcript Area (Conditionally Shown) */}
            {showTranscript && (
              <ScrollView style={styles.transcriptArea}>
                <Typography variant="body2" style={styles.transcriptText}>
                  {currentAudioSegment?.transcript || 'No transcript available.'}
                </Typography>
              </ScrollView>
            )}
            
            {/* Loading Next Segment Indicator */}
            {isLoadingNextSegment && (
              <View style={styles.loadingNextContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Typography variant="body2" style={styles.loadingNextText}>
                  Loading next part of the story...
                </Typography>
              </View>
            )}
            
            {/* Audio Status Indicator with Waveform - cleaner design */}
            {isPlaying && !isAtChoicePoint && !isPaused && (
              <View style={styles.audioStatusContainer}>
                <Animated.View style={{
                  transform: [{ scale: audioFeedbackAnim }]
                }}>
                  <Ionicons name="volume-high" size={18} color="#00CED1" />
                </Animated.View>
                <Typography variant="caption" style={styles.audioStatusText}>
                  Narrating story
                </Typography>
                
                {/* Animated Waveform Visualization */}
                <View style={styles.waveformContainer}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <SmallWaveformBar key={`wave-${index}`} index={index} totalBars={10} isPlaying={isPlaying && !isPaused} />
                  ))}
                </View>
              </View>
            )}
            
            {/* Full Screen Waveform Visualization - centralized and more mesmerizing */}
            <View style={styles.fullScreenWaveform}>
              {Array.from({ length: 15 }).map((_, i) => (
                <WaveformBar 
                  key={`waveform-${i}`} 
                  index={i} 
                  totalBars={15} 
                  audioLevel={audioStatus.level} 
                />
              ))}
            </View>
          </View>
          
          {/* Bottom Control Area */}
          <View style={styles.controlArea}>
            {/* Audio Controls */}
            <View style={[styles.audioControlsContainer, isAtChoicePoint ? { marginBottom: 16 } : {}]}>
              <View style={styles.audioControlsInner}>
                <ProgressBar 
                  currentTime={playbackState.currentTime}
                  duration={playbackState.duration}
                  onSeek={seekToPosition}
                />
                <AudioControls
                  isPlaying={isPlaying}
                  isPaused={isPaused}
                  onPausePlay={togglePlaybackWithFeedback}
                  onRewind={rewindAudio}
                  onFastForward={fastForwardAudio}
                  disabled={!audioReady}
                />
              </View>
            </View>
            
            {/* Choice Selection Area - only shown when narrative is complete and at choice point */}
            {isAtChoicePoint && (
              <View style={styles.choiceButtonsContainer}>
                <Typography variant="h6" style={styles.choiceHeader}>
                  What will you do?
                </Typography>
                
                {availableChoices.map((choice, index) => {
                  // Create compatible Choice object with actual text
                  const safeChoice: Choice = {
                    id: choice.id,
                    text: choice.choice_text || `Option` // Ensure text property exists
                  };
                  
                  return (
                    <ChoiceButton
                      key={choice.id}
                      choice={safeChoice}
                      onSelect={handleSelectChoice}
                      disabled={isProcessingChoice}
                    />
                  );
                })}
              </View>
            )}
            
            {/* First-time user guidance tooltip */}
            {showTooltip && (
              <View style={styles.guidanceTip}>
                <Typography variant="caption" style={styles.guidanceText}>
                  Listen to the story with Kokoro TTS, then choose your path below
                </Typography>
              </View>
            )}
          </View>
        </>
      )}
      
      {/* Voice input indicator (when active) */}
      {isVoiceActive && (
        <Portal>
          <VoiceInputIndicator 
            isActive={isVoiceActive} 
            onCancel={handleCancelVoiceInput} 
          />
        </Portal>
      )}

      {/* Fallback Manual Play Button (if auto-start fails) */}
      {audioReady && !isPlaying && showManualPlayButton && (
        <TouchableOpacity
          style={styles.manualStartButton}
          onPress={() => {
            // Provide haptic feedback for better UX
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            
            // Try normal playback first
            playAudio();
            
            // If that doesn't work after a short delay, use direct narration
            setTimeout(() => {
              if (!isPlaying) {
                console.log('Manual button pressed but normal playback failed, using direct TTS');
                // Extended immersive introduction for manual start (15 seconds when narrated)
                const introText = `You find yourself standing at the edge of a vast, ancient forest that seems to breathe with a life of its own. The towering trees stretch their gnarled branches toward the darkening sky, their leaves whispering secrets carried by the wind. The air is thick with the scent of moss, pine, and something otherworldly that you can't quite identify. A narrow, winding path disappears into the shadows between the trees, beckoning you forward. As you take your first step, a distant melody seems to float through the air – perhaps just the wind, or perhaps something more. The forest holds many stories, and yours is about to begin. The choices you make from this moment forward will shape not only your path but who you will become. Take a deep breath, and step into the unknown.`;
                
                // Update UI state manually since we removed dispatch
                // We'll have to rely on the context's internal state management
                textToSpeech.speak(introText, {
                  onStart: () => console.log('Manual direct narration started'),
                  onComplete: () => console.log('Manual direct narration completed')
                });
              }
            }, 500);
            
            // Zoom in background slightly when starting
            Animated.timing(backgroundZoom, {
              toValue: 1.05,
              duration: 1000,
              useNativeDriver: true
            }).start();
          }}
          accessibilityLabel="Begin the story manually"
        >
          <View style={styles.manualStartButtonInner}>
            <Ionicons name="play" size={30} color="#FFFFFF" />
            <Typography variant="body1" style={styles.manualStartText}>
              Tap to start narration
            </Typography>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingBottom: 60,
  },
  content: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#000000',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  storyTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  floatingPauseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  startOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  startButtonContainer: {
    alignItems: 'center',
  },
  startText: {
    color: '#FFFFFF',
    fontSize: 24,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  startSubText: {
    color: '#FFFFFF',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  transcriptArea: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    maxHeight: 200,
  },
  transcriptText: {
    color: '#FFFFFF',
  },
  loadingNextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 20,
  },
  loadingNextText: {
    color: '#FFFFFF',
    marginTop: 16,
  },
  audioStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 12,
    maxWidth: '60%',
  },
  audioStatusText: {
    color: '#FFFFFF',
    marginLeft: 6,
    fontSize: 12,
  },
  controlArea: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    zIndex: 10,
  },
  audioControlsContainer: {
    marginBottom: 16,
    marginTop: 8,
    alignItems: 'center',
    width: '100%',
  },
  audioControlsInner: {
    width: '95%', // Fixed width for inner container
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 8,
  },
  choiceButtonsContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
  },
  choiceHeader: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  guidanceTip: {
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  guidanceText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  waveformContainer: {
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  waveformBar: {
    width: 1,
    marginHorizontal: 2,
    borderRadius: 1,
  },
  fullScreenWaveform: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3, // Higher z-index to be more visible
    pointerEvents: 'none', // Don't intercept touch events
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  waveformInnerContainer: {
    position: 'absolute',
    width: '90%', // Wider to fill more of the screen
    height: '80%', // Taller to be more prominent
    top: '10%', // Position from top for centering
    alignSelf: 'center', // Center horizontally
  },
  fullScreenWaveformBar: {
    position: 'absolute',
    bottom: '10%', // Start higher from the bottom
    width: 2.5, // Slightly thicker bars
  },
  manualStartButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 100,
  },
  manualStartButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manualStartText: {
    color: '#FFFFFF',
    marginLeft: 10,
  },
  timelineContainer: {
    padding: 16,
    zIndex: 10,
  },
  timelineTrack: {
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  timelineProgress: {
    height: '100%',
    backgroundColor: '#5B76CB',
    borderRadius: 10,
    width: '15%',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    top: 4,
    marginTop: 0,
    marginLeft: -6,
    left: 0,
  },
  timelineDotActive: {
    backgroundColor: '#5B76CB',
  },
  timelineDotUpcoming: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  timelineDotInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 4,
    left: 4,
  },
  timelineDotInnerEmpty: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 4,
    left: 4,
  },
  currentMilestoneContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  milestoneIcon: {
    marginBottom: 4,
  },
  milestoneText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  nextMilestoneContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  nextMilestoneText: {
    color: 'rgba(255,255,255,0.6)',
  },
  karmaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  voiceIndicatorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  voiceIndicator: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceListeningText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 10,
  },
  voiceCancelButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
  },
  voiceCancelText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    marginHorizontal: 12,
  },
  progressBarBg: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFg: {
    height: '100%',
    backgroundColor: '#E50914',
    borderRadius: 2,
  },
  progressBarTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    minWidth: 45,
  },
  audioControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E50914',
  },
  choiceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  choiceButtonDisabled: {
    opacity: 0.5,
  },
  choiceText: {
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12,
  },
  karmaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  karmaText: {
    color: '#FFFFFF',
    marginLeft: 4,
  },
}); 

export default StoryReadScreen; 