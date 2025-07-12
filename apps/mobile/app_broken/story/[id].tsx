import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getLatencyAction } from '../../services/latency';

export default function StoryPlayerScreen() {
  const { id } = useLocalSearchParams();
  const latencyBudgetMs = 500; // Example latency budget
  const estimatedLoadTimeMs = 750; // Example estimated load time

  const action = getLatencyAction(latencyBudgetMs, estimatedLoadTimeMs);

  return (
    <View style={styles.container}>
      {action === 'loader' ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <Text style={styles.text}>Cached Trailer for Story ID: {id}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 24,
  },
});

