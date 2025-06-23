import React, { Suspense, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber/native'; // Use /native import
import { Text } from '@react-three/drei/native'; // Use /native import

interface SceneVisualizationProps {
  segmentContent: string | null | undefined;
}

// Simple keyword-to-color mapping (expand this)
const keywordColors: { [key: string]: string } = {
  forest: '#228B22', // Forest Green
  night: '#191970', // Midnight Blue
  dark: '#2F4F4F', // Dark Slate Gray
  cave: '#696969', // Dim Gray
  fire: '#FF4500', // Orange Red
  water: '#1E90FF', // Dodger Blue
  sky: '#87CEEB', // Sky Blue
  day: '#ADD8E6', // Light Blue
  happy: '#FFD700', // Gold
  sad: '#708090', // Slate Gray
  danger: '#DC143C', // Crimson
};

const DefaultColor = '#CCCCCC'; // Light gray default

function SceneContent({ content }: { content: string }) {
  // Basic keyword extraction and color selection
  const backgroundColor = useMemo(() => {
    if (!content) return DefaultColor;
    const lowerContent = content.toLowerCase();
    for (const keyword in keywordColors) {
      if (lowerContent.includes(keyword)) {
        return keywordColors[keyword];
      }
    }
    return DefaultColor;
  }, [content]);

  // Simple text display for now
  const displayText = useMemo(() => {
      if (!content) return "Loading scene...";
      // Extract first sentence or first N words
      const sentences = content.match(/[^.!?]+[.!?]+/g);
      return sentences ? sentences[0] : content.substring(0, 50) + '...';
  }, [content]);

  return (
    <>
      {/* Set background color */}
      <color attach="background" args={[backgroundColor]} />

      {/* Basic lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />

      {/* Display first sentence or excerpt */}
       <Suspense fallback={null}>
         <Text
            position={[0, 0, -2]} // Position text in front of camera
            fontSize={0.2}
            color="white"
            anchorX="center"
            anchorY="middle"
            maxWidth={3} // Limit text width
            textAlign="center"
          >
            {displayText}
          </Text>
       </Suspense>

      {/* Placeholder shape - replace with more dynamic elements later */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        {/* Reverted to meshStandardMaterial */}
        <meshStandardMaterial color={backgroundColor === DefaultColor ? 'orange' : 'lightblue'} />
      </mesh>
    </>
  );
}

export const SceneVisualization: React.FC<SceneVisualizationProps> = ({ segmentContent }) => {
  return (
    <View style={styles.container}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <Suspense fallback={null}>
          <SceneContent content={segmentContent || ''} />
        </Suspense>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Take up available space
    backgroundColor: 'black', // Fallback background
  },
});

export default SceneVisualization;