import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, withSequence } from 'react-native-reanimated';

type VoteMajority = 'blue' | 'purple' | null; // Example types for majority

interface CrowdPulseBorderProps {
  voteMajority: VoteMajority; // The current majority vote color, or null to hide
}

// TODO: Define theme colors
const theme = {
    colors: {
        voteBlue: 'rgba(59, 130, 246, 0.7)', // Blue-500 with opacity
        votePurple: 'rgba(168, 85, 247, 0.7)', // Purple-500 with opacity
    },
};

const BORDER_WIDTH = 4; // Width of the pulsing border
const PULSE_DURATION = 1500; // Duration of one pulse cycle (in ms)

export function CrowdPulseBorder({ voteMajority }: CrowdPulseBorderProps) {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1); // For pulsing effect

    useEffect(() => {
        if (voteMajority) {
            // Animate in and start pulsing
            opacity.value = withTiming(1, { duration: 300 });
            // Example pulse: scale slightly up and down repeatedly
            // Note: A border width pulse might be visually better than scale.
            // This requires animating the `borderWidth` property, which might need different handling.
            // For simplicity, using opacity pulse here.
            opacity.value = withRepeat(
                withSequence(
                    withTiming(0.5, { duration: PULSE_DURATION / 2, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: PULSE_DURATION / 2, easing: Easing.inOut(Easing.ease) })
                ),
                -1, // Repeat indefinitely
                true // Reverse animation
            );
        } else {
            // Animate out
            opacity.value = withTiming(0, { duration: 300 });
            scale.value = 1; // Reset scale/other animations
        }
        // Cleanup function to stop animation if component unmounts or voteMajority becomes null
        // return () => {
        //     cancelAnimation(opacity);
        // };
    }, [voteMajority]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            // transform: [{ scale: scale.value }], // Apply scale if using scale pulse
            // Or animate borderWidth directly if preferred
        };
    });

    const borderColor = voteMajority === 'blue' ? theme.colors.voteBlue :
                        voteMajority === 'purple' ? theme.colors.votePurple :
                        'transparent';

    // Render a border view around the screen edges
    return (
        <Animated.View
            style={[
                styles.border,
                { borderColor: borderColor, borderWidth: BORDER_WIDTH }, // Apply color and width
                animatedStyle,
            ]}
            pointerEvents="none" // Allow touches to pass through
        />
    );
}

const styles = StyleSheet.create({
    border: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 0, // Or apply border radius if the main container has one
        zIndex: 0, // Keep it behind most UI elements, just above background/visual layer
    },
});