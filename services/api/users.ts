// Placeholder for user-related API calls
import { UserPreferences } from '../../types/user.types';
import { VisualMode } from '../../types/narration.types';
// import { supabase } from '../../lib/supabase'; // Keep commented out

type UUID = string;

export const getUserPreferences = async (userId: UUID): Promise<Partial<UserPreferences> | null> => {
  console.log(`Placeholder: Fetching preferences for user ${userId}`);
  // Simulate fetching data
  await new Promise(resolve => setTimeout(resolve, 30));
  // Return default-like preferences for testing
  return {
    // id: 'pref-dummy-' + userId, // id might not be needed if only returning partial
    user_id: userId,
    // preferred_genres: ['fantasy', 'sci-fi'],
    // preferred_story_length: 'medium',
    // preferred_narration_style: { voice: 'neutral', accent: 'american', tone: 'neutral' },
    experience_mode: 'calm', // Default preference
    visual_mode: 'static', // Default preference
    // created_at: new Date().toISOString(),
    // updated_at: new Date().toISOString(),
  };

  /* --- Original Supabase Logic ---
  try {
      const { data, error } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

      if (error) {
          if (error.code !== 'PGRST116') { // PGRST116: Row not found
              throw error;
          }
          return null; // No preferences found is not necessarily an error
      }
      return data as UserPreferences;
  } catch (error: any) {
      console.error("Error fetching user preferences:", error.message);
      return null;
  }
  */
};

export const updateUserPreference = async (userId: UUID, updates: Partial<Pick<UserPreferences, 'visual_mode' | 'experience_mode' /* add other updatable prefs */>>) => {
  console.log(`Placeholder: Updating preferences for user ${userId}:`, updates);
  // Simulate updating data
  await new Promise(resolve => setTimeout(resolve, 40));
  console.log(`[Placeholder] Preferences for ${userId} updated locally with:`, updates);
  return true; // Assume success for placeholder

  /* --- Original Supabase Logic ---
  try {
      const { error } = await supabase
          .from('user_preferences')
          .update(updates)
          .eq('user_id', userId);

      if (error) throw error;
      return true;
  } catch (error: any) {
      console.error("Error updating user preference:", error.message);
      return false;
  }
  */
};

// Add other user-related API functions as needed (e.g., getUserProfile, updateProfile)