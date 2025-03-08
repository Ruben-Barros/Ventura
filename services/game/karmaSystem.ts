import AsyncStorage from '@react-native-async-storage/async-storage';

// Karma system to track moral alignment throughout stories
export enum KarmaType {
  GOOD = 'good',
  NEUTRAL = 'neutral',
  EVIL = 'evil',
}

interface KarmaAction {
  type: KarmaType;
  value: number;
  description: string;
  timestamp: number;
}

interface KarmaState {
  score: number; // -100 (evil) to 100 (good), 0 is neutral
  history: KarmaAction[];
  alignment: KarmaType;
}

// Thresholds for determining alignment
const KARMA_THRESHOLDS = {
  GOOD: 30, // Score >= 30 is considered GOOD
  EVIL: -30, // Score <= -30 is considered EVIL
  // Between -30 and 30 is NEUTRAL
};

// Singleton service for managing karma
class KarmaSystem {
  private static KARMA_STORAGE_KEY = 'ventura_karma_state';
  private state: KarmaState = {
    score: 0,
    history: [],
    alignment: KarmaType.NEUTRAL,
  };
  private isInitialized: boolean = false;

  // Initialize karma system and load saved state
  async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      const savedState = await AsyncStorage.getItem(KarmaSystem.KARMA_STORAGE_KEY);
      if (savedState) {
        this.state = JSON.parse(savedState);
      }
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing karma system:', error);
      // Continue with default state if loading fails
      this.isInitialized = true;
    }
  }

  // Add a karma action and update the score
  async addKarmaAction(action: Omit<KarmaAction, 'timestamp'>): Promise<KarmaState> {
    await this.ensureInitialized();
    
    const fullAction: KarmaAction = {
      ...action,
      timestamp: Date.now(),
    };
    
    let scoreChange = action.value;
    
    // Apply score change based on action type
    if (action.type === KarmaType.GOOD) {
      // Good actions increase karma
      scoreChange = Math.abs(action.value);
    } else if (action.type === KarmaType.EVIL) {
      // Evil actions decrease karma
      scoreChange = -Math.abs(action.value);
    } else {
      // Neutral actions may slightly move karma toward neutral
      scoreChange = action.value;
    }
    
    // Update state
    this.state.score = Math.max(-100, Math.min(100, this.state.score + scoreChange));
    this.state.history.push(fullAction);
    this.updateAlignment();
    
    // Save state
    await this.saveState();
    return { ...this.state };
  }

  // Get current karma state
  async getKarmaState(): Promise<KarmaState> {
    await this.ensureInitialized();
    return { ...this.state };
  }

  // Get current karma alignment (good, neutral, evil)
  async getAlignment(): Promise<KarmaType> {
    await this.ensureInitialized();
    return this.state.alignment;
  }
  
  // Get karma history
  async getKarmaHistory(): Promise<KarmaAction[]> {
    await this.ensureInitialized();
    return [...this.state.history];
  }
  
  // Reset karma to default state
  async resetKarma(): Promise<void> {
    this.state = {
      score: 0,
      history: [],
      alignment: KarmaType.NEUTRAL,
    };
    await this.saveState();
  }

  // Update story-specific karma
  async updateStoryKarma(storyId: string, karmaChange: number, description: string): Promise<void> {
    const karmaType = karmaChange > 0 
      ? KarmaType.GOOD 
      : karmaChange < 0 
        ? KarmaType.EVIL 
        : KarmaType.NEUTRAL;
    
    await this.addKarmaAction({
      type: karmaType,
      value: Math.abs(karmaChange),
      description: `[Story ${storyId}] ${description}`,
    });
  }

  // Private methods
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }
  }

  private updateAlignment(): void {
    if (this.state.score >= KARMA_THRESHOLDS.GOOD) {
      this.state.alignment = KarmaType.GOOD;
    } else if (this.state.score <= KARMA_THRESHOLDS.EVIL) {
      this.state.alignment = KarmaType.EVIL;
    } else {
      this.state.alignment = KarmaType.NEUTRAL;
    }
  }

  private async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        KarmaSystem.KARMA_STORAGE_KEY,
        JSON.stringify(this.state)
      );
    } catch (error) {
      console.error('Error saving karma state:', error);
    }
  }
}

// Create singleton instance
export const karmaSystem = new KarmaSystem();
export default karmaSystem; 