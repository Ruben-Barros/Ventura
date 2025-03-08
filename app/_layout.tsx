import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthProvider } from '../contexts/AuthContext';
import { StorytellerProvider } from '../contexts/StorytellerContext';
import { StoryExperienceProvider } from '../contexts/StoryExperienceContext';
import theme from '../constants/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StorytellerProvider>
        <StoryExperienceProvider>
          <PaperProvider theme={theme}>
            <SafeAreaProvider>
              <View style={styles.container}>
                <LinearGradient
                  colors={[theme.colors.background.gradient.start, theme.colors.background.gradient.end]}
                  style={styles.background}
                />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: theme.colors.background.primary,
                    },
                  }}
                />
              </View>
              <StatusBar style="light" />
            </SafeAreaProvider>
          </PaperProvider>
        </StoryExperienceProvider>
      </StorytellerProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
}); 