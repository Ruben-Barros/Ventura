import { MD3DarkTheme } from 'react-native-paper';

const theme = {
  colors: {
    background: {
      primary: '#141414',
      secondary: '#1F1F1F',
      gradient: {
        start: '#0D1B3E', // deep midnight blue
        end: '#8B0000',   // deep crimson
      }
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      muted: 'rgba(255, 255, 255, 0.5)',
      level3: 'rgba(255, 255, 255, 0.3)',
    },
    accent: {
      primary: '#E50914',    // Netflix red
      secondary: '#FFD700',  // Gold for achievements
      tertiary: '#00C896',   // Success green
    },
    overlay: {
      dark: 'rgba(0, 0, 0, 0.7)',
      medium: 'rgba(0, 0, 0, 0.5)',
      light: 'rgba(0, 0, 0, 0.3)',
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    h2: {
      fontSize: 28,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    h3: {
      fontSize: 24,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    h4: {
      fontSize: 20,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    body1: {
      fontSize: 16,
      letterSpacing: 0.5,
    },
    body2: {
      fontSize: 14,
      letterSpacing: 0.25,
    },
    caption: {
      fontSize: 12,
      letterSpacing: 0.4,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
  },
  layout: {
    borderRadius: {
      small: 4,
      medium: 8,
      large: 12,
    },
    thumbnails: {
      aspectRatio: 16 / 9,
      borderRadius: 8,
    },
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.37,
      shadowRadius: 7.49,
      elevation: 12,
    },
  },
};

export default theme; 