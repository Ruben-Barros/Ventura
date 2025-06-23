import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import StoryVisual from '../components/story/StoryVisual'; // Removed import

export default function ThreeTestScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* <StoryVisual /> */} {/* Removed usage */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'black', // Match the main app background
  },
  container: {
    // flex: 1, // Remove flex: 1
    width: '100%', // Use full width
    height: 400, // Set an explicit height
    backgroundColor: 'darkblue', // Different background to see the container
  },
});