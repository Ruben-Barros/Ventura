// StoryPlayerScreen.tsx
import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Dimensions, TouchableOpacity, ImageBackground } from 'react-native';
import { Video, ResizeMode, Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useAnimatedStyle
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Dopamine trigger: Endowed progress animation
const ProgressRing = ({ progress }: { progress: Animated.SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }]
  }));

  return (
    <Animated.View style={[styles.progressRing, animatedStyle]}>
      <Text style={styles.progressText}>0/5 CHAPTERS</Text>
    </Animated.View>
  );
};

// Dopamine trigger: FOMO timer with wobble effect
const ChoiceTimer = ({ timerScale }: { timerScale: Animated.SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }]
  }));

  return (
    <Animated.View style={[styles.timer, animatedStyle]}>
      <Text style={styles.timerText}>10s</Text>
    </Animated.View>
  );
};

const StoryPlayerScreen = () => {
  // State and refs
  const videoRef = useRef<Video>(null);
  const [isChoiceVisible, setIsChoiceVisible] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [karma, setKarma] = useState(50);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  
  // Animation values
  const progress = useSharedValue(0.2); // Initial 20% endowed progress
  const timerScale = useSharedValue(1);
  const pathLockedOpacity = useSharedValue(0);
  
  // Dopamine triggers implementation
  useEffect(() => {
    // 1. Endowed progress animation
    progress.value = withTiming(1, { duration: 5000, easing: Easing.out(Easing.ease) });
    
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync();
      }
      Audio.setIsEnabledAsync(true);
    };
  }, []);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  // Dopamine trigger: Handle segment end with choice presentation
  const handleSegmentEnd = () => {
    setIsChoiceVisible(true);
    
    // Start choice timer with FOMO effect
    setTimeout(() => {
      timerScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 300 }),
          withTiming(0.95, { duration: 300 })
        ),
        -1, // Infinite loop
        true
      );
    }, 7000);
  };

  // Dopamine trigger: Handle choice selection with sensory feedback
  const handleChoiceSelect = async (choiceId: string) => {
    setSelectedChoice(choiceId);
    setIsChoiceVisible(false);
    
    // 7. Sensory layering
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // 4. Freeze frame effect
    pathLockedOpacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(0, { duration: 1000 })
    );
    
    // 1. Variable reward (10% chance)
    if (Math.random() < 0.1) {
      setScore(prev => prev + 50);
    }
    
    // 5. Karma update
    setKarma(prev => Math.min(100, prev + 10));
  };

  // Dopamine trigger: Path locked animation
  const pathLockedStyle = useAnimatedStyle(() => ({
    opacity: pathLockedOpacity.value
  }));

  return (
    <View style={styles.container}>
      {/* Video player with fallback */}
      {!isVideoLoaded && (
        <View style={styles.videoPlaceholder}>
          <Text style={styles.loadingText}>Loading story...</Text>
        </View>
      )}
      
      <Video
        ref={videoRef}
        source={{ uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }}
        style={[styles.video, !isVideoLoaded && styles.hiddenVideo]}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping={false}
        onReadyForDisplay={handleVideoLoad}
        onPlaybackStatusUpdate={(status: AVPlaybackStatus) => {
          if ('didJustFinish' in status && status.didJustFinish) {
            handleSegmentEnd();
          }
        }}
      />
      
      {/* Dark overlay during choices */}
      {isChoiceVisible && <View style={styles.darkOverlay} />}
      
      {/* HUD - Gamification elements */}
      <View style={styles.hud}>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.karmaBar}>
          <View style={[styles.karmaFill, { width: `${karma}%` }]} />
        </View>
        <ProgressRing progress={progress} />
      </View>
      
      {/* Choice overlay */}
      {isChoiceVisible && (
        <View style={styles.choiceOverlay}>
          <ChoiceTimer timerScale={timerScale} />
          <TouchableOpacity 
            style={styles.choiceButton}
            onPress={() => handleChoiceSelect('choice1')}
          >
            <Text style={styles.choiceText}>Explore the cave</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.choiceButton}
            onPress={() => handleChoiceSelect('choice2')}
          >
            <Text style={styles.choiceText}>Confront the stranger</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Dopamine trigger: Path locked effect */}
      <Animated.View style={[styles.pathLocked, pathLockedStyle]}>
        <Text style={styles.pathLockedText}>PATH LOCKED</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  hiddenVideo: {
    display: 'none',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  hud: {
    position: 'absolute',
    top: 50,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 10,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreLabel: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scoreValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  karmaBar: {
    height: 10,
    width: 150,
    backgroundColor: '#334155',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  karmaFill: {
    height: '100%',
    backgroundColor: '#4ade80',
  },
  progressRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  progressText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  choiceOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    zIndex: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  timer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  timerText: {
    color: 'red',
    fontSize: 24,
    fontWeight: 'bold',
  },
  choiceButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  choiceText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pathLocked: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 20,
  },
  pathLockedText: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

export default StoryPlayerScreen;