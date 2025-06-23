// Reverting to a simpler structure, ensuring colors.background is a string

const theme = {
  colors: {
    // Provide the single string background for PaperProvider compatibility
    background: '#141414',
    // Keep the nested structure for custom use elsewhere
    backgroundDetails: {
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
      muted: 'rgba(255, 255, 极255, 0.5)',
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
    },
    // Add other top-level colors needed by PaperProvider if necessary
    primary: '#E50914', // Example: Map accent primary to Paper primary
    // ... add others like surface, outline, etc. if Paper complains
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  },
  typography: {
    h1: { fontSize: 36, fontWeight: '900' as any, letterSpacing: 0.5, fontFamily: 'Helvetica' },
    h2: { fontSize: 32, fontWeight: '800' as any, letterSpacing: 0.5, fontFamily: 'Helvetica' },
    h3: { fontSize: 28, fontWeight: '700' as any, letterSpacing: 0.5, fontFamily: 'Helvetica' },
    h4: { fontSize: 24, fontWeight: '700' as any, letterSpacing: 0.5, fontFamily: 'Helvetica' },
    h5: { fontSize: 20, fontWeight: '600' as any, letterSpacing: 0.5, fontFamily: 'Helvetica' },
    h6: { fontSize: 18, fontWeight: '600' as any, letterSpacing: 0.5, fontFamily: 'Helvetica' },
    body1: { fontSize: 16, letterSpacing: 0.5, fontFamily: 'Helvetica' },
    body2: { fontSize: 14, letterSpacing: 0.25, fontFamily: 'Helvetica' },
    caption: { fontSize: 12, letterSpacing: 0.4, fontFamily: 'Helvetica' },
    button: { 
      fontSize: 16, 
      fontWeight: '700' as any, 
      letterSpacing: 1, 
      textTransform: 'uppercase' as 'uppercase', 
      fontFamily: 'Helvetica' 
    },
  },
  layout: {
    borderRadius: { small: 4, medium: 8, large: 12 },
    thumbnails: { aspectRatio: 16 / 9, borderRadius: 8 },
  },
  shadows: {
    small: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65, elevation: 8 },
    large: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.37, shadowRadius: 7.49, elevation: 12 },
  },
};

// Define a type for the theme
export type AppTheme = typeof theme;

export default theme;