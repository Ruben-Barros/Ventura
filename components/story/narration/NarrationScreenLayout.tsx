import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Dimensions, Platform, Text } from 'react-native';
import Animated, { useDerivedValue } from 'react-native-reanimated'; // Import useDerivedValue
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNarration } from '../../../contexts/NarrationContext'; // Narration context for main state
// Achievement context is used internally by MiniAchievementToast now
import { VisualLayer } from './VisualLayer';
import { ProgressRing } from './ProgressRing';
import { KarmaBar } from './KarmaBar';
import { ControlSlab } from './ControlSlab';
import { ChoiceOverlay } from './ChoiceOverlay';
import { MiniAchievementToast } from './TransientOverlays/MiniAchievementToast'; // Now uses context internally
// Achievement type is no longer needed here
import { KarmaFlash } from './TransientOverlays/KarmaFlash';
import { NetworkToast } from './TransientOverlays/NetworkToast';
// Import other overlays as needed: CrowdPulseBorder

// TODO: Define theme colors and spacing
const theme = {
    colors: {
        background: '#000',
        primaryText: '#FFF',
        karmaGood: '#4ade80',
        karmaBad: '#ef4444',
        progressRing: 'rgba(255, 255, 255, 0.8)',
        progressBackground: 'rgba(255, 255, 255, 0.3)',
    },
    spacing: {
        medium: 16,
    },
};

export function NarrationScreenLayout() {
    // Destructure state properties and actions directly from the context value
    const {
        currentSegment,
        playbackStatus,
        userKarma,
        isChoiceActive,
        experienceMode,
        lastKarmaChange, // Get the trigger value for the flash
        actions,
        // Add other needed state properties directly:
        // visualMode,
        // currentVisualAsset,
        // isLoadingVisual,
        storyDetails, // Needed for StaticPoster
        isOfflineMode,
        isLowBandwidthMode,
        // achievementToDisplay is removed, handled by AchievementsContext
    } = useNarration();
    const insets = useSafeAreaInsets();
    const [controlsVisible, setControlsVisible] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;

    // --- Control Slab Visibility ---
    const hideControls = () => {
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        setControlsVisible(false);
    };

    const showControls = () => {
        setControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        // Hide controls after 3 seconds of inactivity (adjust as needed)
        controlsTimeoutRef.current = setTimeout(hideControls, 3000);
    };

    // Show controls when playback starts/pauses or screen tapped
    useEffect(() => {
        // Reset controls visibility timer when playback state changes (loaded, playing/paused)
        if (playbackStatus?.isLoaded) {
            showControls();
        }
        // Cleanup timeout on unmount
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    // Rerun effect when isLoaded or isPlaying changes
    }, [playbackStatus?.isLoaded, playbackStatus?.isLoaded ? playbackStatus.isPlaying : null]);

    const handleScreenTap = () => {
        if (isChoiceActive) return; // Don't toggle controls if choice overlay is active
        if (controlsVisible) {
            hideControls();
        } else {
            showControls();
        }
    };

    const handleKarmaFlashComplete = () => {
        actions._clearLastKarmaChange(); // Reset the trigger in the context
    };

    // Removed handleDismissAchievement as it's handled internally by the toast


    // --- Progress Ring Calculation ---
    const animatedProgress = useDerivedValue(() => {
        if (playbackStatus?.isLoaded && playbackStatus.durationMillis && playbackStatus.durationMillis > 0) {
            // Ensure progress stays between 0 and 1
            return Math.max(0, Math.min(1, playbackStatus.positionMillis / playbackStatus.durationMillis));
        }
        return 0; // Default to 0 if not loaded or duration is 0
    });

    // --- Component Rendering ---
    if (!currentSegment) {
        // TODO: Add a proper loading state component
        return <View style={styles.loadingContainer}><Text style={{color: 'white'}}>Loading Story...</Text></View>;
    }

    return (
        <TouchableWithoutFeedback onPress={handleScreenTap}>
            <View style={styles.container}>
                {/* Layer 0: Fallback Background (implicitly black via container style) */}

                {/* Layer 1: Visual Layer */}
                <VisualLayer />

                {/* Layer 2: Progress Ring + Karma Bar */}
                <View style={[styles.progressLayer, { top: insets.top + theme.spacing.medium, left: insets.left + theme.spacing.medium, right: insets.right + theme.spacing.medium }]}>
                   {/* TODO: Wrap ProgressRing with Animated values */}
                   <ProgressRing
                       progress={animatedProgress} // Pass the derived shared value
                       radius={40} // Adjust size as needed
                        strokeWidth={5}
                        color={theme.colors.progressRing}
                        backgroundColor={theme.colors.progressBackground}
                    />
                </View>
                <View style={[styles.karmaLayer, { bottom: (controlsVisible ? 100 : 0) + insets.bottom + theme.spacing.medium, left: insets.left, right: insets.right }]}>
                    <KarmaBar currentKarma={userKarma} />
                </View>


                {/* Layer 3: Control Slab */}
                <ControlSlab isVisible={controlsVisible} />

                {/* Layer 4: Transient Overlays */}
                {/* Position these absolutely as needed */}
                {/* TODO: Wire up other transient overlays */}
                {/* Achievement Toast (now gets data from AchievementsContext) */}
                <MiniAchievementToast />
                <KarmaFlash karmaChange={lastKarmaChange} onComplete={handleKarmaFlashComplete} />
                {/* <CrowdPulseBorder voteMajority={currentVoteMajority} /> */}
                <NetworkToast
                    isVisible={isOfflineMode || isLowBandwidthMode}
                    type={isOfflineMode ? 'offline' : 'low_bandwidth'}
                />

                {/* Layer 5: Choice Overlay (Modal) */}
                <ChoiceOverlay
                    isVisible={isChoiceActive}
                    choices={currentSegment.choices ?? []}
                    experienceMode={experienceMode}
                    onChoose={actions.makeChoice}
                />
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    progressLayer: {
        position: 'absolute',
        // Position top-center or around visual element as needed
        alignItems: 'center', // Center ring horizontally if needed
        zIndex: 2,
    },
    karmaLayer: {
        position: 'absolute',
        alignItems: 'center', // Center karma bar horizontally
        zIndex: 2,
        paddingHorizontal: theme.spacing.medium,
        // Add transition for bottom position based on controlsVisible
    },
    // Add styles for transient overlays positioning
});