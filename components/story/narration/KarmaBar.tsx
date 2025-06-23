import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface KarmaBarProps {
  karma: number;
}

export const KarmaBar: React.FC<KarmaBarProps> = ({ karma }) => {
  // Animated width based on karma (0-100)
  const widthStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${Math.min(100, Math.max(0, karma))}%`, {
        damping: 20,
        stiffness: 100
      })
    };
  });

  // Color segments
  const getColorSegment = (start: number, end: number, color: string) => (
    <View style={[styles.segment, { 
      backgroundColor: color,
      width: `${end - start}%`,
      left: `${start}%`
    }]} />
  );

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {getColorSegment(0, 33, '#ef4444')}
        {getColorSegment(33, 66, '#fbbf24')}
        {getColorSegment(66, 100, '#22c55e')}
        <Animated.View style={[styles.fill, widthStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    width: 150,
  },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#334155',
    overflow: 'hidden',
    position: 'relative',
  },
  segment: {
    position: 'absolute',
    height: '100%',
  },
  fill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
  },
});