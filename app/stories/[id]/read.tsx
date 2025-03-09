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
  Easing,
  Image,
  StatusBar,
  ViewStyle,
  TextStyle,
  ImageStyle,
  FlatList
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, Button, Portal } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import * as Reanimated from 'react-native-reanimated';
import { BlurView } from '@react-native-community/blur';
import textToSpeech, { LogLevel } from '../../../services/ai/textToSpeech';
import { useStoryExperience } from '../../../contexts/StoryExperienceContext';
import { KarmaType } from '../../../services/game/karmaSystem';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  InputMode, 
  VisualMode,
  StoryExperienceMode,
  StoryChoiceWithKarma 
} from '../../../types/storyExperience.types';
import { StoryChoice } from '../../../types/story.types';
import { useStoryteller } from '../../../contexts/StorytellerContext';
import { throttle } from 'lodash';
import AnimatedBackground from '../../../components/ui/AnimatedBackground';
import { useCompatibleAnimation as useCompatAnimationFallback } from '../../../components/ui/AnimationFallback';
import { ProgressBar as PaperProgressBar } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

// Add formatTime function at the top level
const formatTime = (milliseconds: number) => {
  if (!Number.isFinite(milliseconds)) return '0:00';
  const totalSeconds = Math.floor(milliseconds / 1000) || 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

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
  // Ensure we have valid numbers and handle edge cases
  const safeCurrentTime = Number.isFinite(currentTime) ? Math.max(0, currentTime) : 0;
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 1;
  
  // Calculate progress with bounds checking and integer conversion
  const progress = Math.min(1, Math.max(0, Math.floor((safeCurrentTime / safeDuration) * 100) / 100)) || 0;
  
  const formatTime = (milliseconds: number) => {
    if (!Number.isFinite(milliseconds)) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000) || 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <View style={styles.progressContainer}>
      <Typography variant="caption" style={styles.timeText}>
        {formatTime(safeCurrentTime)}
      </Typography>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFg, { width: `${Math.floor(progress * 100)}%` }]} />
          </View>
        <Pressable 
          style={styles.progressBarTouch} 
          onPress={(e) => {
            const touchX = e.nativeEvent.locationX;
            const barWidth = width - 120; // Account for padding and time labels
            let seekPosition = (touchX / barWidth) * safeDuration;
            
            // Ensure seekPosition is valid before calling onSeek
            if (Number.isFinite(seekPosition)) {
              seekPosition = Math.floor(Math.max(0, Math.min(seekPosition, safeDuration)));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSeek(seekPosition);
            }
          }}
        />
      </View>
      
      <Typography variant="caption" style={styles.timeText}>
        {formatTime(safeDuration)}
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
  choice: StoryChoice; 
  onSelect: (choice: StoryChoice) => void; 
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
        {choice.choice_text}
      </Typography>
      {(choice as StoryChoiceWithKarma).karmaImpact && (
        <View style={styles.karmaContainer}>
          <MaterialCommunityIcons 
            name={(choice as StoryChoiceWithKarma).karmaImpact?.type === KarmaType.GOOD ? "heart" : "heart-broken"} 
            size={16} 
            color={(choice as StoryChoiceWithKarma).karmaImpact?.type === KarmaType.GOOD ? "#32CD32" : "#FF4500"} 
          />
          <Typography variant="caption" style={styles.karmaText}>
            {Math.abs((choice as StoryChoiceWithKarma).karmaImpact?.value || 0)}
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
  // Ensure valid numeric values
  const safeIndex = Math.max(0, Math.min(Number.isFinite(index) ? index : 0, (totalBars || 1) - 1));
  const safeTotalBars = Math.max(1, Number.isFinite(totalBars) ? totalBars : 1);
  const safeAudioLevel = Number.isFinite(audioLevel) ? Math.min(1, Math.max(0, audioLevel)) : 0.5;
  
  // Calculate position and dimensions
  const leftPercent = Math.floor((safeIndex / (safeTotalBars - 1)) * 100);
  const heightMultiplier = safeAudioLevel || (0.3 + Math.random() * 0.4);
  const baseHeight = Math.floor(20 + (heightMultiplier * 40));
  
  // Try to use our animation fallback
  const compatAnim = useCompatAnimationFallback(0);
  const { state } = useStoryExperience();
  const isPlaying = state.playbackState?.isPlaying || false;
  
  // Update the animation value when playing changes
  useEffect(() => {
    if (isPlaying) {
      // Create a random duration for natural effect
      const duration = 800 + Math.floor(Math.random() * 600);
      
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
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 2,
        height: compatAnim.value.interpolate({
          inputRange: [0, 1],
          outputRange: [Math.floor(baseHeight * 0.6), baseHeight],
          extrapolate: 'clamp'
        })
      }}
    />
  );
};

// Update SmallWaveformBar for the audio controls with compatible animation
const SmallWaveformBar = ({ index, totalBars = 10, isPlaying }) => {
  // Ensure valid numeric values
  const safeIndex = Math.max(0, Math.min(Number.isFinite(index) ? index : 0, (totalBars || 1) - 1));
  const safeTotalBars = Math.max(1, Number.isFinite(totalBars) ? totalBars : 10);
  
  // Calculate position and dimensions
  const leftPercent = Math.floor((safeIndex / (safeTotalBars - 1)) * 100);
  const baseHeight = Math.floor(5 + Math.random() * 15);
  
  // Use our compatible animation system
  const compatAnim = useCompatAnimationFallback(0);
  
  useEffect(() => {
    if (isPlaying) {
      // Create random durations for natural effect
      const duration = 700 + Math.floor(Math.random() * 500);
      
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
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 1,
        height: compatAnim.value.interpolate({
          inputRange: [0, 1],
          outputRange: [Math.floor(baseHeight * 0.6), baseHeight],
          extrapolate: 'clamp'
        })
      }}
    />
  );
};

// Enhanced Waveform component with SVG
const Waveform = ({ isPlaying, amplitude = 0.5 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const safeAmplitude = Number.isFinite(amplitude) ? Math.min(1, Math.max(0, amplitude)) : 0.5;

  useEffect(() => {
    if (isPlaying) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease)
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease)
          })
        ])
      );
      
      animation.start();
      
      return () => {
        animation.stop();
        animatedValue.setValue(0);
      };
    } else {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [isPlaying]);

  // Calculate dimensions once
  const barWidth = 3;
  const spacing = Math.floor((width - 32 - (30 * barWidth)) / 29); // Ensure integer spacing
  const baseHeight = 20;
  const maxScale = safeAmplitude * 2;

  return (
    <View style={styles.waveformContainer}>
      {Array.from({ length: 30 }).map((_, index) => {
        // Calculate x position using integer math
        const x = Math.floor(index * (barWidth + spacing));
        
        return (
          <Animated.View 
            key={index} 
            style={[
              styles.waveformBar,
              {
                left: x,
                width: barWidth,
                height: baseHeight,
                transform: [{
                  scaleY: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, maxScale],
                    extrapolate: 'clamp'
                  })
                }]
              }
            ]} 
          />
        );
      })}
    </View>
  );
};

