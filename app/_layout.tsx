import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthProvider } from '../contexts/AuthContext'; // Restore AuthProvider import
import { StorytellerProvider } from '../contexts/StorytellerContext';
import { StoryExperienceProvider } from '../contexts/StoryExperienceContext';
import { AchievementsProvider } from '../contexts/AchievementsContext'; // Import AchievementsProvider
import theme from '../constants/theme';

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <AuthProvider>
          <StorytellerProvider>
            <StoryExperienceProvider>
              <AchievementsProvider>
                {/* Container View now wraps Stack directly */}
                <View style={styles.container}>
                  <LinearGradient
                    colors={[theme.colors.backgroundDetails.gradient.start, theme.colors.backgroundDetails.gradient.end]}
                    style={styles.background}
                  />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: {
                        // Ensure content background is transparent to see the gradient
                        backgroundColor: 'transparent',
                      },
                    }}
                  />
                </View>
                <StatusBar style="light" />
              </AchievementsProvider>
            </StoryExperienceProvider>
          </StorytellerProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDetails.primary,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});