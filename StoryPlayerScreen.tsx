// StoryPlayerScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './services/api/supabase';


// Types from CONTEXT.md
export type Choice = {
  id: string;
  label: string;
  karmaDelta: number;
  xpGain: number;
};

export type StorySegment = {
  id: string;
  videoUrl: string;
  choices: Choice[];
};

export type UserProgress = {
  segmentId: string;
  choiceId?: string;
  score: number;
  karma: number;
  streak: number;
};

// Simple typed useQuery hook
type QueryResult<T> = {
  data: T | null;
  error: Error | null;
};

function useQuery<T>(key: string, queryFn: () => Promise<T>): QueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let isMounted = true;
    queryFn()
      .then((d) => {
        if (isMounted) setData(d);
      })
      .catch((e) => {
        if (isMounted) setError(e as Error);
      });
    return () => {
      isMounted = false;
    };
  }, [key, queryFn]);
  return { data, error };
}

const { width, height } = Dimensions.get('window');

const coinSound = require('./assets/audio/choice_selected.mp3'); // placeholder
const heroImage = require('./assets/images/Netflix iOS 3.png');
const confettiLottie = require('./assets/animations/fireflies.json');

// PreRoll component
const PreRoll = ({ onFinish }: { onFinish: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3000);
    return () => clearTimeout(timer);
  }, [onFinish]);
  return (
    <View style={styles.prerollContainer}>
      <Animated.Image
        source={heroImage}
        style={[
          styles.prerollImage,
          {
            transform: [{ scale: withTiming(1.1, { duration: 3000 }) }],
          },
        ]}
        resizeMode="cover"
        blurRadius={Platform.OS === 'ios' ? 20 : 5}
      />
      <ActivityIndicator color="#fff" size="large" />
      <Text style={styles.prerollText}>Syncing your fate…</Text>
    </View>
  );
};

// ProgressRing using pulsing effect
const ProgressRing = ({ progress }: { progress: Animated.SharedValue<number> }) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
  }));
  useEffect(() => {
    progress.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      true,
    );
  }, [progress]);
  return (
    <Animated.View style={[styles.progressRing, animatedStyle]}>
      <Text style={styles.progressText}>0/5 CHAPTERS LEFT</Text>
    </Animated.View>
  );
};

// Choice timer with FOMO wobble
const ChoiceTimer = ({
  remaining,
  scale,
}: {
  remaining: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
}) => {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const timerTextStyle = useAnimatedStyle(() => ({
    color: remaining.value < 3 ? 'red' : '#fff',
  }));
  return (
    <Animated.View style={[styles.timerContainer, animStyle]}>
      <Animated.Text style={[styles.timerText, timerTextStyle]}>{`${Math.ceil(
        remaining.value,
      )}s`}</Animated.Text>
    </Animated.View>
  );
};

// Gamification HUD
const GamificationHUD = ({
  score,
  karma,
  streak,
  progress,
}: {
  score: number;
  karma: number;
  streak: number;
  progress: Animated.SharedValue<number>;
}) => (
  <View style={styles.hud} pointerEvents="none">
    <View style={styles.scoreBlock}>
      <Text style={styles.hudLabel}>Score</Text>
      <Text style={styles.hudValue}>{score}</Text>
    </View>
    <View style={styles.karmaBlock}>
      <View style={[styles.karmaFill, { width: `${karma}%` }]} />
    </View>
    <ProgressRing progress={progress} />
    <Text style={styles.streakText}>{`🔥 ${streak}`}</Text>
  </View>
);


// ChoiceSheet Component
const ChoiceSheet = ({
  choices,
  onSelect,
  timer,
  timerScale,
}: {
  choices: Choice[];
  onSelect: (c: Choice) => void;
  timer: Animated.SharedValue<number>;
  timerScale: Animated.SharedValue<number>;
}) => (
  <MotiView
    style={styles.choiceSheet}
    from={{ translateY: height }}
    animate={{ translateY: 0 }}
    transition={{ type: 'timing', duration: 200 }}
  >
    <ChoiceTimer remaining={timer} scale={timerScale} />
    {choices.map((c) => (
      <TouchableOpacity
        key={c.id}
        style={styles.choiceButton}
        onPress={() => onSelect(c)}
        activeOpacity={0.8}
      >
        <Text style={styles.choiceLabel}>{`${c.label} +${c.xpGain}XP`}</Text>
      </TouchableOpacity>
    ))}
  </MotiView>
);

// Video controller hook
function useVideoController(initial: StorySegment) {
  const videoRef = useRef<Video>(null);
  const [segment, setSegment] = useState<StorySegment>(initial);
  const [nextSegment, setNextSegment] = useState<StorySegment | null>(null);

  const prefetch = useCallback(async (url: string) => {
    try {
      await Video.prefetch(url);
    } catch {
      // ignore
    }
  }, []);

  const loadNext = useCallback(async () => {
    if (!segment.choices[0]) return;
    const { data } = await supabase
      .from('story_segments')
      .select('id, videoUrl, choices')
      .eq('id', segment.choices[0].id)
      .single();
    if (data) {
      setNextSegment(data as StorySegment);
      prefetch(data.videoUrl);
    }
  }, [segment, prefetch]);

  const onPlayback = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        // show choices handled outside
      }
      if (
        nextSegment &&
        status.durationMillis &&
        status.positionMillis > status.durationMillis - 2000
      ) {
        prefetch(nextSegment.videoUrl);
      }
    },
    [nextSegment, prefetch],
  );

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  return { videoRef, segment, setSegment, onPlayback, nextSegment };
}


