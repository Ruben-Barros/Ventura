import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing } from 'react-native-reanimated';
// Import expo-av for sound effect if needed
// import { Audio } from 'expo-av';

interface KarmaFlashProps {
  karmaChange: number | null; // Positive for good, negative for bad, null to hide
  onComplete: () => void; // Callback when animation finishes
}

// TODO: Define theme colors
const theme = {
    colors: {
        karmaGoodFlash: 'rgba(74, 222, 128, 0.5)', // #4ade80 with opacity
        karmaBadFlash: 'rgba(239, 68, 68, 0.5)', // #ef4444 with opacity
    },
};

const FLASH_DURATION = 1000; // Total duration of the flash effect in ms

export function KarmaFlash({ karmaChange, onComplete }: KarmaFlashProps) {
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (karmaChange !== null && karmaChange !== 0) {
            // Sequence: Fade In -> Hold -> Fade Out
            opacity.value = withSequence(
                withTiming(1, { duration: FLASH_DURATION * 0.2, easing: Easing.ease }), // Fade in quickly
                withTiming(1, { duration: FLASH_DURATION * 0.6 }), // Hold
                withTiming(0, { duration: FLASH_DURATION * 0.2, easing: Easing.ease }, (finished) => { // Fade out
                    if (finished) {
                        onComplete(); // Notify parent when animation is done
                    }
                })
            );

            // TODO: Play sound effect (soft chime)
            // playSoundEffect(karmaChange > 0 ? 'good' : 'bad');

        } else {
            // Ensure opacity is 0 if no change or change is 0
            opacity.value = 0;
        }
    }, [karmaChange, onComplete]); // Rerun effect when karmaChange changes

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    const flashColor = karmaChange === null ? 'transparent' :
                       karmaChange > 0 ? theme.colors.karmaGoodFlash : theme.colors.karmaBadFlash;

    // Render a full-screen overlay that flashes
    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: flashColor },
                animatedStyle,
            ]}
            pointerEvents="none" // Allow touches to pass through
        />
    );
}

// Placeholder sound function
// async function playSoundEffect(type: 'good' | 'bad') {
//     const soundFile = type === 'good' ? require('../../../../assets/audio/karma_good.mp3') : require('../../../../assets/audio/karma_bad.mp3');
//     try {
//         const { sound } = await Audio.Sound.createAsync(soundFile);
//         await sound.playAsync();
//         // Unload sound? Or keep instance? Depends on frequency.
//     } catch (error) {
//         console.error("Failed to play karma sound effect:", error);
//     }
// }

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject, // Cover the entire screen
        zIndex: 10, // High zIndex to be on top of most elements (adjust as needed)
    },
});