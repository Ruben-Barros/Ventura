import { Asset } from 'expo-asset';
import { AVPlaybackStatus } from 'expo-av';
import { Story } from './story.types'; // Import Story type
// Assuming UUID can be represented as a string for simplicity here,
// or import a specific UUID library if available/needed.
type UUID = string;

// Define the different visual modes
export type VisualMode = 'static' | 'illustrated' | 'motion-comic' | 'video';

// Represents a media asset for the visual layer
export interface VisualAsset {
  uri: string;
  type: 'image' | 'video' | 'loop'; // loop might be a specific video format
  altText?: string; // For accessibility
  width?: number;
  height?: number;
}

// Represents a story segment (align with your actual story_segments structure)
export interface NarrationSegment {
  id: UUID;
  storyId: UUID;
  content: string; // Narrator script text
  audioUri: string; // URL to the audio file for this segment
  durationMs: number; // Duration of the audio segment
  prompt?: string; // Prompt used for generating visuals for this segment
  choices?: NarrationChoice[]; // Choices presented at the end of this segment
  segmentOrder: number;
  // Add any other relevant fields from story_segments table, e.g., chapter_id
}

// Represents a choice point (align with your actual story_choices structure)
export interface NarrationChoice {
  id: UUID;
  segmentId: UUID; // The segment this choice belongs to
  choiceText: string;
  nextSegmentId: UUID; // The segment to navigate to if this choice is made
  karmaEffect?: 'positive' | 'negative' | 'neutral';
  decisionTimeSeconds?: number; // Optional: Time limit for Dynamic mode
}

// State managed by NarrationContext
export interface NarrationContextState {
  storyId: UUID | null;
  currentSegment: NarrationSegment | null;
  nextSegment: NarrationSegment | null; // For pre-caching/pre-loading
  visualMode: VisualMode;
  currentVisualAsset: VisualAsset | null;
  nextVisualAsset: VisualAsset | null; // Pre-loaded asset for smooth transition
  playbackStatus: AVPlaybackStatus | null; // From expo-av
  isLoadingVisual: boolean; // Loading indicator for visual assets
  isLoadingAudio: boolean; // Loading indicator for audio assets
  isChoiceActive: boolean; // Is the choice overlay currently displayed?
  userKarma: number; // Current karma score for the story/user
  experienceMode: 'dynamic' | 'calm'; // User's preferred experience mode
  isOfflineMode: boolean; // Indicator if operating in offline mode
  isLowBandwidthMode: boolean; // Indicator if network is throttled
  isLowPowerMode: boolean; // Indicator if device battery saver is on
  playbackSpeed: number; // Current audio playback speed (e.g., 1.0, 1.5)
  isCaptionsEnabled: boolean; // Are captions currently visible?
  storyDetails: Story | null; // Basic details of the loaded story
  lastKarmaChange: number | null; // Stores the value of the last karma change to trigger flash effect
  achievementToDisplay: Achievement | null; // Holds the achievement currently being shown in a toast
  earnedAchievements: Set<string>; // Tracks IDs of achievements earned in this session/story
}

// Actions available to dispatch or call via the context
export interface NarrationContextActions {
  loadStory: (storyId: UUID, initialSegmentId?: UUID) => Promise<void>; // Start or resume a story
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (positionMillis: number) => Promise<void>;
  setPlaybackSpeed: (speed: number) => void;
  toggleCaptions: (enabled: boolean) => void;
  setVisualMode: (mode: VisualMode) => Promise<void>; // Change the visual enhancement level
  makeChoice: (choiceId: UUID) => Promise<void>; // User selects a choice
  retryLoadAsset: () => void; // Attempt to reload current visual/audio if failed
  // Internal actions (prefixed with _) - typically called by effects within the provider
  _handleSegmentEnd: () => void; // Logic when a segment finishes playing
  _updatePlaybackStatus: (status: AVPlaybackStatus) => void; // Update state based on audio status
  _setVisualAsset: (asset: VisualAsset | null, target: 'current' | 'next') => void; // Update visual asset state
  _setLoadingState: (type: 'visual' | 'audio' | 'story', isLoading: boolean) => void; // Manage loading flags
  _updateKarma: (change: number) => void; // Update karma score and trigger feedback
  _setNetworkState: (isOffline: boolean, isLowBandwidth: boolean) => void; // Update network flags
  _setPowerState: (isLowPower: boolean) => void; // Update battery saver flag
  _clearLastKarmaChange: () => void; // Action to reset the karma flash trigger
  // _dismissAchievementToast is now handled by AchievementsContext
  _toggleMicInput: () => void; // Placeholder action for mic button
}

// The combined value provided by the NarrationContext
export interface NarrationContextValue extends NarrationContextState {
  actions: NarrationContextActions;
}

// --- Achievement Related Types ---
// (Consider moving to a dedicated gamification.types.ts if it grows)

export interface Achievement {
    id: string; // Unique identifier (e.g., 'first_choice_made', 'completed_chapter_1')
    name: string; // Display name (e.g., "First Step", "Chapter Complete")
    description: string; // Description of how to earn it
    lottieAnimationSource?: any; // Source for react-native-lottie (optional visual)
    points?: number; // Points awarded (optional)
}

// Structure for displaying a toast notification for an achievement
export interface AchievementToastData {
    achievement: Achievement;
    timestamp: number; // When it was earned, for potential ordering/timing
}

// State for AchievementsContext (if you create one)
export interface AchievementsContextState {
    earnedAchievements: Record<string, Date>; // Map of achievement ID to date earned
    pendingAchievementToasts: AchievementToastData[]; // Queue of toasts to display
}

// Actions for AchievementsContext
export interface AchievementsContextActions {
    grantAchievement: (achievementId: string) => void;
    _displayNextToast: () => void; // Internal action to show the next toast from queue
    _clearToast: (achievementId: string) => void; // Remove a toast after display duration
}

export interface AchievementsContextValue extends AchievementsContextState {
    actions: AchievementsContextActions;
}