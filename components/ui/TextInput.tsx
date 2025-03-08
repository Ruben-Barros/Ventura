import React, { useState } from 'react';
import { View, TextInput as RNTextInput, StyleSheet, TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Typography from './Typography';
import theme from '../../constants/theme';

interface CustomTextInputProps extends TextInputProps {
  label: string;
  icon?: string;
  error?: string;
}

export default function TextInput({ 
  label, 
  icon, 
  error, 
  value, 
  onChangeText, 
  secureTextEntry,
  ...props 
}: CustomTextInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.inputContainer,
          isFocused && styles.focusedContainer,
          error && styles.errorContainer,
        ]}
      >
        {icon && (
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={
              error 
                ? theme.colors.accent.primary 
                : isFocused 
                ? theme.colors.text.primary 
                : theme.colors.text.secondary
            }
            style={styles.icon}
          />
        )}
        <RNTextInput
          style={styles.input}
          placeholder={label}
          placeholderTextColor={theme.colors.text.secondary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          selectionColor={theme.colors.accent.primary}
          {...props}
        />
      </View>
      {error && (
        <Typography variant="caption" style={styles.errorText}>
          {error}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.layout.borderRadius.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    height: 48,
  },
  focusedContainer: {
    borderColor: theme.colors.accent.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  errorContainer: {
    borderColor: theme.colors.accent.primary,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: 16,
    paddingVertical: 8,
  },
  errorText: {
    color: theme.colors.accent.primary,
    marginTop: 4,
  },
}); 