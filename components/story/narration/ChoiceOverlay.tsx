import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { ProgressRing } from './ProgressRing'; // Import the actual ProgressRing later
import { useNarration } from '../../../contexts/NarrationContext'; // Context might be used for more complex logic later
import { NarrationChoice } from '../../../types/narration.types';

type UUID = string;

interface ChoiceOverlayProps {
  isVisible: boolean;
  choices: NarrationChoice[];
  experienceMode: 'dynamic' | 'calm';
  onChoose: (choiceId: UUID) => void; // Callback when a choice is made
}

// TODO: Define theme colors
const theme = {
    colors: {
        overlayBackground: 'rgba(0, 0, 0, 0.8)',
        cardBackground: 'rgba(255, 255, 255, 0.1)',
        textLight: '#FFF',
        textSubtle: 'rgba(255, 255, 255, 0.7)',
        timerRing: '#FFF',
        badgeBackground: 'rgba(255, 255, 255, 0.2)',
    },
};

export function ChoiceOverlay({
    isVisible,
    choices,
    experienceMode,
    onChoose
}: ChoiceOverlayProps) {
  // Animation values
  const opacity = useSharedValue(0);
  const timerProgress = useSharedValue(1); // For the countdown ring

  const decisionTime = experienceMode === 'dynamic'
    ? (choices[0]?.decisionTimeSeconds ?? 10) // Default 10s for dynamic
    : 0;

  // Animate overlay opacity and timer ring
  useEffect(() => {
    if (isVisible) {
      opacity.value = withTiming(1, { duration: 300 });
      if (experienceMode === 'dynamic' && decisionTime > 0) {
        timerProgress.value = 1; // Reset timer
        timerProgress.value = withTiming(0, {
          duration: decisionTime * 1000,
          easing: Easing.linear,
        }, (finished) => {
          if (finished) {
            // Handle timeout - potentially auto-select first choice or do nothing
            console.log("Choice timer finished.");
            // onChoose(choices[0].id); // Example: auto-choose first option on timeout
          }
        });
      } else {
        timerProgress.value = 1; // Keep full or hide for Calm mode
      }
    } else {
      // Start fade out animation immediately when isVisible becomes false
      opacity.value = withTiming(0, { duration: 300 });
      timerProgress.value = 1; // Reset progress when hidden
    }
  }, [isVisible, experienceMode, decisionTime]); // Rerun effect when visibility or mode changes

  // Animated style for the overlay container
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Handle choice selection
  const handleSelect = (choiceId: UUID) => {
      // Stop timer animation visually immediately
      timerProgress.value = 1; // Or cancelAnimation(timerProgress);
      // Fade out before calling onChoose to make transition smoother
      opacity.value = withTiming(0, { duration: 200 }, () => {
          onChoose(choiceId); // Call the passed callback
      });
  };

  // Don't render anything if not visible or no choices
  if (!choices || choices.length === 0) {
      // Note: We still need the Modal structure for the fade-out animation to work correctly
      // when isVisible becomes false. A completely null return would prevent the fade-out.
      // So we render the modal but keep its content empty or hidden.
      return (
          <Modal transparent visible={isVisible} animationType="none" onRequestClose={() => {/* Handle back button if needed */}}>
              <Animated.View style={[styles.container, animatedContainerStyle]} />
          </Modal>
      );
  }

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={() => {/* Handle back button if needed */}}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        {/* Layout for two large cards */}
        <View style={styles.cardContainer}>
          {choices.slice(0, 2).map((choice) => ( // Only show max 2 choices visually as cards
            <TouchableOpacity
                key={choice.id}
                onPress={() => handleSelect(choice.id)}
                style={styles.card}
                activeOpacity={0.7}
            >
              <Text style={styles.cardText}>{choice.choiceText}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Timer Ring or "No rush" Badge */}
        <View style={styles.timerContainer}>
          {experienceMode === 'dynamic' && decisionTime > 0 ? (
            <ProgressRing // Use the actual ProgressRing component here
                progress={timerProgress.value} // Pass shared value directly if ProgressRing supports it
                radius={30}
                strokeWidth={4}
                color={theme.colors.timerRing}
            />
          ) : (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>No rush</Text>
            </View>
          )}
        </View>

         {/* Optional: Voice prompt subtitle */}
         <Text style={styles.voicePrompt}>Say your choice...</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.overlayBackground,
    },
    cardContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        width: '100%',
        justifyContent: 'space-around', // Adjust as needed
    },
    card: {
        flex: 1, // Each card takes up half the space minus margins
        marginHorizontal: 10,
        paddingVertical: 40, // Make cards tall
        paddingHorizontal: 15,
        backgroundColor: theme.colors.cardBackground,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 150, // Ensure minimum height
    },
    cardText: {
        color: theme.colors.textLight,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    timerContainer: {
        position: 'absolute',
        bottom: 80, // Position above potential bottom nav or controls
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.colors.badgeBackground,
        borderRadius: 15,
    },
    badgeText: {
        color: theme.colors.textLight,
        fontSize: 12,
        fontWeight: 'bold',
    },
    voicePrompt: {
        color: theme.colors.textSubtle,
        position: 'absolute',
        bottom: 40, // Position below timer/badge
        fontSize: 14,
    },
});