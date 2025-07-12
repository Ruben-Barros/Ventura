import { Link } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';

interface Story {
  id: string;
  title: string;
}

interface StoryCarouselProps {
  genre: string;
  stories: Story[];
}

const StoryCarousel: React.FC<StoryCarouselProps> = ({ genre, stories }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.genreTitle}>{genre}</Text>
      <FlatList
        data={stories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingLeft: 16 }}
        renderItem={({ item }) => (
          <Link href={`/story/${item.id}`} asChild>
            <Pressable>
              <View style={styles.storyCard}>
                <Text style={styles.storyTitle}>{item.title}</Text>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  genreTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 16,
  },
  storyCard: {
    width: 150,
    height: 250,
    backgroundColor: '#333',
    borderRadius: 8,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StoryCarousel;

