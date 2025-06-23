import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
// import { Ionicons } from '@expo/vector-icons'; // Optional icon

interface NetworkToastProps {
  isVisible: boolean;
  type: 'offline' | 'low_bandwidth';
}

// TODO: Define theme colors
const theme = {
    colors: {
        toastBackgroundWarning: 'rgba(234, 179, 8, 0.9)', // Amber/Yellow background
        textDark: '#1F2937', // Dark text for contrast
    },
};

const ANIMATION_DURATION = 300;

export function NetworkToast({ isVisible, type }: NetworkToastProps) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(50); // Start off-screen below

    useEffect(() => {
        if (isVisible) {
            // Animate in
            opacity.value = withTiming(1, { duration: ANIMATION_DURATION });
            translateY.value = withTiming(0, { duration: ANIMATION_DURATION, easing: Easing.out(Easing.ease) });
        } else {
            // Animate out
            opacity.value = withTiming(0, { duration: ANIMATION_DURATION });
            translateY.value = withTiming(50, { duration: ANIMATION_DURATION, easing: Easing.in(Easing.ease) });
        }
    }, [isVisible]); // Rerun effect when visibility changes

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ translateY: translateY.value }],
        };
    });

    const message = type === 'offline'
        ? "You appear to be offline. Limited functionality available."
        : "Low bandwidth detected. Visuals downgraded for smoother playback.";

    // Render null if not visible to avoid layout shifts or interaction blocking
    // Note: Unlike other toasts, this might stay visible as long as the condition persists
    // if (!isVisible) {
    //     return null;
    // }
    // Let's keep it rendered but transparent/off-screen when not visible for smoother transitions

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            {/* Optional Icon */}
            {/* <Ionicons name={type === 'offline' ? "cloud-offline-outline" : "cellular-outline"} size={18} color={theme.colors.textDark} style={styles.icon} /> */}
             <Text style={styles.iconPlaceholder}>{type === 'offline' ? '☁️' : '📶'}</Text>
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20, // Position near the bottom, adjust as needed
        alignSelf: 'center',
        backgroundColor: theme.colors.toastBackgroundWarning,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
        zIndex: 4, // Ensure it's above most elements
    },
    icon: {
        marginRight: 8,
    },
    iconPlaceholder: { // Placeholder style
        fontSize: 16,
        marginRight: 8,
    },
    message: {
        color: theme.colors.textDark,
        fontSize: 13,
        fontWeight: '500',
    },
});