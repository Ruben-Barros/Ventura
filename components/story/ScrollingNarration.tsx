import React, { useEffect } from 'react';
import { StyleSheet, Dimensions, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import theme from '../../constants/theme'; // Assuming theme is needed for text styles

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const ANIMATION_DURATION = 20000; // Adjust duration as needed (milliseconds)

interface ScrollingNarrationProps {
  text: string;
  isVisible: boolean; // Control visibility from parent
  onComplete?: () => void; // Optional callback when animation finishes
}

export default function ScrollingNarration({ text, isVisible, onComplete }: ScrollingNarrationProps) {
  const translateY = useSharedValue(screenHeight); // Start below the screen
  const perspective = useSharedValue(1000); // Initial perspective

  useEffect(() => {
    if (isVisible) {
      // Reset position before starting
      translateY.value = screenHeight;
      perspective.value = 1000;

      // Animate translation (scrolling up)
      translateY.value = withTiming(
        -screenHeight * 1.5, // Scroll well past the top
        {
          duration: ANIMATION_DURATION,
          easing: Easing.linear, // Constant speed
        },
        (finished) => {
          if (finished && onComplete) {
            onComplete();
          }
        }
      );

      // Animate perspective (shrinking effect) - optional
      perspective.value = withTiming(300, {
        duration: ANIMATION_DURATION * 0.8, // Adjust timing relative to scroll
        easing: Easing.inOut(Easing.ease),
      });
    } else {
      // Optionally reset or hide when not visible
      translateY.value = screenHeight;
      perspective.value = 1000;
    }
  }, [isVisible, text, translateY, perspective, onComplete]);

  const animatedStyle = useAnimatedStyle(() => {
    // Apply perspective transform
    const perspectiveValue = interpolate(
      translateY.value,
      [screenHeight, -screenHeight * 1.5],
      [1000, 300], // Adjust perspective range
      Extrapolation.CLAMP
    );

    // Apply scaling based on position (further away = smaller)
    const scale = interpolate(
      translateY.value,
      [screenHeight, 0, -screenHeight * 1.5],
      [0.5, 1, 1.2], // Start smaller, grow, then slightly larger as it moves away
      Extrapolation.CLAMP
    );

    return {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0, // Anchor to bottom initially
      alignItems: 'center',
      transform: [
        { perspective: perspectiveValue },
        { translateY: translateY.value },
        { scale: scale },
        { rotateX: '60deg' }, // Tilt the text
      ],
      opacity: isVisible ? 1 : 0, // Fade in/out based on visibility
    };
  });

  if (!isVisible) {
    return null; // Don't render if not visible
  }

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: screenWidth * 0.8, // Limit width
    paddingHorizontal: 20,
  },
  text: {
    color: theme.colors.accent.secondary, // Use a prominent color (e.g., gold)
    fontSize: 28, // Adjust font size
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40, // Adjust line height
    // Add text shadow for better readability over video
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});