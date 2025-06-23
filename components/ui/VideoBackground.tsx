import React, { useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

interface VideoBackgroundProps {
  source: any; // Can be require() or { uri: string }
  style?: object;
}

export default function VideoBackground({ source, style }: VideoBackgroundProps) {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    // Ensure video plays when component mounts
    videoRef.current?.playAsync();
  }, []);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      // Handle error
      if (status.error) {
        console.error(`Video Error: ${status.error}`);
      }
      return;
    }
    // Loop the video
    if (status.didJustFinish) {
      videoRef.current?.replayAsync();
    }
  };

  return (
    <Video
      ref={videoRef}
      style={[styles.video, style]}
      source={source}
      resizeMode={ResizeMode.COVER} // Cover the container
      shouldPlay={true} // Start playing automatically
      isLooping={true} // Loop the video
      isMuted={true} // Mute background video
      onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      useNativeControls={false} // Disable native controls (might slightly improve performance)
      shouldCorrectPitch={false} // Disable pitch correction (might slightly improve performance)
    />
  );
}

const styles = StyleSheet.create({
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
});