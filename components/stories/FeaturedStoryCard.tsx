import React from 'react';
import { StyleSheet, ImageBackground, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Story } from '../../context/StorytellerContext';

type FeaturedStoryCardProps = {
  story: Story;
};

export default function FeaturedStoryCard({ story }: FeaturedStoryCardProps) {
  return (
    <Link href={`/stories/${story.id}/read`} asChild>
      <Pressable style={styles.container}>
        <ImageBackground
          source={{ uri: story.cover_image }}
          style={styles.background}
          imageStyle={styles.image}
        >
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <Text variant="titleLarge" style={styles.title}>
              {story.title}
            </Text>
            <Text variant="bodyMedium" style={styles.description} numberOfLines={2}>
              {story.description}
            </Text>
            <Text variant="labelSmall" style={styles.metadata}>
              {story.genre} • {story.read_time} min read
            </Text>
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 400,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  background: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  image: {
    borderRadius: 12,
  },
  gradient: {
    padding: 16,
    paddingTop: 100,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  metadata: {
    color: '#fff',
    opacity: 0.7,
  },
}); 