// App-wide configuration

export const APP_CONFIG = {
  // General app settings
  APP_NAME: 'Ventura',
  APP_VERSION: '1.0.0',
  
  // Feature flags
  FEATURES: {
    VOICE_COMMANDS: true,
    MULTIPLAYER: true,
    ACHIEVEMENTS: true,
    PREMIUM_CONTENT: true,
  },
  
  // Limits and constraints
  LIMITS: {
    MAX_STORY_CHOICES: 5, // Maximum number of choices to display at once
    MAX_STORY_LENGTH_MINUTES: 45, // Maximum story duration in minutes
    MAX_STORY_CONTRIBUTORS: 10, // Maximum contributors for collaborative stories
    MAX_SHARED_WORLD_PARTICIPANTS: 100, // Maximum participants in a shared world
    MAX_DAILY_CHALLENGES: 3, // Maximum daily challenges per day
  },
  
  // Timing settings
  TIMING: {
    STORY_REFRESH_INTERVAL: 60 * 60 * 1000, // Refresh story list every hour
    SHARED_STORY_UPDATE_INTERVAL: 5 * 60 * 1000, // Check for shared story updates every 5 minutes
    LEADERBOARD_REFRESH_INTERVAL: 5 * 60 * 1000, // Refresh leaderboards every 5 minutes
    SESSION_TIMEOUT: 30 * 24 * 60 * 60 * 1000, // Session timeout after 30 days
  },
  
  // Cache settings
  CACHE: {
    STORY_CACHE_TTL: 24 * 60 * 60 * 1000, // Cache stories for 24 hours
    USER_PREFERENCES_CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // Cache user preferences for 7 days
  },
  
  // API endpoints and URLs
  ENDPOINTS: {
    DEEPSEEK_API: 'https://api.deepseek.com/v1',
  },
  
  // Default settings
  DEFAULTS: {
    DEFAULT_STORY_LENGTH: 'medium', // Default story length ('short', 'medium', 'long')
    DEFAULT_EXPERIENCE_MODE: 'dynamic', // Default experience mode ('dynamic', 'calm')
    DEFAULT_STORYTELLER_PERSONALITY: 'balanced', // Default AI storyteller personality
    DEFAULT_PLOT_TWIST_FREQUENCY: 5, // Default plot twist frequency (1-10)
    DEFAULT_EMOTIONAL_INTENSITY: 5, // Default emotional intensity (1-10)
  },
  
  // Supported languages (ISO codes)
  SUPPORTED_LANGUAGES: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
  
  // Analytics events
  ANALYTICS_EVENTS: {
    USER_REGISTERED: 'user_registered',
    USER_LOGGED_IN: 'user_logged_in',
    STORY_STARTED: 'story_started',
    STORY_COMPLETED: 'story_completed',
    CHOICE_MADE: 'choice_made',
    SHARED_STORY_JOINED: 'shared_story_joined',
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  },
};

export default APP_CONFIG; 