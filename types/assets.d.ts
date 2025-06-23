// Tell TypeScript how to handle static asset imports (like videos)

declare module '*.mp4' {
  const value: number; // In React Native, require/import often returns a number ID
  export default value;
}

declare module '*.mov' {
  const value: number;
  export default value;
}

declare module '*.webm' {
  const value: number;
  export default value;
}

// Add other video types if needed