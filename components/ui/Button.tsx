import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import theme from '../../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  uppercase?: boolean;
  labelStyle?: object;
  contentStyle?: object;
  style?: object;
  children: React.ReactNode;
}

// Define direct color values
const COLORS = {
  primary: '#4A6FE5',
  secondary: '#8EBBFF',
  white: '#FFFFFF',
  disabled: 'rgba(255, 255, 255, 0.5)'
};

// Fixed spacing values
const SPACING = {
  xs: 6,
  sm: 12,
  md: 20,
  lg: 32,
  xl: 48,
};

// Typography sizes
const TYPOGRAPHY = {
  xs: 12,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
};

// Border radius
const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  pill: 999,
};

const getButtonColor = (variant) => {
  switch (variant) {
    case 'primary':
      return COLORS.primary;
    case 'secondary':
      return COLORS.secondary;
    case 'outline':
      return 'transparent';
    default:
      return COLORS.primary;
  }
};

const getButtonMode = (variant) => {
  switch (variant) {
    case 'primary':
      return 'contained';
    case 'secondary':
      return 'contained';
    case 'outline':
      return 'outlined';
    case 'text':
      return 'text';
    default:
      return 'contained';
  }
};

const getButtonSize = (size) => {
  switch (size) {
    case 'small':
      return {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.md,
        fontSize: TYPOGRAPHY.sm,
        height: 36,
      };
    case 'medium':
      return {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        fontSize: TYPOGRAPHY.md,
        height: 48,
      };
    case 'large':
      return {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.xl,
        fontSize: TYPOGRAPHY.md,
        height: 56,
      };
    default:
      return {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        fontSize: TYPOGRAPHY.md,
        height: 48,
      };
  }
};

const Button: React.FC<ButtonProps> = ({
  mode = 'contained',
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  uppercase = false,
  labelStyle,
  contentStyle,
  style,
  children,
}) => {
  const buttonSize = getButtonSize(size);
  const buttonColor = getButtonColor(variant);
  const buttonMode = getButtonMode(variant);

  // For outline variant, use white for text color
  const textColor = variant === 'outline' || variant === 'text' ? COLORS.white : undefined;

  return (
    <PaperButton
      mode={buttonMode}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      uppercase={uppercase}
      color={buttonColor}
      labelStyle={[
        styles.label,
        { 
          fontSize: buttonSize.fontSize,
          color: textColor 
        },
        labelStyle,
      ]}
      contentStyle={[
        {
          height: buttonSize.height,
          paddingVertical: buttonSize.paddingVertical,
          paddingHorizontal: buttonSize.paddingHorizontal,
        },
        contentStyle,
      ]}
      style={[
        styles.button,
        variant === 'outline' && styles.outlineButton,
        style,
      ]}
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  outlineButton: {
    borderColor: COLORS.white,
    borderWidth: 1.5,
  },
  label: {
    letterSpacing: 0.4,
    fontWeight: '500',
  },
});

export default Button; 