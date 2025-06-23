import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, ImageBackground, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useNarration } from '../../../contexts/NarrationContext';
import { Asset } from 'expo-asset';
import { Image } from 'expo-image'; // Use expo-image for better performance and caching
import { MotionLoopPlayer } from './MotionLoopPlayer';
import { VideoPlayer } from './VideoPlayer';

// TODO: Define theme colors
const theme = {
    colors: {
        loadingIndicator: '#FFF',
        placeholderBackground: '#111', // Dark background for loading/static
    },
};

// Placeholder for the default static poster (reuse existing cover_image_url logic)
function StaticPoster({ storyCoverUrl }: { storyCoverUrl?: string }) {
    // TODO: Fetch storyCoverUrl from story details if not passed directly
    const source = storyCoverUrl ? { uri: storyCoverUrl } : require('../../../assets/images/Netflix iOS 0.png'); // Use existing image as fallback

    return (
        <Image
            source={source}
            style={styles.visualElement}
            contentFit="cover" // Fill screen while maintaining aspect ratio
            transition={300} // Smooth transition when image loads
            placeholderContentFit="cover" // How placeholder should fit
            // Add a placeholder source for better UX
            // placeholder={require('../../../assets/images/poster-placeholder.png')}
        />
    );
}

// Component for Illustrated Mode
// Component for Illustrated Mode with fade-in animation
function IllustratedImage({ asset }: { asset: Asset | { uri: string } }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const opacity = useSharedValue(0);

    // Reset load state and opacity when the image URI changes
    useEffect(() => {
        setIsLoaded(false);
        opacity.value = 0;
    }, [asset.uri]);

    // Animate opacity once the image is loaded
    useEffect(() => {
        if (isLoaded) {
            opacity.value = withTiming(1, { duration: 300 }); // Fade in duration
        }
    }, [isLoaded]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
        };
    });

    const handleLoadEnd = useCallback(() => {
        setIsLoaded(true);
    }, []);

    return (
        <Animated.View style={[styles.visualElement, animatedStyle]}>
            <Image
                source={{ uri: asset.uri }}
                style={styles.visualElement}
                contentFit="contain" // Or "cover" depending on desired effect
                placeholderContentFit="cover"
                onLoadEnd={handleLoadEnd} // Trigger animation when loaded
                // transition={0} // Disable built-in transition if using reanimated
            />
        </Animated.View>
    );
}

// TODO: Implement MotionLoopPlayer and VideoPlayer components later

export function VisualLayer() {
    const {
        visualMode,
        currentVisualAsset,
        isLoadingVisual,
        currentSegment, // Needed for potential fallback info like story cover
        storyDetails, // Get story details for cover image fallback
    } = useNarration();

    const renderVisualContent = () => {
        // Show loading indicator if visual is loading (except for static mode)
        if (isLoadingVisual && visualMode !== 'static') {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.loadingIndicator} />
                </View>
            );
        }

        // Render based on visual mode and available asset
        switch (visualMode) {
            case 'illustrated':
                // Render StaticPoster underneath, and IllustratedImage on top (which will fade in)
                return (
                    <>
                        <StaticPoster storyCoverUrl={storyDetails?.cover_image_url} />
                        {currentVisualAsset?.type === 'image' && (
                            <IllustratedImage asset={currentVisualAsset} />
                        )}
                        {/* If asset is missing/wrong type, only StaticPoster shows */}
                        {/* Warning moved or handled elsewhere if needed */}
                    </>
                );

            case 'motion-comic':
                if (currentVisualAsset?.type === 'loop' || currentVisualAsset?.type === 'video') {
                    return <MotionLoopPlayer asset={currentVisualAsset} />;
                }
                 console.warn("Motion-Comic mode active but no valid loop/video asset found, falling back to static.");
                return <StaticPoster storyCoverUrl={storyDetails?.cover_image_url} />;

            case 'video':
                 if (currentVisualAsset?.type === 'video') {
                    return <VideoPlayer asset={currentVisualAsset} />;
                }
                 console.warn("Video mode active but no valid video asset found, falling back to static.");
                return <StaticPoster storyCoverUrl={storyDetails?.cover_image_url} />;

            case 'static':
            default:
                // TODO: Pass the actual story cover URL here
                return <StaticPoster storyCoverUrl={storyDetails?.cover_image_url} />;
        }
    };

    return (
        <View style={styles.container}>
            {renderVisualContent()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject, // Fill the parent container
        backgroundColor: theme.colors.placeholderBackground, // Background shown during load/fallback
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1, // Ensure it's behind controls but above background
    },
    visualElement: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay during load
    },
     placeholderText: { // Placeholder style
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        padding: 20,
    },
});