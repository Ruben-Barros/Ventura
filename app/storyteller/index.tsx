import React from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { IconButton, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import Slider from '@react-native-community/slider';

import Typography from '../../components/ui/Typography';
import { useStoryteller } from '../../contexts/StorytellerContext';
import theme from '../../constants/theme';

const { width } = Dimensions.get('window');

// Mock storyteller personalities
const STORYTELLERS = [
  {
    id: '1',
    name: 'Cassandra Classic',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800',
    description: 'A balanced storyteller who creates a mix of calm moments and exciting challenges, perfect for a classic narrative experience.',
    style: 'Balanced',
    strengths: ['Character Development', 'Balanced Pacing', 'Meaningful Choices'],
    difficultyLevel: 'Medium'
  },
  {
    id: '2',
    name: 'Randy Random',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800',
    description: 'Unpredictable and chaotic, Randy creates wild stories with unexpected twists and turns. Nothing is certain with this storyteller.',
    style: 'Chaotic',
    strengths: ['Plot Twists', 'Unexpected Events', 'Dramatic Tension'],
    difficultyLevel: 'Hard'
  },
  {
    id: '3',
    name: 'Phoebe Chillax',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800',
    description: 'Creates gentle, peaceful narratives with minimal conflict. Perfect for a relaxing and meditative story experience.',
    style: 'Peaceful',
    strengths: ['Atmospheric Writing', 'Emotional Depth', 'Serene Pacing'],
    difficultyLevel: 'Easy'
  },
  {
    id: '4',
    name: 'Igor Invader',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=800',
    description: 'Focuses on challenges and obstacles, creating stories filled with tension and heroic moments of overcoming adversity.',
    style: 'Challenging',
    strengths: ['Conflict Resolution', 'Character Growth', 'High Stakes'],
    difficultyLevel: 'Hard'
  }
];

// Personalization options
const PERSONALIZATION_OPTIONS = [
  {
    id: 'plotTwistFrequency',
    name: 'Plot Twist Frequency',
    min: 0,
    max: 10
  },
  {
    id: 'emotionalIntensity',
    name: 'Emotional Intensity',
    min: 0,
    max: 10
  },
  {
    id: 'paceVariation',
    name: 'Pacing Variation',
    min: 0,
    max: 10
  },
  {
    id: 'mysteryLevel',
    name: 'Mystery Level',
    min: 0,
    max: 10
  }
];

// Storyteller card component
const StorytellerCard = ({ storyteller, isSelected, onSelect }) => (
  <TouchableOpacity 
    style={[styles.storytellerCard, isSelected && styles.selectedCard]} 
    onPress={() => onSelect(storyteller.id)}
    activeOpacity={0.9}
  >
    <Image source={{ uri: storyteller.image }} style={styles.storytellerImage} />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.8)']}
      style={styles.gradientOverlay}
    >
      <Typography variant="h4" style={styles.storytellerName}>{storyteller.name}</Typography>
      <View style={styles.styleTag}>
        <Typography variant="caption" style={styles.styleText}>{storyteller.style}</Typography>
      </View>
    </LinearGradient>
    {isSelected && (
      <View style={styles.selectedIndicator}>
        <Ionicons name="checkmark-circle" size={32} color="#FFFFFF" />
      </View>
    )}
  </TouchableOpacity>
);

const PersonalizationSlider = ({ option, value, onChange }) => (
  <View style={styles.sliderContainer}>
    <View style={styles.sliderLabelRow}>
      <Typography variant="body1" style={styles.sliderLabel}>{option.name}</Typography>
      <Typography variant="body1" style={styles.sliderValue}>{value}</Typography>
    </View>
    <Slider
      style={styles.slider}
      minimumValue={option.min}
      maximumValue={option.max}
      step={1}
      value={value}
      onValueChange={onChange}
      minimumTrackTintColor="#FFFFFF"
      maximumTrackTintColor="rgba(255,255,255,0.3)"
      thumbTintColor="#FFFFFF"
    />
    <View style={styles.sliderLabelsRow}>
      <Typography variant="caption" style={styles.sliderMinLabel}>Less</Typography>
      <Typography variant="caption" style={styles.sliderMaxLabel}>More</Typography>
    </View>
  </View>
);

const StorytellerInfoCard = ({ storyteller }) => (
  <Surface style={styles.infoCard}>
    <View style={styles.infoHeader}>
      <Typography variant="h4" style={styles.infoTitle}>About {storyteller.name}</Typography>
      <View style={[styles.styleTag, styles.styleTagDark]}>
        <Typography variant="caption" style={styles.styleTextDark}>{storyteller.difficultyLevel}</Typography>
      </View>
    </View>
    <Typography variant="body1" style={styles.infoDescription}>{storyteller.description}</Typography>
    
    <View style={styles.strengthsContainer}>
      <Typography variant="h5" style={styles.strengthsTitle}>Strengths</Typography>
      <View style={styles.strengthsList}>
        {storyteller.strengths.map((strength, index) => (
          <View key={index} style={styles.strengthItem}>
            <Ionicons name="star" size={16} color="#5B76CB" style={styles.strengthIcon} />
            <Typography variant="body2" style={styles.strengthText}>{strength}</Typography>
          </View>
        ))}
      </View>
    </View>
  </Surface>
);

