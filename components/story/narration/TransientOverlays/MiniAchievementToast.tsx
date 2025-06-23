import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
// Import LottieView if using Lottie for animations
// import LottieView from 'lottie-react-native';
import { Achievement } from '../../../../types/narration.types'; // Keep Achievement type
import { useAchievements } from '../../../../contexts/AchievementsContext'; // Use AchievementsContext

// Remove props interface
// interface MiniAchievementToastProps {
//   achievement: Achievement | null;
//   onDismiss: () => void;
// }

// TODO: Define theme colors
const theme = {
    colors: {
        toastBackground: 'rgba(30, 30, 30, 0.9)',
        textLight: '#FFF',
        achievementHighlight: '#FFD700', // Gold color for highlight
    },
};

const TOAST_DURATION = 3000; // Display duration in ms
const ANIMATION_DURATION = 300; // Fade in/out duration

// Remove props from component signature
export function MiniAchievementToast() {
    const { pendingAchievementToasts, actions: achievementActions } = useAchievements(); // Get toasts from AchievementsContext
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50); // Start off-screen below

    // Display the first achievement in the queue, if any
    const achievementToastData = pendingAchievementToasts[0] ?? null;
    const achievement = achievementToastData?.achievement;

    useEffect(() => {
        if (achievement) {
            // Animate in
            opacity.value = withTiming(1, { duration: ANIMATION_DURATION });
            translateY.value = withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) });

            // Set timer to animate out and dismiss
            const timer = setTimeout(() => {
                opacity.value = withTiming(0, { duration: ANIMATION_DURATION });
                translateY.value = withTiming(50, { duration: ANIMATION_DURATION, easing: Easing.in(Easing.ease) }, (finished) => {
                    if (finished) {
                        // Call dismiss action from AchievementsContext after animation completes
                        achievementActions._clearToast(achievement.id);
                    }
                });
            }, TOAST_DURATION);

            return () => clearTimeout(timer); // Cleanup timer on unmount or if achievement changes
        } else {
            // Ensure it's hidden if no achievement to display
            opacity.value = 0;
            translateY.value = 50;
        }
    // Rerun effect when the first achievement in the queue changes
    }, [achievementToastData, achievementActions]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });

    if (!achievement) {
        return null; // Don't render anything if no achievement
    }

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            {/* Optional: Lottie Animation */}
            {/* {achievement.lottieAnimationSource && (
                <LottieView
                    source={achievement.lottieAnimationSource}
                    autoPlay
                    loop={false}
                    style={styles.lottie}
                />
            )} */}
            <View style={styles.lottiePlaceholder} />{/* Placeholder */}

            <View style={styles.textContainer}>
                <Text style={styles.title}>Achievement Unlocked!</Text>
                <Text style={styles.achievementName}>{achievement.name}</Text>
                {/* Optional: Description or points */}
                {/* <Text style={styles.description}>{achievement.description}</Text> */}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 120, // Position above control slab / karma bar
        alignSelf: 'center',
        backgroundColor: theme.colors.toastBackground,
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 4, // Ensure it's above other elements except choice overlay
    },
    lottie: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    lottiePlaceholder: { // Placeholder style
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.colors.achievementHighlight,
        marginRight: 10,
    },
    textContainer: {
        flexDirection: 'column',
    },
    title: {
        color: theme.colors.achievementHighlight,
        fontSize: 12,
        fontWeight: 'bold',
    },
    achievementName: {
        color: theme.colors.textLight,
        fontSize: 14,
        fontWeight: 'bold',
    },
    description: {
        color: theme.colors.textLight,
        fontSize: 12,
        marginTop: 2,
    },
});