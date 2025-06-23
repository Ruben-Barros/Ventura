import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/api/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import Typography from '../../components/ui/Typography';
import theme from '../../constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signUp } = useAuth();
  const router = useRouter();
  
  const validateForm = () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('All fields are required');
      return false;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // First, sign up with email and password
      const { error: signUpError } = await signUp(email, password);
      
      if (signUpError) {
        setError(signUpError.message);
        setIsLoading(false);
        return;
      }
      
      // Get the user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Create a profile with username
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              username,
              avatar_url: null,
              streak_count: 0,
              total_points: 0,
              is_premium: false,
            },
          ]);
        
        if (profileError) {
          setError(profileError.message);
          setIsLoading(false);
          return;
        }
        
        // Create default user preferences
        const { error: preferencesError } = await supabase
          .from('user_preferences')
          .insert([
            {
              user_id: user.id,
              preferred_genres: [],
              preferred_story_length: 'medium',
              preferred_narration_style: {
                voice: 'neutral',
                accent: 'american',
                tone: 'dramatic',
              },
              experience_mode: 'dynamic',
            },
          ]);
        
        if (preferencesError) {
          setError(preferencesError.message);
          setIsLoading(false);
          return;
        }
        
        // Navigate to onboarding or home screen
        router.replace('/');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigateToLogin = () => {
    router.push('/auth/login');
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Register',
          headerShown: false,
        }}
      />
      <ImageBackground 
        source={{ uri: 'https://source.unsplash.com/random/1080x1920/?nature,forest,mountains' }} 
        style={styles.backgroundImage}
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
              style={styles.container}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.headerContainer}>
                  <Typography variant="h3" style={[styles.title, { textAlign: 'center' }]}>
                    Join Ventura
                  </Typography>
                  
                  <Typography variant="body1" style={[styles.subtitle, { textAlign: 'center' }]}>
                    Create an account to start your storytelling adventure
                  </Typography>
                </View>
                
                <View style={styles.formContainer}>
                  {error && (
                    <Typography
                      variant="body2"
                      style={[styles.errorText, { textAlign: 'center', color: 'rgba(255, 100, 100, 0.9)' }]}
                    >
                      {error}
                    </Typography>
                  )}
                  
                  <TextInput
                    label="Username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    icon="account"
                    style={styles.input}
                    error={error && !username ? 'Username is required' : undefined}
                  />
                  
                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    icon="email"
                    style={styles.input}
                    error={error && !email ? 'Email is required' : undefined}
                  />
                  
                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    icon="lock"
                    style={styles.input}
                    error={
                      error && !password 
                        ? 'Password is required' 
                        : error && password.length < 8 
                        ? 'Password must be at least 8 characters long' 
                        : undefined
                    }
                  />
                  
                  <TextInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    icon="lock-check"
                    style={styles.input}
                    error={
                      error && !confirmPassword 
                        ? 'Please confirm your password' 
                        : error && password !== confirmPassword 
                        ? 'Passwords do not match' 
                        : undefined
                    }
                  />
                  
                  <Button
                    onPress={handleRegister}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.registerButton}
                    size="large"
                  >
                    Create Account
                  </Button>
                  
                  <View style={styles.loginContainer}>
                    <Typography variant="body2" style={styles.loginText}>
                      Already have an account?
                    </Typography>
                    <Button
                      variant="text"
                      onPress={navigateToLogin}
                      style={styles.loginButton}
                    >
                      Log In
                    </Button>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background, // Assuming theme.colors.background is the correct path
    padding: theme.spacing.md,
  },
  title: {
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 40, 83, 0.8)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 24,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(27, 40, 83, 0.7)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    marginBottom: 16,
  },
  registerButton: {
    marginTop: 24,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loginButton: {
    marginLeft: 8,
  },
  errorText: {
    marginBottom: 16,
  },
}); 