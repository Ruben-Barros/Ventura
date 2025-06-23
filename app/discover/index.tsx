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

const RECOMMENDED_STORIES = [
  {
    id: '1',
    title: 'The Crystal Cave',
    subtitle: 'Fantasy Adventure',
    coverImage: 'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    duration: '25 min',
  },
  {
    id: '2',
    title: 'Neon Dreams',
    subtitle: 'Cyberpunk Mystery',
    coverImage: 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.6,
    duration: '30 min',
  },
];

const COLLECTIONS = [
  {
    id: '1',
    title: 'Bedtime Stories',
    description: 'Perfect for winding down',
    image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    storyCount: 12,
  },
  {
    id: '2',
    title: 'Quick Adventures',
    description: 'Short but exciting tales',
    image: 'https://images.unsplash.com/photo-1493752603190-08d8b5d1781d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    storyCount: 8,
  },
];

const STORYTELLERS = [
  {
    id: '1',
    name: 'Lyra Luminous',
    description: 'Weaves tales with wonder and wisdom',
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    storiesCreated: 24,
  },
  {
    id: '2',
    name: 'Orion Odyssey',
    description: 'Bold and unpredictable narratives',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    storiesCreated: 18,
  },
];

const NEW_RELEASES = [
  {
    id: '3',
    title: 'Ocean Whispers',
    subtitle: 'Underwater Fantasy',
    coverImage: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    duration: '20 min',
  },
  {
    id: '4',
    title: 'Desert Mirage',
    subtitle: 'Adventure',
    coverImage: 'https://images.unsplash.com/photo-1682687982468-b1d6eba0592d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    duration: '35 min',
  },
];

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  const handleStoryPress = (storyId: string) => {
    router.push(`/stories/${storyId}`);
  };

  const handleCollectionPress = (collectionId: string) => {
    router.push(`/collections/${collectionId}`);
  };

  const handleStorytellerPress = (storytellerId: string) => {
    router.push(`/storytellers/${storytellerId}`);
  };

  const renderStoryCard = ({ item }: { item: any }) => ( // Added basic type for item
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

  const renderCollection = ({ item }: { item: any }) => ( // Added basic type for item
    <TouchableOpacity
      style={styles.collectionCard}
      onPress={() => handleCollectionPress(item.id)}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.collectionImage}
        imageStyle={styles.collectionImageStyle}
      >
        <LinearGradient
          colors={['transparent', theme.colors.overlay.dark]}
          style={styles.collectionGradient}
        />
        <View style={styles.collectionContent}>
          <Typography variant="h6" style={styles.collectionTitle}>
            {item.title}
          </Typography>
          <Typography variant="body2" style={styles.collectionDescription}>
            {item.description}
          </Typography>
          <Typography variant="caption" style={styles.collectionCount}>
            {item.storyCount} stories
          </Typography>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderStoryteller = ({ item }: { item: any }) => ( // Added basic type for item
    <TouchableOpacity
      style={styles.storytellerCard}
      onPress={() => handleStorytellerPress(item.id)}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.storytellerImage}
        imageStyle={styles.storytellerImageStyle}
      >
        <LinearGradient
          colors={['transparent', theme.colors.overlay.dark]}
          style={styles.storytellerGradient}
        />
        <View style={styles.storytellerContent}>
          <Typography variant="h6" style={styles.storytellerName}>
            {item.name}
          </Typography>
          <Typography variant="body2" style={styles.storytellerDescription}>
            {item.description}
          </Typography>
          <View style={styles.storytellerMeta}>
            <MaterialCommunityIcons name="star" size={14} color={theme.colors.accent.secondary} />
            <Typography variant="caption" style={styles.storytellerRating}>
              {item.rating}
            </Typography>
            <Typography variant="caption" style={styles.storytellerDot}>•</Typography>
            <Typography variant="caption" style={styles.storytellerStories}>
              {item.storiesCreated} stories
            </Typography>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
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
          Discover
        </Typography>

        <Searchbar
          placeholder="Search stories, storytellers, or collections..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor={theme.colors.text.primary}
          inputStyle={styles.searchInput}
          placeholderTextColor={theme.colors.text.secondary}
        />

        {/* Recommended Stories */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Recommended for You
          </Typography>
          <FlatList
            data={RECOMMENDED_STORIES}
            renderItem={renderStoryCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Collections */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Collections
          </Typography>
          <FlatList
            data={COLLECTIONS}
            renderItem={renderCollection}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Storytellers */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            Featured Storytellers
          </Typography>
          <FlatList
            data={STORYTELLERS}
            renderItem={renderStoryteller}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* New Releases */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            New Releases
          </Typography>
          <FlatList
            data={NEW_RELEASES}
            renderItem={renderStoryCard}
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
    backgroundColor: theme.colors.background, // Corrected path
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
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: theme.colors.backgroundDetails.secondary, // Use secondary background detail color
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
  collectionCard: {
    width: width * 0.8,
    height: 160,
    marginRight: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  collectionImageStyle: {
    borderRadius: 8,
  },
  collectionGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  collectionContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  collectionTitle: {
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  collectionDescription: {
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  collectionCount: {
    color: theme.colors.text.muted,
  },
  storytellerCard: {
    width: width * 0.7,
    height: 200,
    marginRight: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  storytellerImage: {
    width: '100%',
    height: '100%',
  },
  storytellerImageStyle: {
    borderRadius: 8,
  },
  storytellerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  storytellerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  storytellerName: {
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  storytellerDescription: {
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  storytellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storytellerRating: {
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  storytellerDot: {
    color: theme.colors.text.muted,
    marginHorizontal: 8,
  },
  storytellerStories: {
    color: theme.colors.text.secondary,
  },
}); 