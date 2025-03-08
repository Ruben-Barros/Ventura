import { Stack } from 'expo-router';

const StorytellerLayout = () => {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: "Choose Your Storyteller"
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          headerShown: false,
          title: "Storyteller Details"
        }} 
      />
    </Stack>
  );
};

export default StorytellerLayout; 