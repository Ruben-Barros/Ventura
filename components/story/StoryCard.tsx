import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Typography from '../ui/Typography';
import theme from '../../constants/theme';

const { width } = Dimensions.get('window');

interface StoryCardProps {
  title: string;
  subtitle?: string;
  coverImage: string;
  progress?: number;
  lastChoice?: string;
  rating?: number;
  duration?: string;
  storyCount?: number;
  style?: any;
  size?: 'large' | 'medium' | 'small';
  onPress?: () => void;
  showProgress?: boolean;
  showRating?: boolean;
  showPlayButton?: boolean;
  overlayContent?: boolean;
  isNew?: boolean;
}

export default function StoryCard({
  title,
  subtitle,
  coverImage,
  progress,
  lastChoice,
  rating,
  duration,
  storyCount,
  style,
  size = 'medium',
  onPress,
  showProgress = false,
  showRating = false,
  showPlayButton = false,
  overlayContent = true,
  isNew = false,
}: StoryCardProps) {
  const cardWidth = size === 'large' ? width * 0.9 : size === 'medium' ? width * 0.7 : width * 0.4;
  const cardHeight = size === 'large' ? cardWidth * 0.6 : cardWidth * 0.56;

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth, height: cardHeight }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ImageBackground
        source={{ uri: coverImage }}
        style={styles.image}
        imageStyle={styles.imageStyle}
      >
        {overlayContent && (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']}
            style={styles.gradient}
          />
        )}

        {isNew && (
          <View style={styles.newBadge}>
            <Typography variant="caption" style={styles.newText}>
              NEW
            </Typography>
          </View>
        )}

        <View style={styles.content}>
          {showPlayButton && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons 
                name="play" 
                size={size === 'large' ? 32 : 24} 
                color="white"
              />
            </TouchableOpacity>
          )}

          <View style={styles.textContainer}>
            <Typography 
              variant={size === 'large' ? 'h4' : 'h6'} 
              style={styles.title}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography 
                variant={size === 'large' ? 'body1' : 'caption'} 
                style={styles.subtitle}
              >
                {subtitle}
              </Typography>
            )}

            {showProgress && progress !== undefined && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBar, { width: `${progress}%` }]} />
                </View>
                <Typography variant="caption" style={styles.progressText}>
                  {progress}% Explored
                </Typography>
                {lastChoice && (
                  <Typography variant="caption" style={styles.lastChoice}>
                    Last Choice: {lastChoice}
                  </Typography>
                )}
              </View>
            )}

            {showRating && rating && (
              <View style={styles.ratingContainer}>
                <MaterialCommunityIcons 
                  name="star" 
                  size={size === 'large' ? 16 : 14} 
                  color={theme.colors.accent.secondary} 
                />
                <Typography 
                  variant={size === 'large' ? 'body2' : 'caption'} 
                  style={styles.rating}
                >
                  {rating}
                </Typography>
                {duration && (
                  <>
                    <Typography variant="caption" style={styles.dot}>•</Typography>
                    <Typography 
                      variant={size === 'large' ? 'body2' : 'caption'} 
                      style={styles.duration}
                    >
                      {duration}
                    </Typography>
                  </>
                )}
              </View>
            )}

            {storyCount !== undefined && (
              <Typography variant="caption" style={styles.storyCount}>
                {storyCount} stories
              </Typography>
            )}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.layout.thumbnails.borderRadius,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: theme.layout.thumbnails.borderRadius,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  content: {
    padding: 16,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.accent.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newText: {
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    color: theme.colors.text.primary,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBarBackground: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.accent.primary,
    borderRadius: 1,
  },
  progressText: {
    color: theme.colors.text.secondary,
    marginTop: 4,
    marginBottom: 2,
  },
  lastChoice: {
    color: theme.colors.text.muted,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  dot: {
    color: theme.colors.text.muted,
    marginHorizontal: 4,
  },
  duration: {
    color: theme.colors.text.secondary,
  },
  storyCount: {
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
}); 