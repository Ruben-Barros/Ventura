import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedProps, useDerivedValue, SharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

// Create an animated version of the Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  progress: SharedValue<number> | number; // Accept SharedValue or a plain number
  radius: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
}

export function ProgressRing({
  progress,
  radius,
  strokeWidth,
  color,
  backgroundColor,
}: ProgressRingProps) {
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

  // Handle both SharedValue and number types for progress
  const progressValue = useDerivedValue(() => {
    return typeof progress === 'number' ? progress : progress.value;
  });

  // Calculate animated props for the progress circle
  const animatedProps = useAnimatedProps(() => {
    // Ensure progress stays between 0 and 1
    const clampedProgress = Math.max(0, Math.min(1, progressValue.value));
    return {
      strokeDashoffset: circumference * (1 - clampedProgress),
    };
  });

  return (
    <View style={{ width: radius * 2, height: radius * 2 }}>
      <Svg width={radius * 2} height={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
        {/* Rotate the whole SVG container by -90 degrees to start from the top */}
        <Animated.View style={{ transform: [{ rotate: '-90deg' }] }}>
          {/* Background Circle */}
          {backgroundColor && (
            <Circle
              cx={radius}
              cy={radius}
              r={innerRadius}
              stroke={backgroundColor}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
          )}
          {/* Progress Circle */}
          <AnimatedCircle
            cx={radius}
            cy={radius}
            r={innerRadius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round" // Make the ends rounded
          />
        </Animated.View>
      </Svg>
    </View>
  );
}

// Note: Ensure react-native-reanimated is correctly configured in your project (babel.config.js plugin).