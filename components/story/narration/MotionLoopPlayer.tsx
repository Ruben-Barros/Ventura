import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { VisualAsset } from '../../../types/narration.types';

interface MotionLoopPlayerProps {
  asset: VisualAsset; // Expecting type 'loop' or 'video'
  // Add any other props needed, e.g., isVisible, onPlaybackStatusUpdate
}

export function MotionLoopPlayer({ asset }: MotionLoopPlayerProps) {
  const videoRef = useRef<Video>(null);

  // Ensure video loops and plays when component is active
  useEffect(() => {
    videoRef.current?.playAsync(); // Attempt to play when asset changes or component mounts

    // Optional: Add cleanup logic if needed when component unmounts or asset changes
    // return () => {
    //   videoRef.current?.stopAsync();
    // };
  }, [asset.uri]); // Rerun effect if the video source changes

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded && status.didJustFinish) {
      // Manually restart if isLooping doesn't work reliably or for fine control
      videoRef.current?.replayAsync();
    } else if (status.isLoaded && !status.isPlaying && !status.didJustFinish) {
        // If paused for some reason (e.g., backgrounding), try playing again
        // Be careful not to create an infinite loop if pausing is intentional
        // videoRef.current?.playAsync();
    } else if (!status.isLoaded) {
        // Check for error only if not loaded
        if (status.error) {
            console.error("MotionLoopPlayer Error:", status.error);
            // Handle error - maybe show fallback?
        }
    }
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        style={styles.video}
        source={{ uri: asset.uri }}
        resizeMode={ResizeMode.CONTAIN} // Or COVER, depending on design
        isLooping // Attempt to use built-in looping
        shouldPlay // Attempt to auto-play
        isMuted // Loops are usually visual only
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        // Consider adding placeholder/loading state within the Video component if needed
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000', // Background for letter/pillarboxing
  },
  video: {
    width: '100%',
    height: '100%',
  },
});