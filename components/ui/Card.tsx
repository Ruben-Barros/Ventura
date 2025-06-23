import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ViewStyle, ImageStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Typography from './Typography';

interface CardProps {
  title: string;
  subtitle?: string;
  coverImage: string;
  onPress?: () => void;
  style?: ViewStyle;
  fullImage?: boolean;
  overlayContent?: boolean;
}

const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  coverImage,
  onPress,
  style,
  fullImage = false,
  overlayContent = false,
}) => {
  const renderContent = () => (
    <>
      <Image source={{ uri: coverImage }} style={[styles.image, fullImage && styles.fullImage]} />
      {overlayContent ? (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.overlay}
        >
          <Typography variant="h6" style={styles.overlayTitle}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" style={styles.overlaySubtitle}>
              {subtitle}
            </Typography>
          )}
        </LinearGradient>
      ) : (
        <View style={styles.content}>
          <Typography variant="body1" style={styles.title}> // Changed to valid variant
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" style={styles.subtitle}>
              {subtitle}
            </Typography>
          )}
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
  },
  fullImage: {
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    padding: 12,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingTop: 48,
  },
  title: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  overlayTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overlaySubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default Card; 