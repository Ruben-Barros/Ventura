import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import StoryCarousel from '../../components/StoryCarousel';

const stories = [
  { id: '1', title: 'Escape the Nebula' },
  { id: '2', title: 'The Crimson Cipher' },
  { id: '3', title: 'Echoes of the Void' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <StoryCarousel genre="Sci-Fi" stories={stories} />
        <StoryCarousel genre="Mystery" stories={stories} />
        <StoryCarousel genre="Adventure" stories={stories} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
