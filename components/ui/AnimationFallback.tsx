import React, { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

/**
 * A hook that provides a compatible animation value that works
 * even when Reanimated is not fully initialized
 */
export function useCompatibleAnimation(initialValue: number = 0) {
  // Use React Native's built-in Animated API as a fallback
  const animatedValue = React.useRef(new Animated.Value(initialValue)).current;
  
  const animate = (toValue: number, duration: number = 300, easing = Easing.linear) => {
    Animated.timing(animatedValue, {
      toValue,
      duration,
      easing,
      useNativeDriver: false, // Don't rely on native driver which might not be available
    }).start();
  };

  return {
    value: animatedValue,
    animate,
  };
}

/**
 * A component that provides a fallback animation when Reanimated is not available
 */
export function AnimatedView({ 
  style, 
  children, 
  animatedValue, 
  animatedProperty = 'opacity',
  outputRange = [0, 1],
  inputRange = [0, 1],
}) {
  const animatedStyle = {
    ...style,
    [animatedProperty]: animatedValue.interpolate({
      inputRange,
      outputRange,
    }),
  };

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

/**
 * A hook that provides a simple way to animate between values over time
 */
export function useAnimatedValue(initialValue: number = 0, duration: number = 1000) {
  const [value, setValue] = useState(initialValue);
  const animation = useCompatibleAnimation(initialValue);
  
  useEffect(() => {
    animation.animate(value, duration);
  }, [value, duration]);
  
  return {
    value: animation.value,
    setValue,
  };
}

export default {
  useCompatibleAnimation,
  AnimatedView,
  useAnimatedValue,
}; 