// Update the KarmaBar component
const KarmaBar = ({ karma }) => {
  const colors = karma > 0 
    ? ['#228B22', '#32CD32'] as const
    : karma < 0 
      ? ['#FF4500', '#FF6347'] as const
      : ['#666666', '#888888'] as const;

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.karmaBar}
    >
      <Text style={styles.karmaText}>
        {karma > 0 ? 'Heroic' : karma < 0 ? 'Chaotic' : 'Neutral'} ({karma})
      </Text>
    </LinearGradient>
  );
};

// Add TypeScript interface for styles
interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  headerTextContainer: ViewStyle;
  headerTitle: TextStyle;
  storyTitle: TextStyle;
  castButton: ViewStyle;
  content: ViewStyle;
  coverImage: ImageStyle;
  hqBadge: ViewStyle;
  hqText: TextStyle;
  lyricsButton: ViewStyle;
  lyricsButtonText: TextStyle;
  bottomControls: ViewStyle;
  progressContainer: ViewStyle;
  timeText: TextStyle;
  progressBarContainer: ViewStyle;
  progressBarBg: ViewStyle;
  progressBarFg: ViewStyle;
  controls: ViewStyle;
  playButton: ViewStyle;
  bottomActions: ViewStyle;
  actionButton: ViewStyle;
  progressBarTouch: ViewStyle;
  audioControls: ViewStyle;
  audioButton: ViewStyle;
  choiceButton: ViewStyle;
  choiceButtonDisabled: ViewStyle;
  choiceText: TextStyle;
  karmaContainer: ViewStyle;
  karmaText: TextStyle;
  karmaIndicator: ViewStyle;
  voiceIndicatorContainer: ViewStyle;
  voiceIndicator: ViewStyle;
  voiceListeningText: TextStyle;
  voiceCancelButton: ViewStyle;
  voiceCancelText: TextStyle;
  waveformContainer: ViewStyle;
  waveformBar: ViewStyle;
  karmaBar: ViewStyle;
  choicesOverlay: ViewStyle;
  genresTitle: TextStyle;
  circleContainer: ViewStyle;
  pinkCircle: ViewStyle;
  flowCircle: ViewStyle;
  flowText: TextStyle;
  genreItem: ViewStyle;
  genreIcon: TextStyle;
  genreText: TextStyle;
  // Position styles for each genre
  rockPosition: ViewStyle;
  kpopPosition: ViewStyle;
  popPosition: ViewStyle;
  rnbPosition: ViewStyle;
  altPosition: ViewStyle;
  rapPosition: ViewStyle;
  favoritesContainer: ViewStyle;
  favoriteButtons: ViewStyle;
  whiteButton: ViewStyle;
  purpleButton: ViewStyle;
  favoritesText: TextStyle;
  choicesContainer: ViewStyle;
  choicesTitle: TextStyle;
  choicesGrid: ViewStyle;
  choiceIcon: TextStyle;
  choiceStoryContext: TextStyle;
  choiceQuestion: TextStyle;
  countdownContainer: ViewStyle;
  countdownBg: ViewStyle;
  countdownFg: ViewStyle;
  countdownText: TextStyle;
  choicesScrollView: ViewStyle;
  choicesScrollContent: ViewStyle;
  choiceButtonSelected: ViewStyle;
  choiceIconContainer: ViewStyle;
  choiceTextContainer: ViewStyle;
  feedbackBadge: ViewStyle;
  feedbackText: TextStyle;
  choiceDescription: TextStyle;
  choiceArrow: TextStyle;
  karmaTooltip: ViewStyle;
  karmaTooltipText: TextStyle;
  confirmationBadge: ViewStyle;
  confirmationText: TextStyle;
  choiceContainer: ViewStyle;
  choiceInfoContainer: ViewStyle;
  listContainer: ViewStyle;
  choiceList: ViewStyle;
  loadingOverlay: ViewStyle;
  loadingText: TextStyle;
}

