import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  TouchableOpacity, 
  Dimensions,
  ImageBackground,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import Typography from '../components/ui/Typography';
import StoryCard from '../components/story/StoryCard';
import TabBar from '../components/navigation/TabBar';
import theme from '../constants/theme';

const { width, height } = Dimensions.get('window');

// Hero Story - Featured content
const HERO_STORY = {
  id: '0',
  title: 'The Last Horizon',
  subtitle: 'Epic Fantasy',
  description: 'A tale of courage, betrayal, and the ultimate choice between power and love.',
  coverImage: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  rating: 4.9,
  duration: '45 min',
  genre: 'Fantasy',
  isNew: true,
};

const CONTINUE_READING = [
  {
    id: '1',
    title: 'The Crimson Veil',
    subtitle: 'Mystery',
    coverImage: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    progress: 67,
    lastChoice: 'Betray the King',
    genre: 'Mystery',
    duration: '25 min',
  },
  {
    id: '2',
    title: 'The Lost Realm',
    subtitle: 'Adventure',
    coverImage: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    progress: 45,
    lastChoice: 'Enter the Tomb',
    genre: 'Adventure',
    duration: '30 min',
  },
];

const RECOMMENDED_FOR_YOU = [
  {
    id: '3',
    title: 'Starfall Legacy',
    subtitle: 'Sci-Fi',
    coverImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    duration: '35 min',
    genre: 'Sci-Fi',
    isNew: true,
  },
  {
    id: '4',
    title: 'Echoes of Dust',
    subtitle: 'Western',
    coverImage: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    duration: '28 min',
    genre: 'Western',
  },
];

const TRENDING_STORIES = [
  {
    id: '5',
    title: 'Whispers of the Abyss',
    subtitle: 'Horror',
    coverImage: 'https://images.unsplash.com/photo-1682687982468-b1d6eba0592d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    duration: '25 min',
    genre: 'Horror',
    playCount: '2.3K',
  },
  {
    id: '6',
    title: 'The Eternal Flame',
    subtitle: 'Fantasy',
    coverImage: 'https://images.unsplash.com/photo-1518116629808-4955d211e4a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    duration: '30 min',
    genre: 'Fantasy',
    playCount: '1.8K',
  },
];

const MULTIPLAYER_STORIES = [
  {
    id: '7',
    title: 'The Shadow Pact',
    subtitle: 'Dark Fantasy',
    coverImage: 'https://images.unsplash.com/photo-1512101176959-c557f3516787?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    activePlayers: 128,
    genre: 'Dark Fantasy',
    duration: '40 min',
  },
  {
    id: '8',
    title: 'City of Secrets',
    subtitle: 'Mystery',
    coverImage: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    activePlayers: 256,
    genre: 'Mystery',
    duration: '35 min',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const handleStoryPress = (storyId: string) => {
    router.push(`/stories/${storyId}`);
  };

  const renderHeroStory = () => (
    <TouchableOpacity 
      style={styles.heroContainer}
      onPress={() => handleStoryPress(HERO_STORY.id)}
    >
      <ImageBackground
        source={{ uri: HERO_STORY.coverImage }}
        style={styles.heroImage}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Typography variant="caption" style={styles.heroBadgeText}>
                NEW
              </Typography>
            </View>
            <Typography variant="h3" style={styles.heroTitle}>
              {HERO_STORY.title}
            </Typography>
            <Typography variant="subtitle1" style={styles.heroSubtitle}>
              {HERO_STORY.subtitle}
            </Typography>
            <Typography variant="body2" style={styles.heroDescription}>
              {HERO_STORY.description}
            </Typography>
            <View style={styles.heroMeta}>
              <View style={styles.heroMetaItem}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Typography variant="caption" style={styles.heroMetaText}>
                  {HERO_STORY.rating}
                </Typography>
              </View>
              <View style={styles.heroMetaItem}>
                <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                <Typography variant="caption" style={styles.heroMetaText}>
                  {HERO_STORY.duration}
                </Typography>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderContinueReading = ({ item }) => (
    <StoryCard
      title={item.title}
      subtitle={item.subtitle}
      coverImage={item.coverImage}
      progress={item.progress}
      lastChoice={item.lastChoice}
      onPress={() => handleStoryPress(item.id)}
      showProgress
      showPlayButton
      size="large"
      genre={item.genre}
      duration={item.duration}
    />
  );

  const renderRecommendedStory = ({ item }) => (
    <StoryCard
      title={item.title}
      subtitle={item.subtitle}
      coverImage={item.coverImage}
      rating={item.rating}
      duration={item.duration}
      onPress={() => handleStoryPress(item.id)}
      showRating
      size="medium"
      genre={item.genre}
      isNew={item.isNew}
    />
  );

  const renderTrendingStory = ({ item }) => (
    <StoryCard
      title={item.title}
      subtitle={item.subtitle}
      coverImage={item.coverImage}
      rating={item.rating}
      duration={item.duration}
      onPress={() => handleStoryPress(item.id)}
      showRating
      size="medium"
      genre={item.genre}
      playCount={item.playCount}
    />
  );

  const renderMultiplayerStory = ({ item }) => (
    <StoryCard
      title={item.title}
      subtitle={item.subtitle}
      coverImage={item.coverImage}
      onPress={() => handleStoryPress(item.id)}
      size="medium"
      genre={item.genre}
      duration={item.duration}
      activePlayers={item.activePlayers}
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
        <Animated.View entering={FadeIn.duration(1000)}>
          <Typography variant="h4" style={styles.welcomeText}>
            Welcome Back
          </Typography>
          <Typography variant="body2" style={styles.subText}>
            Your Next Epic Awaits – Dive In!
          </Typography>
        </Animated.View>

        {/* Hero Story */}
        {renderHeroStory()}

        {/* Continue Reading */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Continue Reading
          </Typography>
          <FlatList
            data={CONTINUE_READING}
            renderItem={renderContinueReading}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            snapToInterval={width * 0.9 + theme.spacing.md}
            decelerationRate="fast"
          />
        </View>

        {/* Recommended for You */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Recommended for You
          </Typography>
          <FlatList
            data={RECOMMENDED_FOR_YOU}
            renderItem={renderRecommendedStory}
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

        {/* Multiplayer Stories */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Live Stories
          </Typography>
          <FlatList
            data={MULTIPLAYER_STORIES}
            renderItem={renderMultiplayerStory}
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
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: theme.spacing.xl,
  },
  welcomeText: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  subText: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  heroContainer: {
    width: width,
    height: height * 0.6,
    marginBottom: theme.spacing.lg,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: theme.spacing.lg,
  },
  heroContent: {
    maxWidth: '80%',
  },
  heroBadge: {
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.layout.borderRadius.small,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  heroTitle: {
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  heroSubtitle: {
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  heroDescription: {
    color: '#FFFFFF',
    marginBottom: theme.spacing.md,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  heroMetaText: {
    color: '#FFFFFF',
    marginLeft: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  horizontalList: {
    paddingHorizontal: theme.spacing.md,
  },
});