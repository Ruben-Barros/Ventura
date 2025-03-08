import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// Get environment variables or use demo values for development
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;

// Check if we're using placeholder values and replace with valid URLs for development
if (!supabaseUrl || supabaseUrl === 'your_supabase_url' || !supabaseUrl.startsWith('http')) {
  console.warn('Using mock Supabase URL for development. Please set actual Supabase URL in .env file for production.');
  supabaseUrl = 'https://demo.supabase.com';
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
  console.warn('Using mock Supabase Anon Key for development. Please set actual Supabase Anon Key in .env file for production.');
  supabaseAnonKey = 'demo-anon-key';
}

// SecureStore implementation for Supabase
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 