// Main story reading screen component
export const StoryReadScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const storyId = Array.isArray(id) ? id[0] : id;
  
  // Add isLoading state variable
  const [isLoading, setIsLoading] = useState(false);
  
  // Context and state hooks
  const { user, profile } = useAuth();
  const { state, initializeStory, pauseAudio, playAudio, rewindAudio, fastForwardAudio, makeChoice } = useStoryExperience();
  
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
            
            // Start the intro sequence automatically
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
            console.log('Playing intro sequence before starting narration...');
            
            // Set loading state to complete and audio as ready
            setLoadingPhase('ready');
            setAudioReady(true);
            
            // Set state that intro is playing
            setIsIntroPlaying(true);
            
            // Create and play intro sound
            const playIntroSound = async () => {
              try {
                // Use a simple timeout instead of TTS to create a pause
                console.log('Creating intro pause before starting narration');
                
                // Create a 1.5 second pause before narration starts
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                console.log('Intro pause complete');
                
                // Reset intro state
                setIsIntroPlaying(false);
                
                // Start main narration after intro completes
                startMainNarration();
              } catch (error) {
                console.error('Error during intro pause:', error);
                // Reset intro state on error
                setIsIntroPlaying(false);
                // Fallback to direct narration
                startMainNarration();
              }
            };
            
            // Start the intro effect
            playIntroSound();
            
          } catch (error) {
            console.error('Error in playIntroSequence:', error);
            // Reset intro state on error
            setIsIntroPlaying(false);
            // Fallback to direct narration
            startMainNarration();
          }
        };
        
        // Modify the function to start narration and ensure it ends with "What will you do?"
        const startMainNarration = async () => {
          try {
            console.log('Starting main narration');
            
            // Ensure we're showing the correct UI state
            setLoadingPhase('ready');
            setAudioReady(true);
            
            // Get the current segment content from the state
            const segmentContent = state.currentSegment?.content || '';
            
            // Ensure narration ends with "What will you do?"
            if (state.availableChoices && state.availableChoices.length > 0) {
              try {
                // Stop any ongoing narration
                textToSpeech.stop();
                
                // Split the content into sentences
                const sentences = segmentContent.split(/(?<=[.!?])\s+/);
                
                // Use all but the last sentence to provide context
                const narrativeContext = sentences.slice(0, Math.max(sentences.length - 1, 1)).join(' ');
                
                // Add the question at the end with proper spacing
                const fullNarration = narrativeContext.trim() + " What will you do?";
                
                console.log('Narrating content that ends with "What will you do?"');
                
                // Narrate with the modified content
                await textToSpeech.speak(fullNarration, {
                  onStart: () => {
                    console.log('Main narration with choice prompt started');
                  },
                  onComplete: () => {
                    console.log('Main narration completed, now showing choices');
                    // Instead of directly using dispatch, use the setAtChoicePoint function
                    // or another approach available in the component
                    setTimeout(() => {
                      if (state.availableChoices && state.availableChoices.length > 0) {
                        // Use a manual flag to indicate narration is complete
                        setNarrationComplete(true);
                        // The isAtChoicePoint will be set by the context automatically
                      }
                    }, 300);
                  },
                  onError: (error) => {
                    console.error('Error during narration:', error);
                    // Also handle errors without using dispatch
                    setTimeout(() => {
                      if (state.availableChoices && state.availableChoices.length > 0) {
                        setNarrationComplete(true);
                      }
                    }, 300);
                  }
                });
                
                return;
              } catch (error) {
                console.error('Error in custom narration:', error);
                // Fall back to standard playAudio
              }
            }
            
            // Fallback: Use standard audio playback if no choices or if custom narration failed
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
        };
        
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
  
  // Hooks for the choice UI that were previously inside renderChoices
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(null);
  const buttonScale = useRef(new Animated.Value(1)).current;
  
  // Add state for karma feedback tooltip
  const [showKarmaTooltip, setShowKarmaTooltip] = useState(false);
  const [karmaFeedback, setKarmaFeedback] = useState({ type: '', value: 0 });
  
  // Story-specific narrative context (example titles)
  const storyContext = {
    title: "",
    question: "What will you do next?"
  };
  
  // Narrative-specific choices with contextual labels
  const narrativeChoices = [
    { 
      id: 0, 
      icon: 'sword', 
      label: 'Confront the Whispering Shadow',
      description: 'Take a stand against the unknown presence' 
    },
    { 
      id: 1, 
      icon: 'run-fast', 
      label: 'Flee Through the Misty Path',
      description: 'Seek safety in the depths of the forest' 
    },
    { 
      id: 2, 
      icon: 'chat', 
      label: 'Call Out to the Presence',
      description: 'Attempt to communicate with whatever lurks nearby' 
    },
    { 
      id: 3, 
      icon: 'hand-peace', 
      label: 'Offer a Sign of Peace',
      description: 'Show that you mean no harm' 
    },
    { 
      id: 4, 
      icon: 'eye', 
      label: 'Search the Surrounding Area',
      description: 'Look for clues or hidden paths' 
    },
    { 
      id: 5, 
      icon: 'flashlight', 
      label: 'Investigate the Strange Sounds',
      description: 'Determine the source of the disturbance' 
    }
  ];
  
  // Helper function for time expiration - moved outside renderChoices
  const handleTimeExpired = () => {
    // Select the "observe" option (usually the most neutral)
    const defaultChoice = availableChoices[4];
    if (defaultChoice) {
      handleSelectChoice(defaultChoice);
    }
  };
  
  // Set up countdown timer effect - moved outside renderChoices
  useEffect(() => {
    if (!isAtChoicePoint) return;
    
    // Reset timer when choices become available
    setTimeRemaining(30);
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          // Auto-select a neutral option when time expires
          handleTimeExpired();
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isAtChoicePoint, availableChoices]);

  // Set up effect for button animation that runs when selectedButtonIndex changes
  useEffect(() => {
    if (selectedButtonIndex !== null) {
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease)
        }),
        Animated.timing(buttonScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        })
      ]).start(() => {
        setSelectedButtonIndex(null);
      });
    }
  }, [selectedButtonIndex, buttonScale]);

  const renderChoices = () => {
    if (!isAtChoicePoint) return null;
    
    // Calculate timer progress here (not using any hooks)
    const timerProgress = timeRemaining / 30;
    
    return (
      <View style={styles.choicesContainer}>
        {/* Story context header */}
        
        {/* Choice prompt question */}
        <Text style={styles.choiceQuestion}>{storyContext.question}</Text>
        
        {/* Countdown timer */}
        <View style={styles.countdownContainer}>
          <View style={styles.countdownBg}>
            <View 
              style={[
                styles.countdownFg, 
                { 
                  width: `${timerProgress * 100}%`,
                  backgroundColor: timerProgress < 0.3 ? '#FF0000' : '#00A8FF' 
                }
              ]} 
            />
          </View>
          <Text style={styles.countdownText}>{timeRemaining}s</Text>
        </View>
        
        {/* Vertical list of choices */}
        <ScrollView 
          style={styles.choicesScrollView}
          contentContainerStyle={styles.choicesScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {narrativeChoices.map((choice, index) => {
            const actualChoice = availableChoices[choice.id % availableChoices.length];
            const isActive = !!actualChoice;
            const isSelected = selectedButtonIndex === index;
            
            return (
              <Animated.View 
                key={index}
                style={[
                  { transform: [{ scale: isSelected ? buttonScale : 1 }] }
                ]}
              >
                <TouchableOpacity 
                  style={[
                    styles.choiceButton,
                    selectedButtonIndex === index && styles.choiceButtonSelected
                  ]}
                  onPress={() => {
                    if (isActive && !isProcessingChoice) {
                      setSelectedButtonIndex(index);
                      
                      // Simple delay before handling the choice
                      setTimeout(() => {
                        handleSelectChoice(actualChoice);
                      }, 300);
                    }
                  }}
                  disabled={!isActive || isProcessingChoice}
                  activeOpacity={0.7}
                >
                  <View style={styles.choiceIconContainer}>
                    <MaterialCommunityIcons 
                      name={choice.icon as any}
                      size={28} 
                      color="#FFFFFF"
                    />
                  </View>
                  
                  <View style={styles.choiceTextContainer}>
                    <Text style={styles.choiceText}>{choice.label}</Text>
                    <Text style={styles.choiceDescription}>{choice.description}</Text>
                  </View>
                  
                  <MaterialCommunityIcons 
                    name="chevron-right" 
                    size={24} 
                    color="#E50914"
                    style={styles.choiceArrow}
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
        
        {/* Feedback badge (appears after selection) */}
        {isProcessingChoice && selectedChoice && (
          <View style={styles.feedbackBadge}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={20} 
              color="#00FF00"
            />
            <Text style={styles.feedbackText}>Choice Confirmed</Text>
          </View>
        )}
        
        {/* Karma tooltip (shown after selection) */}
        {showKarmaTooltip && (
          <View style={styles.karmaTooltip}>
            <Text style={styles.karmaTooltipText}>
              {karmaFeedback.type} {karmaFeedback.value} Karma
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Update the karma display to use defined styles
  const renderKarmaDisplay = () => {
    // First check if selectedChoice exists and is an object
    if (!selectedChoice || typeof selectedChoice !== 'object') return null;
    
    // Then safely cast to StoryChoiceWithKarma
    const choice = selectedChoice as StoryChoiceWithKarma;
    if (!choice.karmaImpact) return null;

    return (
      <View style={styles.bottomActions}>
        <MaterialCommunityIcons
          name={choice.karmaImpact.type === KarmaType.GOOD ? "heart" : "heart-broken"}
          size={16}
          color={choice.karmaImpact.type === KarmaType.GOOD ? "#32CD32" : "#FF4500"}
        />
        <Text style={styles.karmaText}>
          {Math.abs(choice.karmaImpact.value || 0)}
        </Text>
      </View>
    );
  };

  // Handle choice selection
  const handleSelectChoice = useCallback(async (choice: StoryChoice) => {
    try {
      // Already selected a choice, don't allow another selection
      if (selectedButtonIndex !== null) return;
      
      // Pause any existing countdown
      if (countdownTimerRef.current) {
        clearTimeout(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      
      // Set the selected choice
      setSelectedButtonIndex(choice.id);
      
      // Show the confirmation badge
      Animated.parallel([
        Animated.timing(confirmationBadgeOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(confirmationBadgeScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.elastic(1.2),
          useNativeDriver: true,
        })
      ]).start();
      
      // Short delay to show button animation before proceeding
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Make the choice
      makeChoice(choice.id);
      
      // Reset countdown and animations for next choice
      countdownAnim.setValue(1);
      confirmationBadgeOpacity.setValue(0);
      confirmationBadgeScale.setValue(0.5);
      
    } catch (error) {
      console.error('Error handling choice selection:', error);
    }
  }, [selectedButtonIndex, makeChoice, confirmationBadgeOpacity, confirmationBadgeScale, countdownAnim]);
  
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
  
  // Create state to track if narration is complete
  const [narrationComplete, setNarrationComplete] = useState(false);
  
  // Create a custom effect that will BLOCK choices from showing until narration is complete
  // This overrides the automatic behavior in the context
  useEffect(() => {
    // Create a listener for choice point changes
    if (isAtChoicePoint) {
      console.log("CHOICE OVERRIDE: Choice point detected, but blocking until narration completes");
      
      // Force choices to be hidden until narration completes
      // This overrides the context's automatic behavior
      const hideChoicesUntilNarrationComplete = async () => {
        // Wait for any ongoing narration to complete
        if (playbackState.isPlaying) {
          console.log("CHOICE OVERRIDE: Waiting for narration to finish before showing choices");
          
          // Stop current audio if it's playing (let any narration complete first)
          if (textToSpeech && typeof textToSpeech.stop === 'function') {
            try {
              await textToSpeech.stop();
            } catch (e) {
              console.log("Error stopping TTS:", e);
            }
          }
          
          // Add a small pause for better flow
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Add the "What will you do?" prompt
          try {
            console.log("CHOICE OVERRIDE: Adding 'What will you do?' prompt");
            await textToSpeech.speak("What will you do?", {
              onComplete: () => {
                // Now we can show choices
                console.log("CHOICE OVERRIDE: Now showing choices after narration");
                setNarrationComplete(true);
              }
            });
          } catch (e) {
            console.log("Error with final prompt:", e);
            // Show choices anyway if there's an error
            setNarrationComplete(true);
          }
        } else {
          // If no narration is playing, still ensure proper flow
          console.log("CHOICE OVERRIDE: No narration playing, adding final prompt");
          
          try {
            // Add a small pause for better flow
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Always end with "What will you do?"
            await textToSpeech.speak("What will you do?", {
              onComplete: () => {
                // Now we can show choices
                console.log("CHOICE OVERRIDE: Now showing choices after prompt");
                setNarrationComplete(true);
              }
            });
          } catch (e) {
            console.log("Error with final prompt:", e);
            // Show choices anyway if there's an error
            setNarrationComplete(true);
          }
        }
      };
      
      // Start the process
      hideChoicesUntilNarrationComplete();
    } else {
      // Reset when not at a choice point
      setNarrationComplete(false);
    }
  }, [isAtChoicePoint, playbackState.isPlaying]);

  // New state for enhanced features
  const [dailyChoices, setDailyChoices] = useState(0);
  const [storyPoints, setStoryPoints] = useState(0);
  const [badgeEarned, setBadgeEarned] = useState(false);
  const [showSocialPeek, setShowSocialPeek] = useState(false);

  // Background animation ref
  const forestAnimation = useRef(null);

  // Add back the handleProgressPress function
  const handleProgressPress = (e: any) => {
    const touchX = e.nativeEvent.locationX;
    const barWidth = width - 120;
    let seekPosition = (touchX / barWidth) * playbackState.duration;
    
    if (Number.isFinite(seekPosition)) {
      seekPosition = Math.floor(Math.max(0, Math.min(seekPosition, playbackState.duration)));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      seekToPosition(seekPosition);
    }
  };

  // Refs for animations
  const countdownAnim = useRef(new Animated.Value(1)).current;
  const choiceListOpacity = useRef(new Animated.Value(0)).current;
  const choiceInfoOpacity = useRef(new Animated.Value(0)).current;
  const confirmationBadgeOpacity = useRef(new Animated.Value(0)).current;
  const confirmationBadgeScale = useRef(new Animated.Value(0.5)).current;
  
  // Initialize audio service
  useEffect(() => {
    // Initialize Kokoro audio service
    const initAudio = async () => {
      try {
        await kokoroAudio.initialize();
        // Preload common sounds
        await kokoroAudio.preloadSounds();
        console.log('Kokoro audio service initialized');
      } catch (error) {
        console.error('Failed to initialize Kokoro audio service:', error);
      }
    };
    
    initAudio();
    
    // Clean up audio on unmount
    return () => {
      kokoroAudio.cleanup();
    };
  }, []);
  
  // Show choices with animation once narration completes
  useEffect(() => {
    if (isAtChoicePoint && !isProcessingChoice) {
      // Fade in choices
      Animated.sequence([
        Animated.timing(choiceInfoOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(choiceListOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Start countdown for auto-selection
      startChoiceCountdown();
    } else {
      // Reset animations when not at a choice point
      choiceListOpacity.setValue(0);
      choiceInfoOpacity.setValue(0);
      setSelectedButtonIndex(null);
    }
  }, [isAtChoicePoint, isProcessingChoice]);
  
  // Render choice confirmation badge
  const renderConfirmationBadge = () => (
    <Animated.View 
      style={[
        styles.confirmationBadge,
        {
          opacity: confirmationBadgeOpacity,
          transform: [{ scale: confirmationBadgeScale }]
        }
      ]}
    >
      <Text style={styles.confirmationText}>Choice Confirmed</Text>
    </Animated.View>
  );
  
  // Main render
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Story Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Now Playing
          </Text>
          <Text style={styles.storyTitle}>
            {story?.title || 'Loading...'}
          </Text>
        </View>
        <TouchableOpacity style={styles.castButton}>
          <Ionicons name="radio-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* Main Content - removed HQ badge and Lyrics button */}
      <View style={styles.content}>
        {!isAtChoicePoint && (
          <Image
            source={require('../../../assets/images/Netflix iOS 91.png')}
            style={styles.coverImage}
            resizeMode="contain"
          />
        )}
        
        {/* Only show choices when isAtChoicePoint AND narrationComplete are true */}
        {isAtChoicePoint && narrationComplete && renderChoices()}
      </View>
      
      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <View style={styles.progressContainer}>
          <Text style={styles.timeText}>
            {formatTime(playbackState.currentTime)}
          </Text>
          <Pressable style={styles.progressBarContainer} onPress={handleProgressPress}>
            <View style={styles.progressBarBg}>
              <View 
                style={[
                  styles.progressBarFg, 
                  { width: `${Math.min(100, Math.max(0, Math.floor((playbackState.currentTime / (playbackState.duration || 1)) * 100)))}%` }
                ]} 
              />
            </View>
          </Pressable>
          <Text style={styles.timeText}>
            {formatTime(playbackState.duration - playbackState.currentTime)}
          </Text>
        </View>
        
        <View style={styles.controls}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => rewindAudio(10)}
            disabled={isLoading}
          >
            <Ionicons name="play-back" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playButton}
            onPress={togglePlaybackWithFeedback}
            disabled={isLoading}
          >
            <Ionicons 
              name={isPlaying && !isPaused ? "pause" : "play"} 
              size={40} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => fastForwardAudio(10)}
            disabled={isLoading}
          >
            <Ionicons name="play-forward" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {selectedChoice && renderKarmaDisplay()}
      {isVoiceActive && (
        <VoiceInputIndicator 
          isActive={isVoiceActive} 
          onCancel={handleCancelVoiceInput} 
        />
      )}
      
      {/* Choice UI */}
      {isAtChoicePoint && !isProcessingChoice && (
        <View style={styles.choiceContainer}>
          <Animated.View 
            style={[styles.choiceInfoContainer, { opacity: choiceInfoOpacity }]}
          >
            <Text style={styles.choiceQuestion}>What will you do?</Text>
            <Animated.View style={[styles.countdownContainer, { transform: [{ scaleX: countdownAnim }] }]} />
          </Animated.View>
          
          <Animated.View style={[styles.listContainer, { opacity: choiceListOpacity }]}>
            <FlatList
              data={availableChoices}
              keyExtractor={item => item.id}
              renderItem={renderChoices}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.choiceList}
            />
          </Animated.View>
          
          {renderConfirmationBadge()}
        </View>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E50914" />
          <Text style={styles.loadingText}>Loading next chapter...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default StoryReadScreen;

// Fix the styles object
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.7,
  },
  storyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  castButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  coverImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    borderRadius: 8,
  },
  hqBadge: {
    position: 'absolute',
    top: '15%',
    right: 40,
    backgroundColor: '#E50914',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  hqText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  lyricsButton: {
    position: 'absolute',
    right: 40,
    bottom: '15%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  lyricsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControls: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.7,
    minWidth: 45,
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
  },
  progressBarFg: {
    height: '100%',
    backgroundColor: '#E50914',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 32,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
  },
  actionButton: {
    padding: 8,
  },
  progressBarTouch: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  audioButton: {
    padding: 12,
    marginHorizontal: 8,
  },
  choiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  choiceButtonDisabled: {
    opacity: 0.5,
  },
  choiceText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  karmaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  karmaText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
  },
  karmaIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  voiceIndicatorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  voiceIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E50914',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceListeningText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
  },
  voiceCancelButton: {
    marginTop: 16,
    padding: 8,
  },
  voiceCancelText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.7,
  },
  waveformContainer: {
    width: '100%',
    height: 60,
    position: 'relative',
  },
  waveformBar: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1,
  },
  karmaBar: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  choicesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
  },
  genresTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: 'white',
    marginTop: '15%',
    marginBottom: 40,
  },
  circleContainer: {
    width: width * 0.8,
    height: width * 0.8,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinkCircle: {
    width: '100%',
    height: '100%',
    borderRadius: width * 0.4,
    position: 'absolute',
  },
  flowCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowText: {
    color: 'white',
    fontSize: 32,
    fontWeight: '700',
  },
  genreItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
  },
  genreIcon: {
    textAlign: 'center',
    marginBottom: 5,
  },
  genreText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Position styles for each genre
  rockPosition: {
    top: '15%',
    left: '25%',
  },
  kpopPosition: {
    top: '10%',
    alignSelf: 'center',
  },
  popPosition: {
    top: '15%',
    right: '25%',
  },
  rnbPosition: {
    top: '50%',
    right: '10%',
  },
  altPosition: {
    bottom: '15%',
    alignSelf: 'center',
  },
  rapPosition: {
    top: '50%',
    left: '10%',
  },
  favoritesContainer: {
    position: 'absolute',
    bottom: '15%',
    alignItems: 'center',
  },
  favoriteButtons: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  whiteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  purpleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9C27B0',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
    zIndex: 2,
  },
  favoritesText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  choicesContainer: {
    width: '100%',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingTop: 20,
    paddingBottom: 40,
  },
  choicesTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  choicesGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  choiceIcon: {
    marginBottom: 8,
  },
  choiceStoryContext: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  choiceQuestion: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 20,
    textAlign: 'center',
  },
  countdownContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#4A4A4A',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  countdownFg: {
    height: '100%',
    backgroundColor: '#00A8FF',
    borderRadius: 4,
  },
  countdownText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    width: 30,
    textAlign: 'right',
  },
  choicesScrollView: {
    width: '100%',
    maxHeight: 380,
  },
  choicesScrollContent: {
    paddingBottom: 16,
  },
  choiceButtonSelected: {
    backgroundColor: 'rgba(40, 40, 40, 0.9)',
  },
  choiceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  choiceTextContainer: {
    flex: 1,
  },
  choiceArrow: {
    marginLeft: 8,
  },
  feedbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    position: 'absolute',
    bottom: 16,
    borderWidth: 1,
    borderColor: '#00FF00',
  },
  feedbackText: {
    color: '#00FF00',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  choiceDescription: {
    color: '#B0B0B0', // Light gray for secondary text
    fontSize: 14,
    marginTop: 4,
  },
  karmaTooltip: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -20 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E50914', // Netflix red
    zIndex: 1000,
  },
  karmaTooltipText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmationBadge: {
    position: 'absolute',
    backgroundColor: '#E50914',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    bottom: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmationText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  choiceContainer: {
    width: '100%',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingTop: 20,
    paddingBottom: 40,
  },
  choiceInfoContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  listContainer: {
    width: '100%',
    maxHeight: 380,
  },
  choiceList: {
    paddingBottom: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
}); 