// Story-related types

export interface Genre {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  base_narrative: string;
  author_id: string | null; // null if system-generated
  genre_ids: string[];
  estimated_length_minutes: number;
  is_featured: boolean;
  is_multiplayer: boolean;
  created_at: string;
  updated_at: string;
  avg_rating: number;
  play_count: number;
}

export interface StorySegment {
  id: string;
  story_id: string;
  content: string;
  segment_order: number;
  parent_segment_id: string | null; // null if root segment
  created_at: string;
  created_by: string | null; // null if AI-generated
}

export interface StoryChoice {
  id: string;
  segment_id: string;
  choice_text: string;
  next_segment_id: string;
  created_at: string;
}

export interface UserStoryProgress {
  id: string;
  user_id: string;
  story_id: string;
  current_segment_id: string;
  choices_made: {
    segment_id: string;
    choice_id: string;
    timestamp: string;
  }[];
  listening_duration_seconds: number;
  completed: boolean;
  last_played_at: string;
  created_at: string;
}

export interface StoryRating {
  id: string;
  user_id: string;
  story_id: string;
  rating: number; // 1-5
  review_text: string;
  created_at: string;
  updated_at: string;
}

export interface SharedStoryWorld {
  id: string;
  name: string;
  description: string;
  base_story_id: string;
  current_state: {
    current_segment_id: string;
    active_characters: string[];
    world_variables: Record<string, any>;
  };
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface SharedStoryChoice {
  id: string;
  shared_story_id: string;
  choice_prompt: string;
  options: string[];
  voting_deadline: string;
  is_resolved: boolean;
  winning_option: string | null;
  created_at: string;
}

export interface UserSharedStoryVote {
  id: string;
  user_id: string;
  shared_story_choice_id: string;
  selected_option: string;
  created_at: string;
}

export interface CollaborativeStory {
  id: string;
  title: string;
  description: string;
  is_complete: boolean;
  max_contributors: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StoryContribution {
  id: string;
  collaborative_story_id: string;
  user_id: string;
  content: string;
  segment_order: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface StorytellerPersonality {
  id: string;
  name: string;
  description: string;
  style_parameters: {
    tone: string;
    pacing: string;
    complexity: string;
    emotionalRange: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface StoryState {
  currentStory: Story | null;
  currentSegment: StorySegment | null;
  availableChoices: StoryChoice[];
  userProgress: UserStoryProgress | null;
  isLoading: boolean;
  error: string | null;
} 