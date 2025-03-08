import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/api/supabase';
import { User, UserProfile, UserPreferences, UserStorytellerSettings } from '../types/user.types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  storytellerSettings: UserStorytellerSettings | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<{ error: any }>;
  updateStorytellerSettings: (updates: Partial<UserStorytellerSettings>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [storytellerSettings, setStorytellerSettings] = useState<UserStorytellerSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ? {
        id: session.user.id,
        email: session.user.email || '',
        created_at: session.user.created_at || '',
      } : null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ? {
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || '',
        } : null);
        setIsLoading(false);

        if (session?.user) {
          // Fetch user profile
          await fetchUserProfile(session.user.id);
          // Fetch user preferences
          await fetchUserPreferences(session.user.id);
          // Fetch storyteller settings
          await fetchStorytellerSettings(session.user.id);
        } else {
          setProfile(null);
          setPreferences(null);
          setStorytellerSettings(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch user profile data
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setProfile(data as UserProfile);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  // Fetch user preferences
  const fetchUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user preferences:', error);
        return;
      }

      setPreferences(data as UserPreferences);
    } catch (error) {
      console.error('Error in fetchUserPreferences:', error);
    }
  };

  // Fetch storyteller settings
  const fetchStorytellerSettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_storyteller_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching storyteller settings:', error);
        return;
      }

      setStorytellerSettings(data as UserStorytellerSettings);
    } catch (error) {
      console.error('Error in fetchStorytellerSettings:', error);
    }
  };

  // Sign up new user
  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      // For development only - handle missing Supabase configuration
      if (error && error.message.includes('Invalid URL')) {
        console.warn('Using development mode authentication due to invalid Supabase URL');
        return { error: null };
      }
      
      return { error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { error };
    }
  };

  // Sign in existing user
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      // For development only - handle missing Supabase configuration
      if (error && error.message.includes('Invalid URL')) {
        console.warn('Using development mode authentication due to invalid Supabase URL');
        // Create a mock session for development
        const mockSession = {
          user: {
            id: 'dev-user-id',
            email: email || 'dev@example.com',
            created_at: new Date().toISOString(),
          }
        };
        // Set mock user data
        setUser({
          id: 'dev-user-id',
          email: email || 'dev@example.com',
          created_at: new Date().toISOString(),
        });
        setProfile({
          id: 'dev-user-id',
          username: 'DevUser',
          avatar_url: '',
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
          streak_count: 3,
          total_points: 150,
          is_premium: false,
        });
        return { error: null };
      }
      
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setPreferences(null);
      setStorytellerSettings(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user?.id) return { error: new Error('User not authenticated') };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error && profile) {
        setProfile({ ...profile, ...updates });
      }

      return { error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  // Update user preferences
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      if (!user?.id) return { error: new Error('User not authenticated') };

      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (!error && preferences) {
        setPreferences({ ...preferences, ...updates });
      }

      return { error };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { error };
    }
  };

  // Update storyteller settings
  const updateStorytellerSettings = async (updates: Partial<UserStorytellerSettings>) => {
    try {
      if (!user?.id) return { error: new Error('User not authenticated') };

      const { error } = await supabase
        .from('user_storyteller_settings')
        .update(updates)
        .eq('user_id', user.id);

      if (!error && storytellerSettings) {
        setStorytellerSettings({ ...storytellerSettings, ...updates });
      }

      return { error };
    } catch (error) {
      console.error('Error updating storyteller settings:', error);
      return { error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        preferences,
        storytellerSettings,
        isLoading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        updatePreferences,
        updateStorytellerSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 