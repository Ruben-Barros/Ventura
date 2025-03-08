import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { Avatar, Divider, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter, Stack } from 'expo-router';

import Typography from '../../components/ui/Typography';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';
import theme from '../../constants/theme';

const { width } = Dimensions.get('window');

// Mock reading statistics
const statistics = {
  storiesCompleted: 42,
  timeSpent: '87h 23m',
  streak: 15,
  wordsRead: '352,846',
};

// Mock favorite genres
const favoriteGenres = [
  { id: '1', name: 'Fantasy', count: 18 },
  { id: '2', name: 'Science Fiction', count: 12 },
  { id: '3', name: 'Mystery', count: 8 },
  { id: '4', name: 'Adventure', count: 4 },
];

// Mock in-progress stories
const inProgressStories = [
  {
    id: '1',
    title: 'The Lost City',
    author: 'Emma Stone',
    coverImage: 'https://images.unsplash.com/photo-1518116629808-4955d211e4a9?q=80&w=400',
    progress: 45,
  },
  {
    id: '2',
    title: 'Beyond the Stars',
    author: 'James Wilson',
    coverImage: 'https://images.unsplash.com/photo-1512101176959-c557f3516787?q=80&w=400',
    progress: 78,
  },
  {
    id: '3',
    title: 'Mystery of the Ancient Temple',
    author: 'Olivia Chen',
    coverImage: 'https://images.unsplash.com/photo-1502726299822-6f583f972e02?q=80&w=400',
    progress: 23,
  },
];

// Achievement component based on Calm's design
const StreakBadge = ({ value, label }) => (
  <View style={styles.badgeContainer}>
    <View style={styles.badgeCircle}>
      <Typography variant="h1" style={styles.badgeNumber}>{value}</Typography>
    </View>
    <View style={styles.badgeRibbon}>
      <Typography variant="h5" style={styles.badgeLabel}>{label}</Typography>
    </View>
  </View>
);

export default function ProfileScreen() {
  const { signOut, user } = useAuth();
  const router = useRouter();

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleSignOut = () => {
    signOut();
    router.replace('/auth/login');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <ScrollView style={styles.scrollView}>
        <Typography variant="h4" style={styles.title}>
          Profile
        </Typography>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    color: theme.colors.text.primary,
    marginBottom: 24,
  },
}); 