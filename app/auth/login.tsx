import React, { useState } from 'react';
import { View, StyleSheet, Image, KeyboardAvoidingView, Platform, ScrollView, ImageBackground } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import Typography from '../../components/ui/Typography';
import theme from '../../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { signIn } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setError(error.message);
      } else {
        // Navigate to the home screen
        router.replace('/');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigateToRegister = () => {
    router.push('/auth/register');
  };
  
  const skipLogin = () => {
    // Bypass authentication and go directly to the home screen
    router.replace('/');
  };
  
  return (
    <ImageBackground 
      source={{ uri: 'https://source.unsplash.com/random/1080x1920/?nature,mountains,lake' }} 
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
              <View style={styles.logoContainer}>
                <Typography 
                  variant="h1" 
                  style={[styles.logoText, { textAlign: 'center' }]} // Merged styles
                >
                  Ventura
                </Typography>
                <Typography 
                  variant="body1" // Changed to valid variant
                  style={[styles.tagline, { textAlign: 'center' }]} // Merged styles
                >
                  Your adventure awaits
                </Typography>
              </View>
              
              <View style={styles.formContainer}>
                {error && (
                  <Typography
                    variant="body2"
                    // color="rgba(255, 100, 100, 0.9)" // Removed invalid prop
                    style={[styles.errorText, { textAlign: 'center', color: 'rgba(255, 100, 100, 0.9)' }]} // Merged styles, added color back
                  >
                    {error}
                  </Typography>
                )}
                
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
                  error={error && !password ? 'Password is required' : undefined}
                />
                
                <Button
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={isLoading}
                  style={styles.loginButton}
                  size="large"
                >
                  Log In
                </Button>
                
                <Button
                  variant="outline"
                  onPress={skipLogin}
                  style={styles.skipButton}
                >
                  Skip Login (Development Only)
                </Button>
                
                <View style={styles.registerContainer}>
                  <Typography variant="body2">
                    Don't have an account?
                  </Typography>
                  <Button
                    variant="text"
                    onPress={navigateToRegister}
                    style={styles.registerButton}
                  >
                    Register
                  </Button>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
      <Stack.Screen 
        options={{
          title: 'Login',
          headerShown: false,
        }}
      />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 40, 83, 0.75)',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  tagline: {
    marginTop: 8,
    opacity: 0.9,
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
  loginButton: {
    marginTop: 24,
  },
  skipButton: {
    marginTop: 12,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerButton: {
    marginLeft: 8,
  },
  errorText: {
    marginBottom: 16,
  },
}); 