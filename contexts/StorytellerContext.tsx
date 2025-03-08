import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type definitions
export interface Storyteller {
  id: string;
  name: string;
  image: string;
  description: string;
  style: string;
  strengths: string[];
  difficultyLevel: string;
}

export interface StorytellerSettings {
  plotTwistFrequency: number;
  emotionalIntensity: number;
  paceVariation: number;
  mysteryLevel: number;
}

interface StorytellerContextType {
  selectedStoryteller: Storyteller | null;
  settings: StorytellerSettings;
  storytellers: Storyteller[];
  selectStoryteller: (id: string) => void;
  updateSettings: (settings: Partial<StorytellerSettings>) => void;
  isLoading: boolean;
}

// Default values
const DEFAULT_STORYTELLERS: Storyteller[] = [
  {
    id: '1',
    name: 'Lyra Luminous',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800',
    description: 'A balanced storyteller who weaves tales with equal parts wonder and wisdom. Her narratives have a natural flow, guiding you through emotional peaks and valleys with a masterful touch.',
    style: 'Balanced',
    strengths: ['Character Development', 'Emotional Resonance', 'Elegant Pacing'],
    difficultyLevel: 'Medium'
  },
  {
    id: '2',
    name: 'Orion Odyssey',
    image: 'https://images.unsplash.com/photo-1540198163009-7afda7da2945?q=80&w=800',
    description: 'Bold and unpredictable, Orion crafts stories that surprise at every turn. Expect the unexpected as his constellation of ideas creates narratives that challenge and thrill with constant innovation.',
    style: 'Dynamic',
    strengths: ['Plot Twists', 'Unexpected Developments', 'Bold Creativity'],
    difficultyLevel: 'Hard'
  },
  {
    id: '3',
    name: 'Selene Serenity',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800',
    description: 'The gentle poet of the night sky, Selene crafts soothing narratives that flow like moonlight on water. Her stories emphasize beauty, reflection, and inner journeys with a calming touch.',
    style: 'Soothing',
    strengths: ['Atmospheric Writing', 'Emotional Depth', 'Mindful Storytelling'],
    difficultyLevel: 'Easy'
  },
  {
    id: '4',
    name: 'Perseus Phoenix',
    image: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?q=80&w=800',
    description: "A master of the hero's journey, Perseus creates tales of transformation and triumph. His narratives feature characters who face their greatest challenges and emerge reborn through courage and growth.",
    style: 'Heroic',
    strengths: ['Character Growth', 'Meaningful Challenges', 'Inspiring Moments'],
    difficultyLevel: 'Hard'
  }
];

const DEFAULT_SETTINGS: StorytellerSettings = {
  plotTwistFrequency: 5,
  emotionalIntensity: 5,
  paceVariation: 5,
  mysteryLevel: 5
};

// Create context
const StorytellerContext = createContext<StorytellerContextType | undefined>(undefined);

// Storage keys
const STORYTELLER_ID_KEY = 'ventura_selected_storyteller_id';
const STORYTELLER_SETTINGS_KEY = 'ventura_storyteller_settings';

export const StorytellerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedStoryteller, setSelectedStoryteller] = useState<Storyteller | null>(null);
  const [settings, setSettings] = useState<StorytellerSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved preferences on mount
  useEffect(() => {
    const loadSavedPreferences = async () => {
      try {
        const [savedStorytellerIdJson, savedSettingsJson] = await Promise.all([
          AsyncStorage.getItem(STORYTELLER_ID_KEY),
          AsyncStorage.getItem(STORYTELLER_SETTINGS_KEY)
        ]);
        
        // Load storyteller selection
        if (savedStorytellerIdJson) {
          const savedId = JSON.parse(savedStorytellerIdJson);
          const storyteller = DEFAULT_STORYTELLERS.find(s => s.id === savedId);
          if (storyteller) {
            setSelectedStoryteller(storyteller);
          } else {
            // Default to first storyteller if saved ID is invalid
            setSelectedStoryteller(DEFAULT_STORYTELLERS[0]);
          }
        } else {
          // Default to first storyteller if nothing saved
          setSelectedStoryteller(DEFAULT_STORYTELLERS[0]);
        }
        
        // Load settings
        if (savedSettingsJson) {
          const savedSettings = JSON.parse(savedSettingsJson);
          setSettings({
            ...DEFAULT_SETTINGS,
            ...savedSettings
          });
        }
      } catch (error) {
        console.error('Error loading storyteller preferences:', error);
        // Set defaults on error
        setSelectedStoryteller(DEFAULT_STORYTELLERS[0]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSavedPreferences();
  }, []);
  
  // Select a storyteller by ID
  const selectStoryteller = async (id: string) => {
    try {
      const storyteller = DEFAULT_STORYTELLERS.find(s => s.id === id);
      if (storyteller) {
        setSelectedStoryteller(storyteller);
        await AsyncStorage.setItem(STORYTELLER_ID_KEY, JSON.stringify(id));
      }
    } catch (error) {
      console.error('Error saving storyteller selection:', error);
    }
  };
  
  // Update storyteller settings
  const updateSettings = async (newSettings: Partial<StorytellerSettings>) => {
    try {
      const updatedSettings = {
        ...settings,
        ...newSettings
      };
      setSettings(updatedSettings);
      await AsyncStorage.setItem(STORYTELLER_SETTINGS_KEY, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving storyteller settings:', error);
    }
  };
  
  const value = {
    selectedStoryteller,
    settings,
    storytellers: DEFAULT_STORYTELLERS,
    selectStoryteller,
    updateSettings,
    isLoading
  };
  
  return (
    <StorytellerContext.Provider value={value}>
      {children}
    </StorytellerContext.Provider>
  );
};

// Custom hook to use the storyteller context
export const useStoryteller = () => {
  const context = useContext(StorytellerContext);
  if (context === undefined) {
    throw new Error('useStoryteller must be used within a StorytellerProvider');
  }
  return context;
}; 