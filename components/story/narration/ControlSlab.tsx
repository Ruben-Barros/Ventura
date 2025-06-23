import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, withTiming, interpolate } from 'react-native-reanimated';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useNarration } from '../../../contexts/NarrationContext';

interface ControlSlabProps {
  isVisible: boolean;
}

// TODO: Define theme colors
const theme = {
    colors: {
        slabBackground: 'rgba(0, 0, 0, 0.7)',
        iconColor: '#FFF',
        sliderTrack: 'rgba(255, 255, 255, 0.3)',
        sliderThumb: '#FFF',
    },
    layout: {
        controlSlabHeight: 100, // Adjust as needed
    }
};

export function ControlSlab({ isVisible }: ControlSlabProps) {
    const {
        playbackStatus,
        playbackSpeed,
        isCaptionsEnabled, // Get captions state
        actions: { play, pause, seek, setPlaybackSpeed, toggleCaptions, _toggleMicInput },
    } = useNarration();
    const insets = useSafeAreaInsets();

    // Animation for visibility
    const animatedStyle = useAnimatedStyle(() => {
        const translateY = interpolate(
            isVisible ? 1 : 0,
            [0, 1],
            [theme.layout.controlSlabHeight + insets.bottom, 0] // Animate from bottom
        );
        const opacity = withTiming(isVisible ? 1 : 0, { duration: 200 });
        return {
            transform: [{ translateY }],
            opacity,
        };
    });

    const isPlaying = playbackStatus?.isLoaded ? playbackStatus.isPlaying : false;
    // Provide default values for duration and position
    const duration = playbackStatus?.isLoaded ? playbackStatus.durationMillis ?? 0 : 0;
    const position = playbackStatus?.isLoaded ? playbackStatus.positionMillis ?? 0 : 0;

    const handlePlayPause = () => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    };

    // Seek when the user finishes dragging the slider
    const handleSeekComplete = (value: number) => {
        if (duration && duration > 0) {
            seek(value * duration);
        }
    };

    const handleSpeedChange = () => {
        // Cycle through speeds: 1.0 -> 1.5 -> 2.0 -> 1.0
        let nextSpeed = 1.0;
        if (playbackSpeed === 1.0) nextSpeed = 1.5;
        else if (playbackSpeed === 1.5) nextSpeed = 2.0;
        setPlaybackSpeed(nextSpeed);
    };

    // Format time helper
    const formatTime = (millis: number | undefined) => {
        if (millis == null) return '0:00';
        const totalSeconds = Math.floor(millis / 1000);
        const seconds = totalSeconds % 60;
        const minutes = Math.floor(totalSeconds / 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };


    return (
        <Animated.View style={[styles.container, { paddingBottom: insets.bottom }, animatedStyle]}>
            {/* Scrubber / Slider */}
            {/* Scrubber / Slider */}
            {/* Slider temporarily commented out for debugging */}
            {/* {duration > 0 ? (
                <View style={styles.sliderContainer}>
                    <Text style={styles.timeText}>{formatTime(position)}</Text>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={1}
                        value={duration > 0 ? position / duration : 0}
                        onSlidingComplete={handleSeekComplete}
                        minimumTrackTintColor={theme.colors.iconColor}
                        maximumTrackTintColor={theme.colors.sliderTrack}
                        thumbTintColor={theme.colors.sliderThumb}
                        disabled={!playbackStatus?.isLoaded}
                    />
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                </View>
            ) : null} */}

            {/* Control Buttons */}
            <View style={styles.controlsContainer}>
                {/* Rewind 10 s */}
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => seek(Math.max(0, position - 10_000))}
                >
                  <Ionicons name="play-back" size={24} color={theme.colors.iconColor} />
                </TouchableOpacity>

                {/* Play/Pause Button */}
                <TouchableOpacity style={styles.controlButton} onPress={handlePlayPause}>
                    <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={40} color={theme.colors.iconColor} />
                </TouchableOpacity>

                {/* Forward 10 s */}
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => seek(Math.min(duration, position + 10_000))}
                >
                  <Ionicons name="play-forward" size={24} color={theme.colors.iconColor} />
                </TouchableOpacity>

                 {/* Mic Button */}
                 <TouchableOpacity style={styles.controlButton} onPress={_toggleMicInput}>
                    <Ionicons name="mic-outline" size={24} color={theme.colors.iconColor} />
                </TouchableOpacity>

                 {/* Speed Selector */}
                 <TouchableOpacity style={styles.controlButton} onPress={handleSpeedChange}>
                    <Text style={styles.speedText}>{playbackSpeed.toFixed(1)}x</Text>
                </TouchableOpacity>

                 {/* Captions Toggle Button */}
                 <TouchableOpacity style={styles.controlButton} onPress={() => toggleCaptions(!isCaptionsEnabled)}>
                    <Ionicons name={isCaptionsEnabled ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={24} color={theme.colors.iconColor} />
                 </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: theme.layout.controlSlabHeight,
        backgroundColor: theme.colors.slabBackground,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
        paddingHorizontal: 20,
        paddingTop: 10, // Padding for slider
        zIndex: 3,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5, // Reduced margin slightly
    },
    slider: {
        flex: 1,
        height: 30, // Standard slider height
        marginHorizontal: 10,
    },
    // Removed sliderPlaceholder style
    timeText: {
        color: theme.colors.iconColor,
        fontSize: 12,
        minWidth: 35, // Ensure space for time
        textAlign: 'center',
    },
    controlsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    controlButton: {
        padding: 10, // Make tap target larger
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Removed iconPlaceholder style
    speedText: {
        color: theme.colors.iconColor,
        fontSize: 14,
        fontWeight: 'bold',
    },
});