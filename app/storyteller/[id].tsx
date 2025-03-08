import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  ImageBackground, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Divider, IconButton, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Video } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';

import Typography from '../../components/ui/Typography';
import { useStoryteller } from '../../contexts/StorytellerContext';
import theme from '../../constants/theme';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

// Mock data for storytelling tips
const STORYTELLER_TIPS = {
  '1': [
    {
      id: 't1',
      title: 'Finding Balance in Narrative',
      content: 'The best stories balance light and shadow. Like stars in the night sky, let your characters shine against the darkness of challenges.',
      duration: '2 min',
      image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=800',
    },
    {
      id: 't2',
      title: 'Character Constellation',
      content: 'Create a constellation of interconnected characters. Each one should shine with their own light while forming patterns with others.',
      duration: '3 min',
      image: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=800',
    },
    {
      id: 't3',
      title: 'The Arc of Emotion',
      content: 'Let your story flow through emotional phases, like the path of stars across the night sky—predictable yet beautiful in their journey.',
      duration: '4 min',
      image: 'https://images.unsplash.com/photo-1505506874110-6a7a69069a08?q=80&w=800',
    }
  ],
  '2': [
    {
      id: 't4',
      title: 'The Art of Surprise',
      content: 'Just as Orion appears suddenly above the horizon, let plot twists emerge when readers least expect them, changing the entire landscape of your story.',
      duration: '2 min',
      image: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=800',
    },
    {
      id: 't5',
      title: 'Navigating by Stars',
      content: 'Ancient sailors used stars to navigate unknown waters. Give your readers just enough familiar points to navigate your unpredictable narrative.',
      duration: '3 min',
      image: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?q=80&w=800',
    },
    {
      id: 't6',
      title: 'Dynamic Pacing',
      content: 'Vary your storytelling rhythm like a meteor shower—moments of brilliant intensity followed by contemplative silence.',
      duration: '3 min',
      image: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?q=80&w=800',
    }
  ],
  '3': [
    {
      id: 't7',
      title: 'The Lunar Approach',
      content: 'Like the phases of the moon, reveal your narrative gradually, allowing readers to reflect on each new illumination.',
      duration: '2 min',
      image: 'https://images.unsplash.com/photo-1532978379173-523e16f371f4?q=80&w=800',
    },
    {
      id: 't8',
      title: 'Creating Calm Waters',
      content: 'Use gentle language and measured pacing to create a storytelling experience that soothes like starlight on still water.',
      duration: '4 min',
      image: 'https://images.unsplash.com/photo-1507502707541-f369a3b18502?q=80&w=800',
    },
    {
      id: 't9',
      title: 'Mindful Description',
      content: 'Choose each descriptive word as carefully as stars choose their place in the cosmos—with intention and lasting beauty.',
      duration: '3 min',
      image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=800',
    }
  ],
  '4': [
    {
      id: 't10',
      title: "The Hero's Constellation",
      content: "Every hero's journey traces a pattern across the sky of your story—mark each milestone like a bright star in their personal constellation.",
      duration: '3 min',
      image: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=800',
    },
    {
      id: 't11',
      title: 'Phoenix Moments',
      content: 'Create transformative scenes where characters are reborn from the ashes of their challenges, blazing with new purpose.',
      duration: '4 min',
      image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800',
    },
    {
      id: 't12',
      title: 'Inspiring Through Adversity',
      content: 'Like Perseus facing Medusa, position your characters to face their fears directly—transforming obstacles into stepping stones.',
      duration: '2 min',
      image: 'https://images.unsplash.com/photo-1536697246787-1f7ae568d89a?q=80&w=800',
    }
  ]
};

// Long descriptions for each storyteller
const STORYTELLER_LONG_DESCRIPTIONS = {
  '1': "Lyra Luminous embodies the harmonious balance of the constellation from which she takes her name. Like the celestial Lyra that has inspired poets and musicians for millennia, she crafts narratives that resonate with perfect harmony between tension and release, joy and sorrow. Her storytelling style flows naturally, guiding listeners through emotional landscapes with a masterful touch that never feels forced or artificial.\n\nLyra's greatest strength lies in her ability to develop characters that feel authentic and relatable. Under her guidance, even the most fantastical worlds become grounded through the genuine humanity of their inhabitants. She pays special attention to emotional resonance, ensuring that each story beat connects with listeners on a deeper level.\n\nChoose Lyra when you seek a balanced narrative experience that will leave you thoughtful and fulfilled, like gazing at a perfect arrangement of stars in the night sky.",
  
  '2': "Orion Odyssey stands bold and unmistakable in the storyteller cosmos, much like his namesake constellation that dominates the winter sky. Just as Orion the hunter follows no predetermined path, this storyteller crafts narratives that defy expectations and conventional structures. His stories are cosmic adventures where anything can happen, keeping listeners constantly engaged through unpredictable twists and innovative directions.\n\nOrion's specialty lies in creating moments that surprise and challenge. He weaves plot threads that seem disconnected until they suddenly converge in brilliant, unexpected ways. His narratives feature bold creativity that pushes boundaries, introducing concepts and characters that might seem jarring at first but ultimately create unforgettable experiences.\n\nChoose Orion when you're ready for an exhilarating narrative journey that will keep you guessing until the very end, like trying to predict the path of a shooting star across the night sky.",
  
  '3': "Selene Serenity, named for the ancient moon goddess, illuminates storytelling with a gentle, reflective light. Like moonbeams on still water, her narratives flow with a tranquil rhythm that soothes the listener's mind and spirit. Her stories create a meditative experience, focusing on inner journeys and the quiet beauty found in everyday moments.\n\nSelene excels in atmospheric storytelling, crafting immersive settings with rich sensory details that transport listeners completely. Her character development delves into emotional depth rather than external conflict, exploring how people grow through reflection and subtle realizations. Her mindful approach to pacing allows space for contemplation between key moments.\n\nChoose Selene when you seek a calming experience that will leave you feeling centered and refreshed, like a peaceful night spent stargazing under a perfect crescent moon.",
  
  '4': "Perseus Phoenix takes his inspiration from the hero constellation that blazes across the northern sky. Like his celestial counterpart who defeated monsters and saved Andromeda, this storyteller specializes in narratives of courage, transformation, and ultimate triumph. His stories follow characters who face seemingly impossible challenges and emerge reborn through their own determination and growth.\n\nPerseus crafts narratives around meaningful challenges that test characters to their limits, revealing their true nature and potential. He excels at creating moments of inspiring breakthrough, where protagonists discover strength they never knew they possessed. His character arcs demonstrate significant growth, showing how adversity can forge stronger, wiser individuals.\n\nChoose Perseus when you want a storytelling experience that will challenge, inspire, and ultimately uplift you, like witnessing a phoenix rising from its ashes to soar among the stars."
};

