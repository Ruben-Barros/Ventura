import { StoryChoice, StorySegment } from './story.types';
import { KarmaType } from '../services/game/karmaSystem';

// Types for interactive story experience

export enum StoryExperienceMode {
  CALM = 'calm',      // Slower paced, fewer choices
  DYNAMIC = 'dynamic' // Fast paced, more frequent choices
}

export enum InputMode {
  VOICE = 'voice',       // Voice input for choices
  TOUCH = 'touch',       // Touch buttons for choices
  OPEN_ENDED = 'open'    // Open-ended text/voice input (premium)
}

export enum VisualMode {
  NONE = 'none',         // Audio only, no visuals
  MINIMAL = 'minimal',   // Subtle background effects only
  ANIMATED = 'animated'  // Full animated backgrounds
}

export interface StoryVisualEffect {
  type: 'background' | 'overlay' | 'animation';
  assetUrl: string;
  timing?: {
    startTime: number;  // milliseconds into the audio
    duration: number;   // milliseconds, 0 for persistent
  };
}

export interface StoryAudioSegment {
  id: string;
  segmentId: string;    // Maps to StorySegment.id
  audioUrl: string;     // URL to the audio file or server endpoint
  visualEffects?: StoryVisualEffect[];
  duration: number;     // Duration in milliseconds
  transcript?: string;  // For accessibility
}

export interface StoryChoiceWithKarma extends StoryChoice {
  karmaImpact?: {
    type: KarmaType;
    value: number;
    description: string;
  };
}

export interface StoryPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number; // milliseconds
  duration: number;    // milliseconds
}

export interface StoryUserSettings {
  experienceMode: StoryExperienceMode;
  preferredInputMode: InputMode;
  visualMode: VisualMode;
  showTranscript: boolean;
  audioRate: number;    // Playback speed (0.5 to 2.0)
  showKarmaChanges: boolean;
}

export interface StoryAudioEffects {
  ambientSound?: string;   // Background ambient sounds
  soundEffects: {
    id: string;
    soundUrl: string;
    timing: {
      triggerTime: number; // milliseconds into the segment
    };
  }[];
}

export interface StoryPoints {
  current: number;
  history: {
    amount: number;
    reason: string;
    timestamp: number;
  }[];
}

export interface OpenEndedInput {
  text: string;         // The text of the user's open-ended input
  sentiment: number;    // -1 to 1 (negative to positive)
  keywords: string[];   // Key terms extracted from input
  intent: string;       // Classified intent (e.g. "help", "attack", "flee")
}

export interface StoryExperienceState {
  storyId: string;
  currentSegment: StorySegment | null;
  currentAudioSegment: StoryAudioSegment | null;
  availableChoices: StoryChoiceWithKarma[];
  playbackState: StoryPlaybackState;
  userSettings: StoryUserSettings;
  karmaScore: number;
  storyPoints: StoryPoints;
  choiceHistory: {
    segmentId: string;
    choiceId: string;
    timestamp: number;
  }[];
  isAtChoicePoint: boolean;
  isProcessingChoice: boolean;
  selectedChoice: string | null;
  openEndedInput: OpenEndedInput | null;
  isLoadingNextSegment: boolean;
  error: string | null;
}

// Initial default state for story experience
export const defaultStoryExperienceState: StoryExperienceState = {
  storyId: '',
  currentSegment: null,
  currentAudioSegment: null,
  availableChoices: [],
  playbackState: {
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0
  },
  userSettings: {
    experienceMode: StoryExperienceMode.DYNAMIC,
    preferredInputMode: InputMode.TOUCH,
    visualMode: VisualMode.MINIMAL,
    showTranscript: false,
    audioRate: 1.0,
    showKarmaChanges: true
  },
  karmaScore: 0,
  storyPoints: {
    current: 0,
    history: []
  },
  choiceHistory: [],
  isAtChoicePoint: false,
  isProcessingChoice: false,
  selectedChoice: null,
  openEndedInput: null,
  isLoadingNextSegment: false,
  error: null
}; 