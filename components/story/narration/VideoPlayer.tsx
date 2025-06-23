import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { VisualAsset } from '../../../types/narration.types';

interface VideoPlayerProps {
  asset: VisualAsset; // Expecting type 'video'
  // Add props like onEnd, isVisible etc. if needed
}

// TODO: Define theme colors
const theme = {
    colors: {
        loadingIndicator: '#FFF',
        videoBackground: '#000',
    },
};

export function VideoPlayer({ asset }: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Play video when component mounts or asset changes
  useEffect(() => {
    setIsLoading(true); // Show loading indicator when source changes
    videoRef.current?.loadAsync({ uri: asset.uri }, { shouldPlay: true }); // Load and play

    // Optional: Cleanup logic
    // return () => {
    //   videoRef.current?.unloadAsync();
    // };
  }, [asset.uri]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
        if (isLoading) {
            setIsLoading(false); // Hide loading indicator once ready
        }
        // Handle end of video if needed (e.g., navigate or show controls)
        if (status.didJustFinish) {
            console.log("Full video finished playing.");
            // Potentially call an onEnd prop
        }
    } else {
        // Handle unload or error states
        if (status.error) {
            console.error("VideoPlayer Error:", status.error);
            setIsLoading(false); // Hide loading indicator on error too
            // TODO: Show error message or fallback
        }
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri: asset.uri }} // Assumes HLS stream URL or direct video file
        resizeMode={ResizeMode.CONTAIN} // Or COVER
        shouldPlay={true} // Auto-play when loaded
        isMuted={false} // Full video usually has sound
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        // Note: HLS streaming might require additional configuration or libraries
        // depending on complexity (e.g., DRM, adaptive bitrate UI)
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.loadingIndicator} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.videoBackground,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
  }
});