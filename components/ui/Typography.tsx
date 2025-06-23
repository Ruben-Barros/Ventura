import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import theme from '../../constants/theme';

interface TypographyProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'button';
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

export default function Typography({ variant = 'body1', style, children }: TypographyProps) {
  return (
    <Text style={[styles[variant], style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: theme.typography.h1,
  h2: theme.typography.h2,
  h3: theme.typography.h3,
  h4: theme.typography.h4,
  h5: theme.typography.h5,
  h6: theme.typography.h6,
  body1: theme.typography.body1,
  body2: theme.typography.body2,
  caption: theme.typography.caption,
  button: theme.typography.button,
});