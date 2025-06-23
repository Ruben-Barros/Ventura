// User-related types
import { VisualMode } from './narration.types';
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  created_at: string;
  last_login: string;
  streak_count: number;
  total_points: number;
  is_premium: boolean;
}

export type PreferredStoryLength = 'short' | 'medium' | 'long';
export type ExperienceMode = 'dynamic' | 'calm';

export interface NarrationStyle {
  voice: 'male' | 'female' | 'neutral';
  accent?: 'british' | 'american' | 'australian' | 'indian';
  tone?: 'dramatic' | 'soothing' | 'humorous';
}

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_genres: string[];
  preferred_story_length: PreferredStoryLength;
  preferred_narration_style: NarrationStyle;
  experience_mode: ExperienceMode;
  visual_mode: VisualMode; // Added for Narration Screen v2 visual preference
  created_at: string;
  updated_at: string;
}

export interface UserStorytellerSettings {
  id: string;
  user_id: string;
  storyteller_id: string;
  plot_twist_frequency: number; // 1-10 scale
  emotional_intensity: number; // 1-10 scale
  created_at: string;
  updated_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
}

export interface UserDailyChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress_count: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  storytellerSettings: UserStorytellerSettings | null;
  isLoading: boolean;
  error: string | null;
} 