const StorytellerScreen = () => {
  const router = useRouter();
  const { 
    storytellers, 
    selectedStoryteller, 
    settings, 
    selectStoryteller, 
    updateSettings, 
    isLoading 
  } = useStoryteller();

  const handleStorytellerSelect = (id) => {
    selectStoryteller(id);
  };

  const handleSliderChange = (optionId, value) => {
    updateSettings({ [optionId]: value });
  };

  const handleSave = () => {
    // Navigate back or to home
    router.push('/');
  };

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <LinearGradient 
        colors={['#5B76CB', '#445DA8', '#293C70']} 
        style={styles.loadingContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Typography variant="h4" style={styles.loadingText}>
          Loading storytellers...
        </Typography>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient 
      colors={['#5B76CB', '#445DA8', '#293C70']} 
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <IconButton 
          icon="arrow-left" 
          size={24} 
          iconColor="#fff" 
          onPress={handleGoBack} 
          style={styles.backButton}
          containerColor="rgba(0, 0, 0, 0.2)"
        />
        <IconButton 
          icon="information-outline" 
          size={24} 
          iconColor="#fff" 
          onPress={() => {}} 
          style={styles.infoButton}
          containerColor="rgba(0, 0, 0, 0.2)"
        />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Typography variant="h2" style={styles.title}>
            Choose Your Storyteller
          </Typography>
          <Typography variant="body1" style={styles.subtitle}>
            Your storyteller influences the mood, pacing, and events in your stories
          </Typography>
        </View>
        
        <FlatList
          horizontal
          data={storytellers}
          renderItem={({ item }) => (
            <StorytellerCard 
              storyteller={item} 
              isSelected={selectedStoryteller && item.id === selectedStoryteller.id}
              onSelect={handleStorytellerSelect}
            />
          )}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storytellerList}
        />

        {selectedStoryteller && (
          <StorytellerInfoCard storyteller={selectedStoryteller} />
        )}
        
        <View style={styles.personalizationSection}>
          <Typography variant="h3" style={styles.personalizationTitle}>
            Personalize Your Experience
          </Typography>
          <Typography variant="body2" style={styles.personalizationSubtitle}>
            Fine-tune how your storyteller crafts your narrative
          </Typography>
          
          {PERSONALIZATION_OPTIONS.map(option => (
            <PersonalizationSlider
              key={option.id}
              option={option}
              value={settings[option.id]}
              onChange={(value) => handleSliderChange(option.id, value)}
            />
          ))}
        </View>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Typography variant="h5" style={styles.saveButtonText}>
            Save Preferences
          </Typography>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.learnMoreButton}
          onPress={() => selectedStoryteller && router.push(`/storyteller/${selectedStoryteller.id}`)}
        >
          <Typography variant="body1" style={styles.learnMoreText}>
            Learn more about {selectedStoryteller?.name}
          </Typography>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF" style={styles.learnMoreIcon} />
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
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
  loadingText: {
    color: '#FFFFFF',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  backButton: {
    margin: 0,
  },
  infoButton: {
    margin: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  titleSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  title: {
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  storytellerList: {
    paddingRight: 24,
    paddingBottom: 16,
  },
  storytellerCard: {
    width: 220,
    height: 300,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#FFFFFF',
  },
  storytellerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    padding: 16,
    justifyContent: 'flex-end',
  },
  storytellerName: {
    color: '#FFFFFF',
    marginBottom: 8,
  },
  styleTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  styleText: {
    color: '#FFFFFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    color: '#293C70',
  },
  styleTagDark: {
    backgroundColor: 'rgba(91, 118, 203, 0.1)',
  },
  styleTextDark: {
    color: '#5B76CB',
  },
  infoDescription: {
    color: '#333333',
    marginBottom: 20,
    lineHeight: 24,
  },
  strengthsContainer: {
    marginTop: 10,
  },
  strengthsTitle: {
    color: '#293C70',
    marginBottom: 12,
  },
  strengthsList: {
    marginTop: 8,
  },
  strengthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  strengthIcon: {
    marginRight: 8,
  },
  strengthText: {
    color: '#333333',
  },
  personalizationSection: {
    marginVertical: 20,
  },
  personalizationTitle: {
    color: '#FFFFFF',
    marginBottom: 8,
  },
  personalizationSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 24,
  },
  sliderContainer: {
    marginBottom: 24,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    color: '#FFFFFF',
  },
  sliderValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderMinLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  sliderMaxLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 20,
  },
  saveButtonText: {
    color: '#354780',
    fontWeight: '600',
  },
  learnMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  learnMoreText: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  learnMoreIcon: {
    marginTop: 1,
  },
});

export default StorytellerScreen; 