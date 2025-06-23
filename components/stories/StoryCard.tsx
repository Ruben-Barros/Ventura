import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Link } from 'expo-router';
import { Story } from '../../types/story.types'; // Corrected import path

type StoryCardProps = {
  story: Story;
};

export default function StoryCard({ story }: StoryCardProps) {
  return (
    <Link href={`/stories/${story.id}/read`} asChild>
      <Pressable style={styles.container}>
        <Card style={styles.card}>
          <Card.Cover 
            source={{ uri: story.cover_image_url }} // Corrected property name
            style={styles.cover}
          />
          <Card.Content style={styles.content}>
            <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
              {story.title}
            </Text>
            <Text variant="bodySmall" numberOfLines={2} style={styles.description}>
              {story.description}
            </Text>
            <View style={styles.metadata}>
              <Text variant="labelSmall" style={styles.genre}>
                {story.genre_ids?.[0] ?? 'Unknown Genre'} // Corrected property name
              </Text>
              <Text variant="labelSmall" style={styles.readTime}>
                {story.estimated_length_minutes} min read // Corrected property name
              </Text>
            </View>
          </Card.Content>
        </Card>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    elevation: 2,
  },
  cover: {
    height: 150,
  },
  content: {
    padding: 8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#666',
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genre: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  readTime: {
    color: '#666',
  },
}); 