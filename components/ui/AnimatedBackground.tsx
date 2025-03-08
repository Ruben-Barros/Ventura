import React, { useEffect, useRef, memo } from 'react';
import { Animated, StyleSheet, ImageBackground, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

interface AnimatedBackgroundProps {
  imageUrl: string | null;
  isVisible?: boolean;
  overlayColor?: string[];
  blurRadius?: number;
}

/**
 * A component that displays an animated background image with a gradient overlay.
 * Optimized to prevent flickering when switching images by using image caching
 * and smooth transitions.
 */
const AnimatedBackground = memo(({
  imageUrl,
  isVisible = true,
  overlayColor = ['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)'],
  blurRadius = 0
}: AnimatedBackgroundProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const previousImageUrlRef = useRef<string | null>(null);
  
  // Cache the current and previous image
  const [currentImageUrl, setCurrentImageUrl] = React.useState<string | null>(null);
  const [previousImageUrl, setPreviousImageUrl] = React.useState<string | null>(null);
  
  // When imageUrl changes, update the cached URLs
  useEffect(() => {
    if (imageUrl !== currentImageUrl && imageUrl) {
      setPreviousImageUrl(currentImageUrl);
      previousImageUrlRef.current = currentImageUrl;
      setCurrentImageUrl(imageUrl);
    }
  }, [imageUrl, currentImageUrl]);
  
  // Handle visibility and cross-fade animations
  useEffect(() => {
    if (isVisible && currentImageUrl) {
      // When showing a new image, first fade out
      if (previousImageUrlRef.current !== currentImageUrl) {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          // Then fade in the new image
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      } else {
        // Just fade in if it's the same image
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    } else {
      // Fade out when not visible
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, currentImageUrl, opacity]);
  
  if (!currentImageUrl) return null;
  
  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Using expo-image for better caching and performance */}
      <Image
        source={{ uri: currentImageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={300}
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={overlayColor}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});

export default AnimatedBackground; 