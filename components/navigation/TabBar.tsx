import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Typography from '../ui/Typography';
import theme from '../../constants/theme';

const tabs = [
  {
    name: 'Home',
    path: '/',
    icon: 'home',
  },
  {
    name: 'Stories',
    path: '/stories',
    icon: 'book-open-variant',
  },
  {
    name: 'Discover',
    path: '/discover',
    icon: 'compass',
  },
  {
    name: 'Profile',
    path: '/profile',
    icon: 'account',
  },
];

export default function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const TabBarContent = () => (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tab}
            onPress={() => router.push(tab.path)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={24}
              color={isActive ? theme.colors.accent.primary : theme.colors.text.secondary}
            />
            <Typography
              variant="caption"
              style={[
                styles.label,
                isActive ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              {tab.name}
            </Typography>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return Platform.OS === 'ios' ? (
    <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
      <TabBarContent />
    </BlurView>
  ) : (
    <View style={styles.androidContainer}>
      <TabBarContent />
    </View>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  androidContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  container: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 83 : 60,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    marginTop: 4,
    fontSize: 10,
  },
  activeLabel: {
    color: theme.colors.accent.primary,
  },
  inactiveLabel: {
    color: theme.colors.text.secondary,
  },
}); 