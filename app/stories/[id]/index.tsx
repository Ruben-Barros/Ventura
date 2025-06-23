import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Dimensions, Image, useWindowDimensions, Share } from 'react-native';
import { useLocalSearchParams, Link, Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { IconButton, Divider, TextInput as PaperTextInput, Avatar } from 'react-native-paper';
import Typography from '../../../components/ui/Typography';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import { useAuth } from '../../../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// Mock data
const mockStoryProgress = {
  completed: false,
  currentSegmentId: 'intro',
  percentComplete: 25,
  lastPlayedAt: new Date().toISOString(),
};

const mockReviews = [
  {
    id: '1',
    userId: '101',
    userName: 'Sarah Johnson',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    rating: 5,
    reviewText: 'This story kept me engaged throughout. The choices feel meaningful and the writing is beautiful.',
    createdAt: '2023-09-18T14:32:00Z',
  },
  {
    id: '2',
    userId: '102',
    userName: 'Michael Chen',
    userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100',
    rating: 4,
    reviewText: 'Great adventure with interesting twists. Some paths are more engaging than others.',
    createdAt: '2023-09-15T09:12:00Z',
  },
  {
    id: '3',
    userId: '103',
    userName: 'Jessica Lee',
    userAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100',
    rating: 5,
    reviewText: 'One of the best interactive stories I\'ve read. Can\'t wait for more from this author!',
    createdAt: '2023-09-10T19:45:00Z',
  },
];

const similarStories = [
  {
    id: '201',
    title: 'Mountain Mystery',
    coverImage: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=300',
    genre: 'Mystery/Adventure',
    rating: 4.7,
  },
  {
    id: '202',
    title: 'Deep Blue',
    coverImage: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=300',
    genre: 'Adventure/Sci-Fi',
    rating: 4.5,
  },
  {
    id: '203',
    title: 'Ancient Ruins',
    coverImage: 'https://images.unsplash.com/photo-1549221840-91d424262724?w=300',
    genre: 'Adventure/Historical',
    rating: 4.3,
  },
];

// Function to render star rating
const renderStars = (rating: number) => { // Added type for rating
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  return (
    <View style={styles.ratingContainer}>
      {[...Array(fullStars)].map((_, i) => (
        <Ionicons key={`full-${i}`} name="star" size={16} color="#FFD700" style={styles.starIcon} />
      ))}
      {halfStar && <Ionicons key="half" name="star-half" size={16} color="#FFD700" style={styles.starIcon} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Ionicons key={`empty-${i}`} name="star-outline" size={16} color="#FFD700" style={styles.starIcon} />
      ))}
      <Typography variant="caption" style={styles.ratingText}>{rating.toFixed(1)}</Typography>
    </View>
  );
};

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  
  const [storyDetails, setStoryDetails] = useState<any>(null); // Added basic type
  const [userProgress, setUserProgress] = useState(mockStoryProgress);
  const [reviews, setReviews] = useState(mockReviews);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      // Simulate API loading
      setIsLoading(true);
      
      // In a real app, fetch the story details, user progress, and reviews
      setTimeout(() => {
        // Mock story details
        setStoryDetails({
          id,
          title: 'The Forest of Whispers',
          subtitle: 'Epic Fantasy',
          description: 'Venture into an ancient forest where the trees share secrets and magical beings dwell in hidden glades. Every choice you make shapes your journey through this enchanting, and sometimes dangerous, realm.',
          coverImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000',
          author: 'Elena Meadows',
          genre: ['Fantasy', 'Adventure'],
          tags: ['forest', 'magic', 'creatures'],
          estimatedLength: '25 min',
          difficulty: 'Medium',
          language: 'English',
          rating: 4.7,
          playCount: 1280,
          activePlayers: 128,
          createdAt: '2023-08-15T10:30:00Z',
          updatedAt: '2023-09-01T14:20:00Z',
        });
        
        setIsLoading(false);
      }, 1500);
    };
    
    fetchData();
  }, [id]);
  
  const handleStartStory = () => {
    router.push(`/stories/${id}/read`);
  };
  
  const handleContinueStory = () => {
    router.push(`/stories/${id}/read?continueFrom=${userProgress.currentSegmentId}`);
  };
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, save this preference to the user's profile
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing interactive story: ${storyDetails?.title} on Ventura!`, // Added optional chaining
        url: `https://ventura.app/stories/${id}`,
        title: `Share: ${storyDetails?.title}`, // Added optional chaining
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  const submitReview = () => {
    if (newReview && newRating > 0) {
      const review = {
        id: `new-${Date.now()}`,
        userId: user?.id || 'guest',
        userName: user?.email || 'Guest Reader', // Use email as fallback name
        userAvatar: 'https://ui-avatars.com/api/?name=Guest+Reader', // Removed photoURL as it's not in User type
        rating: newRating,
        reviewText: newReview,
        createdAt: new Date().toISOString(),
      };
      
      // Add the new review to the top of the list
      setReviews([review, ...reviews]);
      
      // Reset form
      setNewReview('');
      setNewRating(0);
    }
  };
  
  if (isLoading || !storyDetails) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingSpinner}>
            <MaterialCommunityIcons name="netflix" size={48} color="#E50914" />
          </View>
          <Typography variant="h6" style={styles.loadingText}>Loading...</Typography>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: storyDetails.coverImage }}
            style={styles.heroImage}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.heroGradient}
            >
              <View style={styles.header}>
                <IconButton
                  icon="arrow-left"
                  iconColor="#FFFFFF"
                  size={24}
                  onPress={() => router.back()}
                  style={styles.backButton}
                />
                <View style={styles.headerActions}>
                  <IconButton
                    icon={isFavorite ? 'heart' : 'heart-outline'}
                    iconColor={isFavorite ? '#FF6B6B' : '#FFFFFF'}
                    size={24}
                    onPress={toggleFavorite}
                    style={styles.actionButton}
                  />
                  <IconButton
                    icon="share-variant"
                    iconColor="#FFFFFF"
                    size={24}
                    onPress={handleShare}
                    style={styles.actionButton}
                  />
                </View>
              </View>
              
              <View style={styles.titleContainer}>
                <View style={styles.heroBadge}>
                  <Typography variant="caption" style={styles.heroBadgeText}>
                    NEW
                  </Typography>
                </View>
                <Typography variant="h2" style={styles.title}>
                  {storyDetails.title}
                </Typography>
                <Typography variant="body1" style={styles.subtitle}>
                  {storyDetails.subtitle}
                </Typography>
                <View style={styles.heroMeta}>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Typography variant="caption" style={styles.heroMetaText}>
                      {storyDetails.rating}
                    </Typography>
                  </View>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                    <Typography variant="caption" style={styles.heroMetaText}>
                      {storyDetails.estimatedLength}
                    </Typography>
                  </View>
                  <View style={styles.heroMetaItem}>
                    <Ionicons name="people-outline" size={16} color="#FFFFFF" />
                    <Typography variant="caption" style={styles.heroMetaText}>
                      {storyDetails.activePlayers} playing
                    </Typography>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Play Button */}
        <TouchableOpacity 
          style={styles.playButton}
          onPress={userProgress && !userProgress.completed ? handleContinueStory : handleStartStory}
        >
          <MaterialCommunityIcons name="play" size={24} color="#000000" />
          <Typography variant="button" style={styles.playButtonText}>
            {userProgress && !userProgress.completed 
              ? `Continue Story (${Math.round(userProgress.percentComplete)}%)`
              : 'Begin Story'}
          </Typography>
        </TouchableOpacity>

        {/* Story Info */}
        <View style={styles.infoSection}>
          <Typography variant="body1" style={styles.description}>
            {storyDetails.description}
          </Typography>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="map-marker-path" size={24} color="#5B76CB" />
              <Typography variant="body2" style={styles.statText}>
                {storyDetails?.genre?.length ?? 0} Genres
              </Typography>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="gesture-tap" size={24} color="#5B76CB" />
              <Typography variant="body2" style={styles.statText}>
                {storyDetails?.difficulty}
              </Typography>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="play-circle" size={24} color="#5B76CB" />
              <Typography variant="body2" style={styles.statText}>
                {storyDetails?.playCount ?? 0} Plays
              </Typography>
            </View>
          </View>

          <View style={styles.tagsContainer}>
            {storyDetails?.tags?.map((tag: string) => ( // Added type for tag
              <View key={tag} style={styles.tagContainer}>
                <Typography variant="caption" style={styles.tagText}>
                  {tag}
                </Typography>
              </View>
            ))}
          </View>
        </View>

        {/* Similar Stories */}
        <View style={styles.section}>
          <Typography variant="h5" style={styles.sectionTitle}>
            More Like This
          </Typography>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {similarStories.map((story: any) => ( // Added basic type for story
              <TouchableOpacity 
                key={story.id}
                style={styles.similarStory}
                onPress={() => router.push(`/stories/${story.id}`)}
              >
                <ImageBackground
                  source={{ uri: story.coverImage }}
                  style={styles.similarStoryImage}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.similarStoryGradient}
                  >
                    <Typography variant="body2" style={styles.similarStoryTitle}>
                      {story.title}
                    </Typography>
                    <Typography variant="caption" style={styles.similarStoryGenre}>
                      {story.genre}
                    </Typography>
                    <View style={styles.similarStoryRating}>
                      <Ionicons name="star" size={12} color="#FFD700" />
                      <Typography variant="caption" style={styles.similarStoryRatingText}>
                        {story.rating}
                      </Typography>
                    </View>
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroContainer: {
    width: width,
    height: height * 0.6,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginLeft: 8,
  },
  titleContainer: {
    marginBottom: 16,
  },
  heroBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  heroMetaText: {
    color: '#FFFFFF',
    marginLeft: 4,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  playButtonText: {
    color: '#000000',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  infoSection: {
    padding: 16,
  },
  description: {
    color: '#FFFFFF',
    lineHeight: 24,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statText: {
    color: '#FFFFFF',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  tagContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  similarStory: {
    width: 160,
    height: 220,
    marginRight: 16,
  },
  similarStoryImage: {
    width: '100%',
    height: '100%',
  },
  similarStoryGradient: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'flex-end',
  },
  similarStoryTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  similarStoryGenre: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  similarStoryRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  similarStoryRatingText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 12,
  },
  // Added missing styles for renderStars
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: 4,
    color: '#FFD700', // Match star color
    fontSize: 14,
  },
});