// TipCard component
const TipCard = ({ tip, onPress }) => (
  <TouchableOpacity 
    style={styles.tipCard}
    onPress={() => onPress(tip.id)}
  >
    <Image 
      source={{ uri: tip.image }}
      style={styles.tipImage}
    />
    <View style={styles.tipContent}>
      <Typography variant="h6" style={styles.tipTitle}>
        {tip.title}
      </Typography>
      <Typography variant="caption">
        {tip.duration}
      </Typography>
    </View>
  </TouchableOpacity>
);

const StorytellerDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { storytellers, selectedStoryteller, selectStoryteller, isLoading } = useStoryteller();
  
  const [storyteller, setStoryteller] = useState(null);
  
  useEffect(() => {
    if (storytellers.length > 0 && id) {
      const found = storytellers.find(s => s.id === id);
      if (found) {
        setStoryteller(found);
      }
    }
  }, [storytellers, id]);
  
  const handleGoBack = () => {
    router.back();
  };
  
  const handleTipPress = (tipId) => {
    // In a real app, this would navigate to a detailed tip screen
    console.log('Tip pressed:', tipId);
  };
  
  const handleSelectStoryteller = () => {
    if (storyteller) {
      selectStoryteller(storyteller.id);
      router.back();
    }
  };
  
  if (isLoading || !storyteller) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A6FE5" />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={{ uri: storyteller.image }}
          style={styles.header}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <IconButton
                icon="arrow-left"
                iconColor="#FFFFFF"
                size={24}
                onPress={handleGoBack}
                style={styles.backButton}
              />
              
              {selectedStoryteller?.id === storyteller.id && (
                <View style={styles.selectedBadge}>
                  <Typography variant="caption" style={styles.selectedText}>
                    Selected
                  </Typography>
                </View>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
        
        <View style={styles.content}>
          <Typography variant="h3" style={styles.name}>
            {storyteller.name}
          </Typography>
          
          <Typography variant="subtitle1" style={styles.style}>
            {storyteller.style} Storyteller
          </Typography>
          
          <View style={styles.section}>
            <Typography variant="body1" style={styles.description}>
              {STORYTELLER_LONG_DESCRIPTIONS[storyteller.id]}
            </Typography>
          </View>
          
          <View style={styles.section}>
            <Typography variant="h5" style={styles.sectionTitle}>
              Storytelling Strengths
            </Typography>
            
            <View style={styles.strengthsList}>
              {storyteller.strengths.map((strength, index) => (
                <View key={index} style={styles.strengthItem}>
                  <View style={styles.strengthDot} />
                  <Typography variant="body1" style={styles.strength}>
                    {strength}
                  </Typography>
                </View>
              ))}
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.section}>
            <Typography variant="h5" style={styles.sectionTitle}>
              Introduction Video
            </Typography>
            
            <View style={styles.videoContainer}>
              <View style={styles.videoPlaceholder}>
                <IconButton
                  icon="play-circle-outline"
                  iconColor="#FFFFFF"
                  size={64}
                />
                <Typography variant="caption" style={styles.videoText}>
                  Watch introduction
                </Typography>
              </View>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.section}>
            <Typography variant="h5" style={styles.sectionTitle}>
              Storytelling Tips
            </Typography>
            
            <View style={styles.tipsList}>
              {STORYTELLER_TIPS[storyteller.id]?.map((tip) => (
                <TipCard 
                  key={tip.id}
                  tip={tip}
                  onPress={handleTipPress}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              onPress={handleSelectStoryteller}
              size="large"
              style={styles.selectButton}
            >
              {selectedStoryteller?.id === storyteller.id 
                ? 'Already Selected' 
                : 'Select This Storyteller'}
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 300,
    width: '100%',
  },
  headerGradient: {
    height: 150,
    justifyContent: 'flex-start',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  selectedBadge: {
    backgroundColor: '#4A6FE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    marginTop: -50,
    backgroundColor: 'rgba(27, 40, 83, 0.97)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: 800,
  },
  name: {
    marginBottom: 8,
  },
  style: {
    opacity: 0.9,
    marginBottom: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  description: {
    lineHeight: 24,
    opacity: 0.9,
  },
  strengthsList: {
    marginTop: 8,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  strengthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4A6FE5',
    marginRight: 12,
  },
  strength: {
    opacity: 0.9,
  },
  divider: {
    marginVertical: 16,
    opacity: 0.2,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    marginTop: 8,
    color: '#FFFFFF',
  },
  tipsList: {
    marginTop: 8,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tipImage: {
    width: 80,
    height: 80,
  },
  tipContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  selectButton: {
    borderRadius: 12,
  },
});

export default StorytellerDetailScreen; 