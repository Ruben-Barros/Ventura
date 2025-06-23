import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { usePathname, Link } from 'expo-router';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const tabs = [
  {
    name: 'Home',
    href: '/',
    icon: 'home-outline',
    activeIcon: 'home',
  },
  {
    name: 'Storyteller',
    href: '/storyteller',
    icon: 'create-outline',
    activeIcon: 'create',
  },
  {
    name: 'Leaderboard',
    href: '/leaderboard',
    icon: 'trophy-outline',
    activeIcon: 'trophy',
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: 'person-outline',
    activeIcon: 'person',
  },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link key={tab.href} href={tab.href} asChild>
            <Pressable style={styles.tab}>
              <Ionicons
                name={isActive ? tab.activeIcon as any : tab.icon as any} // Cast to any
                size={24}
                color={isActive ? '#000' : '#666'}
              />
              <Text
                variant="labelSmall"
                style={[styles.label, isActive && styles.activeLabel]}
              >
                {tab.name}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingBottom: 20,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 4,
    color: '#666',
  },
  activeLabel: {
    color: '#000',
    fontWeight: 'bold',
  },
}); 