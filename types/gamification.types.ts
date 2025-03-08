// Gamification-related types

export interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_image_url: string;
  points: number;
  requirement_type: string; // e.g., 'stories_completed', 'contributions_made'
  requirement_count: number;
  created_at: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string; // e.g., 'make_choices', 'join_shared_story'
  requirement_count: number;
  points_reward: number;
  available_date: string;
  created_at: string;
}

export type LeaderboardType = 
  | 'weekly_stories' 
  | 'monthly_stories' 
  | 'weekly_contributions' 
  | 'monthly_contributions' 
  | 'all_time_points';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  score: number;
  leaderboard_type: LeaderboardType;
  start_date: string;
  end_date: string;
  rank: number;
  created_at: string;
  // Joined fields
  username?: string;
  avatar_url?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string; // e.g., 'new_story', 'achievement', 'challenge'
  reference_id: string | null; // reference to relevant entity
  is_read: boolean;
  created_at: string;
}

export interface GamificationState {
  achievements: {
    all: Achievement[];
    earned: string[]; // IDs of earned achievements
  };
  dailyChallenges: {
    available: DailyChallenge[];
    completed: string[]; // IDs of completed challenges
    progress: Record<string, number>; // challenge_id -> progress count
  };
  leaderboards: Record<LeaderboardType, LeaderboardEntry[]>;
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
} 