// Choice controller hook
function useChoiceController() {
  const timer = useSharedValue(10);
  const timerScale = useSharedValue(1);
  const [visible, setVisible] = useState(false);
  const [choices, setChoices] = useState<Choice[]>([]);
  const reset = useCallback((seg: StorySegment) => {
    setChoices(seg.choices);
    timer.value = 10;
    timerScale.value = 1;
  }, [timer, timerScale]);

  const start = useCallback(() => {
    setVisible(true);
    timer.value = withTiming(0, { duration: 10000 });
    setTimeout(() => {
      timerScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 80 }),
          withTiming(0.9, { duration: 80 }),
        ),
        -1,
      );
    }, 7000);
  }, [timer, timerScale]);

  return { timer, timerScale, visible, setVisible, choices, reset, start };
}

// Gamification hook
function useGamificationHUD(initial: UserProgress) {
  const [progress, setProgress] = useState<UserProgress>(initial);
  const progressAnim = useSharedValue(0.2); // endowed progress

  const increment = useCallback((choice: Choice) => {
    setProgress((p) => ({
      ...p,
      choiceId: choice.id,
      score: p.score + choice.xpGain,
      karma: Math.min(100, p.karma + choice.karmaDelta),
      streak: p.streak + 1,
    }));
    progressAnim.value = withTiming((progressAnim.value + 0.2) % 1, {
      duration: 600,
      easing: Easing.out(Easing.ease),
    });
  }, [progressAnim]);

  return { progress, increment, progressAnim };
}


const initialSegment: StorySegment = {
  id: 'seg1',
  videoUrl: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
  choices: [
    { id: 'seg2', label: 'Explore the cave', karmaDelta: 5, xpGain: 10 },
    { id: 'seg3', label: 'Return to camp', karmaDelta: -2, xpGain: 8 },
  ],
};

export function StoryPlayerScreen() {
  const [prerollDone, setPrerollDone] = useState(false);
  const { videoRef, segment, onPlayback } = useVideoController(initialSegment);
  const choiceCtrl = useChoiceController();
  const { progress, increment, progressAnim } = useGamificationHUD({
    segmentId: segment.id,
    score: 0,
    karma: 50,
    streak: 0,
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const selectChoice = useCallback(
    async (c: Choice) => {
      choiceCtrl.setVisible(false);
      await videoRef.current?.pauseAsync();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const { sound } = await Audio.Sound.createAsync(coinSound, { volume: 0.6 });
      soundRef.current = sound;
      await sound.playAsync();
      if (Math.random() < 0.1) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1500);
      }
      increment(c);
      await sound.unloadAsync();
    },
    [increment, videoRef, choiceCtrl],
  );

  useEffect(() => {
    if (!prerollDone) return;
    choiceCtrl.reset(segment);
  }, [prerollDone, segment, choiceCtrl]);

  useEffect(() => {
    const sub = supabase
      .channel('user_story_progress')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_story_progress' }, () => {
        // Social proof echo stub
      })
      .subscribe();
    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  useEffect(() => {
    return () => {
      Notifications.scheduleNotificationAsync({
        content: {
          title: 'Your saga awaits – bonus XP if you return within 15 m.',
        },
        trigger: { seconds: 7200 },
      });
    };
  }, []);

  const handleConnectivity = useCallback(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      await FileSystem.makeDirectoryAsync(FileSystem.cacheDirectory + 'segments', { intermediates: true });
      // offline download stub
    }
  }, []);

  useEffect(() => {
    handleConnectivity();
  }, [handleConnectivity]);

  if (!prerollDone) {
    return <PreRoll onFinish={() => setPrerollDone(true)} />;
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={StyleSheet.absoluteFill}
        source={{ uri: segment.videoUrl }}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        onPlaybackStatusUpdate={onPlayback}
      />
      <GamificationHUD
        score={progress.score}
        karma={progress.karma}
        streak={progress.streak}
        progress={progressAnim}
      />
      {choiceCtrl.visible && (
        <ChoiceSheet
          choices={choiceCtrl.choices}
          onSelect={selectChoice}
          timer={choiceCtrl.timer}
          timerScale={choiceCtrl.timerScale}
        />
      )}
      {showConfetti && (
        <Animated.View style={styles.confetti}>
          {/* <LottieView source={confettiLottie} autoPlay loop={false} /> */}
        </Animated.View>
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  prerollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  prerollImage: {
    ...StyleSheet.absoluteFillObject,
    width,
    height,
  },
  prerollText: {
    color: '#fff',
    marginTop: 12,
  },
  hud: {
    position: 'absolute',
    top: 40,
    right: 20,
    alignItems: 'flex-end',
  },
  scoreBlock: { alignItems: 'center', marginBottom: 8 },
  hudLabel: { color: '#aaa', fontSize: 12 },
  hudValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  karmaBlock: {
    height: 6,
    width: 80,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  karmaFill: { height: '100%', backgroundColor: '#4ade80' },
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: { color: '#fff', fontSize: 10 },
  streakText: { color: '#facc15', fontSize: 14 },
  choiceSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  choiceButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },
  choiceLabel: { color: '#fff', fontSize: 16 },
  timerContainer: { alignSelf: 'center', marginBottom: 12 },
  timerText: { color: '#fff', fontSize: 24 },
  confetti: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

/* Jest tests stubs
import { render, fireEvent } from '@testing-library/react-native';
describe('StoryPlayerScreen', () => {
  it('renders and selects choice', async () => {
    const { getByText } = render(<StoryPlayerScreen />);
    await new Promise((r) => setTimeout(r, 3100));
    fireEvent.press(getByText('Explore the cave +10XP'));
  });
});
*/

export default StoryPlayerScreen;
