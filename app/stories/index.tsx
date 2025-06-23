import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Searchbar } from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';

import Typography from '../../components/ui/Typography';
import StoryCard from '../../components/story/StoryCard';
import TabBar from '../../components/navigation/TabBar';
import theme from '../../constants/theme';

const { width } = Dimensions.get('window');

const FEATURED_STORY = {
  id: '1',
  title: 'The Midnight Oracle',
  subtitle: 'A mystical journey through time',
  coverImage: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  rating: 4.9,
  duration: '30 min',
};

const STORY_CATEGORIES = [
  { id: 'adventure', name: 'Adventure', icon: 'compass' },
  { id: 'fantasy', name: 'Fantasy', icon: 'castle' },
  { id: 'mystery', name: 'Mystery', icon: 'magnify' },
  { id: 'scifi', name: 'Sci-Fi', icon: 'rocket' },
  { id: 'romance', name: 'Romance', icon: 'heart' },
  { id: 'horror', name: 'Horror', icon: 'ghost' },
  { id: 'historical', name: 'Historical', icon: 'book-open-variant' },
  { id: 'comedy', name: 'Comedy', icon: 'emoticon' },
];

const STORY_GOALS = [
  {
    id: 'sleep',
    title: 'Fall Asleep',
    description: 'Calm bedtime stories to help you drift off',
    image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    storyCount: 12,
  },
  {
    id: 'stress',
    title: 'Reduce Stress',
    description: 'Peaceful narratives for anxiety relief',
    image: 'https://images.unsplash.com/photo-1493752603190-08d8b5d1781d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    storyCount: 8,
  },
  {
    id: 'creativity',
    title: 'Spark Creativity',
    description: 'Inspiring tales to fuel your imagination',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    storyCount: 15,
  },
];

const TRENDING_STORIES = [
  {
    id: '2',
    title: 'Echoes of Atlantis',
    subtitle: 'Fantasy',
    coverImage: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    duration: '25 min',
  },
  {
    id: '3',
    title: 'Starlight Pioneers',
    subtitle: 'Sci-Fi',
    coverImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    duration: '20 min',
  },
];

export default function StoriesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // Added type
  const insets = useSafeAreaInsets();

  const handleStoryPress = (storyId: string) => {
    router.push(`/stories/${storyId}`);
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    router.push(`/stories?category=${categoryId}`);
  };

  const handleGoalPress = (goalId: string) => {
    router.push(`/stories?goal=${goalId}`);
  };

  const renderCategory = ({ item }: { item: any }) => ( // Added basic type
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.categoryButtonSelected
      ]}
      onPress={() => handleCategoryPress(item.id)}
    >
      <MaterialCommunityIcons
        name={item.icon}
        size={24}
        color={selectedCategory === item.id ? theme.colors.accent.primary : theme.colors.text.primary}
        style={styles.categoryIcon}
      />
      <Typography 
        variant="body2" 
        style={[
          styles.categoryText,
          ...(selectedCategory === item.id ? [styles.categoryTextSelected] : []) // Conditionally spread style
        ]}
      >
        {item.name}
      </Typography>
    </TouchableOpacity>
  );

  const renderGoal = ({ item }: { item: any }) => ( // Added basic type
    <TouchableOpacity
      style={styles.goalCard}
      onPress={() => handleGoalPress(item.id)}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.goalImage}
        imageStyle={styles.goalImageStyle}
      >
        <LinearGradient
          colors={['transparent', theme.colors.overlay.dark]}
          style={styles.goalGradient}
        />
        <View style={styles.goalContent}>
          <Typography variant="h6" style={styles.goalTitle}>
            {item.title}
          </Typography>
          <Typography variant="body2" style={styles.goalDescription}>
            {item.description}
          </Typography>
          <Typography variant="caption" style={styles.goalStoryCount}>
            {item.storyCount} stories
          </Typography>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderTrendingStory = ({ item }: { item: any }) => ( // Added basic type
    <StoryCard
      title={item.title}
      subtitle={item.subtitle}
      coverImage={item.coverImage}
      rating={item.rating}
      duration={item.duration}
      onPress={() => handleStoryPress(item.id)}
      showRating
      size="medium"
    />
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        <Typography variant="h4" style={styles.screenTitle}>
          Stories
        </Typography>

        {/* Featured Story */}
        <View style={styles.featuredContainer}>
          <ImageBackground
            source={{ uri: FEATURED_STORY.coverImage }}
            style={styles.featuredImage}
            imageStyle={styles.featuredImageStyle}
          >
            <LinearGradient
              colors={['transparent', theme.colors.overlay.dark]}
              style={styles.featuredGradient}
            />
            <View style={styles.featuredContent}>
              <Typography variant="h3" style={styles.featuredTitle}>
                {FEATURED_STORY.title}
              </Typography>
              <Typography variant="body1" style={styles.featuredSubtitle}>
                {FEATURED_STORY.subtitle}
              </Typography>
              <View style={styles.featuredMeta}>
                <MaterialCommunityIcons name="star" size={16} color={theme.colors.accent.secondary} />
                <Typography variant="body2" style={styles.featuredRating}>
                  {FEATURED_STORY.rating}
                </Typography>
                <Typography variant="body2" style={styles.featuredDot}>•</Typography>
                <Typography variant="body2" style={styles.featuredDuration}>
                  {FEATURED_STORY.duration}
                </Typography>
              </View>
              <TouchableOpacity
                style={styles.playButton}
                onPress={() => handleStoryPress(FEATURED_STORY.id)}
              >
                <MaterialCommunityIcons name="play" size={24} color="white" />
                <Typography variant="button" style={styles.playButtonText}>
                  Start Story
                </Typography>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* Search bar */}
        <Searchbar
          placeholder="Search stories..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={theme.colors.text.primary}
          inputStyle={styles.searchInput}
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Browse by Category
          </Typography>
          <FlatList
            data={STORY_CATEGORIES}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Story Goals */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Browse by Goal
          </Typography>
          <FlatList
            data={STORY_GOALS}
            renderItem={renderGoal}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Trending Stories */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Trending Now
          </Typography>
          <FlatList
            data={TRENDING_STORIES}
            renderItem={renderTrendingStory}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>
      </ScrollView>
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 90,
  },
  screenTitle: {
    color: theme.colors.text.primary,
    marginTop: 20,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  featuredContainer: {
    marginBottom: 24,
  },
  featuredImage: {
    width: '100%',
    height: width * 0.8,
  },
  featuredImageStyle: {
    width: '100%',
    height: '100%',
  },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  featuredTitle: {
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  featuredSubtitle: {
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuredRating: {
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  featuredDot: {
    color: theme.colors.text.muted,
    marginHorizontal: 8,
  },
  featuredDuration: {
    color: theme.colors.text.secondary,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: theme.colors.backgroundDetails.secondary, // Corrected path
    borderRadius: 8,
  },
  searchInput: {
    color: theme.colors.text.primary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  categoriesContainer: {
    marginBottom: 32,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundDetails.secondary, // Corrected path
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  categoryButtonSelected: {
    backgroundColor: theme.colors.accent.primary,
    borderColor: theme.colors.accent.primary,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    color: theme.colors.text.primary,
  },
  categoryTextSelected: {
    color: theme.colors.text.primary,
  },
  goalCard: {
    width: width * 0.7,
    height: 200,
    marginRight: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  goalImage: {
    width: '100%',
    height: '100%',
  },
  goalImageStyle: {
    borderRadius: 8,
  },
  goalGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  goalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  goalTitle: {
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  goalDescription: {
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  goalStoryCount: {
    color: theme.colors.text.muted,
  },
}); 