import React, { createContext, useContext, useState, useEffect, useCallback, useReducer, Dispatch } from 'react';
import { 
  StoryExperienceState, 
  defaultStoryExperienceState,
  InputMode,
  OpenEndedInput,
  StoryChoiceWithKarma
} from '../types/storyExperience.types';
import { storyAudioPlayer } from '../services/audio/storyAudioPlayer';
import { textToSpeech } from '../services/ai/textToSpeech';
import { speechRecognition } from '../services/audio/speechRecognition';
import { karmaSystem, KarmaType } from '../services/game/karmaSystem';
import { api } from '../services/api';
import { Audio } from 'expo-av';
import { kokoroAudio, EmotionType } from '../services/audio/KokoroAudioService';

// Define the actions that can be dispatched to the reducer
type StoryExperienceAction =
  | { type: 'INIT_STORY'; payload: { storyId: string; segment: StorySegment; audioSegment: StoryAudioSegment; choices: StoryChoice[] } }
  | { type: 'SET_SEGMENT'; payload: { segment: StorySegment; audioSegment: StoryAudioSegment } }
  | { type: 'SET_CHOICES'; payload: { choices: StoryChoice[] } }
  | { type: 'SELECT_CHOICE'; payload: { choiceId: string } }
  | { type: 'SET_PROCESSING_CHOICE'; payload: { isProcessingChoice: boolean } }
  | { type: 'SET_AT_CHOICE_POINT'; payload: { isAtChoicePoint: boolean } }
  | { type: 'SET_INPUT_MODE'; payload: { inputMode: InputMode } }
  | { type: 'UPDATE_KARMA_SCORE'; payload: { score: number } }
  | { type: 'ADD_STORY_POINTS'; payload: { points: number; reason: string } }
  | { type: 'ADD_CHOICE_TO_HISTORY'; payload: { segmentId: string; choiceId: string } }
  | { type: 'PLAYBACK_UPDATE'; payload: { isPlaying: boolean; isPaused: boolean; currentTime: number; duration: number } }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'SET_LOADING_NEXT_SEGMENT'; payload: { isLoading: boolean } }
  | { type: 'SET_OPEN_ENDED_INPUT'; payload: { input: OpenEndedInput | null } }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'LOAD_STORY'; payload: any }
  | { type: 'SET_CURRENT_SEGMENT'; payload: any }
  | { type: 'NEXT_SEGMENT' };

// StoryExperienceState type
interface StoryExperienceState {
  storyId: string | null;
  currentSegment: StorySegment | null;
  currentAudioSegment: StoryAudioSegment | null;
  availableChoices: StoryChoice[];
  selectedChoiceId: string | null;
  isProcessingChoice: boolean;
  isAtChoicePoint: boolean;
  karmaScore: number;
  storyPoints: number;
  choiceHistory: Array<{ segmentId: string; choiceId: string }>;
  inputMode: InputMode;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
  isLoading: boolean;
  openEndedInput: OpenEndedInput | null;
}

// Reducer function to handle state updates
const storyExperienceReducer = (state: StoryExperienceState, action: StoryExperienceAction): StoryExperienceState => {
  switch (action.type) {
    case 'INIT_STORY':
      return {
        ...state,
        storyId: action.payload.storyId,
        currentSegment: action.payload.segment,
        currentAudioSegment: action.payload.audioSegment,
        availableChoices: action.payload.choices,
        selectedChoiceId: null,
        isProcessingChoice: false,
        isAtChoicePoint: false,
        choiceHistory: [],
        isLoading: false,
        error: null
      };
    case 'SET_SEGMENT':
      return {
        ...state,
        currentSegment: action.payload.segment,
        currentAudioSegment: action.payload.audioSegment,
        selectedChoiceId: null,
        isAtChoicePoint: false
      };
    case 'SET_CHOICES':
      return {
        ...state,
        availableChoices: action.payload.choices,
        // Don't automatically set isAtChoicePoint here as we want to control it after narration
      };
    case 'SELECT_CHOICE':
      return {
        ...state,
        selectedChoiceId: action.payload.choiceId
      };
    case 'SET_PROCESSING_CHOICE':
      return {
        ...state,
        isProcessingChoice: action.payload.isProcessingChoice
      };
    case 'SET_AT_CHOICE_POINT':
      return {
        ...state,
        isAtChoicePoint: action.payload.isAtChoicePoint
      };
    case 'SET_INPUT_MODE':
      return {
        ...state,
        inputMode: action.payload.inputMode
      };
    case 'UPDATE_KARMA_SCORE':
      return {
        ...state,
        karmaScore: action.payload.score
      };
    case 'ADD_STORY_POINTS':
      return {
        ...state,
        storyPoints: state.storyPoints + action.payload.points
      };
    case 'ADD_CHOICE_TO_HISTORY':
      return {
        ...state,
        choiceHistory: [...state.choiceHistory, action.payload]
      };
    case 'PLAYBACK_UPDATE':
      return {
        ...state,
        isPlaying: action.payload.isPlaying,
        isPaused: action.payload.isPaused,
        currentTime: action.payload.currentTime,
        duration: action.payload.duration
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error
      };
    case 'SET_LOADING_NEXT_SEGMENT':
      return {
        ...state,
        isLoading: action.payload.isLoading
      };
    case 'SET_OPEN_ENDED_INPUT':
      return {
        ...state,
        openEndedInput: action.payload.input
      };
    case 'SET_PLAYING':
      // Ensure proper state flow for audio playback
      if (action.payload === true) {
        return {
          ...state,
          isPlaying: true,
          isPaused: false
        };
      } else {
        return {
          ...state,
          isPlaying: false
        };
      }
    case 'SET_PAUSED':
      return {
        ...state,
        isPaused: action.payload
      };
    case 'LOAD_STORY':
      return {
        ...state,
        story: action.payload
      };
    case 'SET_CURRENT_SEGMENT':
      return {
        ...state,
        currentSegment: action.payload
      };
    case 'NEXT_SEGMENT':
      return {
        ...state,
        currentSegmentIndex: state.currentSegmentIndex + 1
      };
    default:
      return state;
  }
};

// Create the context
interface StoryExperienceContextType {
  state: StoryExperienceState;
  initializeStory: (storyId: string) => Promise<void>;
  playAudio: () => Promise<void>;
  pauseAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
  rewindAudio: (seconds?: number) => Promise<void>;
  fastForwardAudio: (seconds?: number) => Promise<void>;
  seekToPosition: (milliseconds: number) => Promise<void>;
  makeChoice: (choiceId: string) => Promise<void>;
  startVoiceInput: () => Promise<void>;
  stopVoiceInput: () => Promise<void>;
  submitOpenEndedInput: (input: string) => Promise<void>;
  updateUserSettings: (settings: Partial<StoryExperienceState['userSettings']>) => void;
  resetStoryExperience: () => void;
}

const StoryExperienceContext = createContext<StoryExperienceContextType | undefined>(undefined);

// Provider component
interface StoryExperienceProviderProps {
  children: React.ReactNode;
}

export const StoryExperienceProvider: React.FC<StoryExperienceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(storyExperienceReducer, defaultStoryExperienceState);

  // Initialize services when the provider mounts
  useEffect(() => {
    const initServices = async () => {
      await storyAudioPlayer.init();
      await textToSpeech.init();
      await speechRecognition.init();
      await karmaSystem.init();
    };

    initServices();

    // Cleanup on unmount
    return () => {
      storyAudioPlayer.cleanup();
      textToSpeech.cleanup();
      speechRecognition.cleanup();
    };
  }, []);

  // Set up audio player status update listener
  useEffect(() => {
    storyAudioPlayer.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        dispatch({
          type: 'PLAYBACK_UPDATE',
          payload: {
            isPlaying: status.isPlaying,
            isPaused: !status.isPlaying && status.positionMillis > 0,
            currentTime: status.positionMillis,
            duration: status.durationMillis || 0
          }
        });
      }
    });

    storyAudioPlayer.setOnPlaybackFinished(() => {
      console.log('Audio playback finished - checking if we need to start narration or show choices');
      
      // Small delay to create a natural transition from music to narration
      setTimeout(async () => {
        // First check if we have a current segment with content to narrate
        if (state.currentSegment && state.currentSegment.content) {
          console.log('Starting TTS narration after intro music completed');
          
          try {
            // Use TTS to narrate the story content
            await speakSegmentContent(
              dispatch, 
              () => ({ 
                ...state, 
                playbackState: { 
                  ...state.playbackState, 
                  isPlaying: true 
                } 
              })
            )(state.currentSegment.content);
            
            console.log('speakSegmentContent completed successfully');
            
            // After narration completes, check if we should show choices
            if (state.availableChoices && state.availableChoices.length > 0) {
              console.log('Showing choices after narration');
              dispatch({ type: 'SET_AT_CHOICE_POINT', payload: { isAtChoicePoint: true } });
            }
          } catch (error) {
            console.error('Error starting narration after intro music:', error);
            dispatch({ 
              type: 'SET_ERROR', 
              payload: { 
                error: 'Failed to start narration: ' + (error instanceof Error ? error.message : String(error)) 
              } 
            });
          }
        } 
        // If no content to narrate, check if we should show choices
        else if (!state.isAtChoicePoint && state.availableChoices.length > 0) {
          console.log('No content to narrate, showing choices directly');
          dispatch({ type: 'SET_AT_CHOICE_POINT', payload: { isAtChoicePoint: true } });
        }
      }, 800); // Delay for better audio transition
    });

    return () => {
      // Reset the callbacks when unmounting
      storyAudioPlayer.setOnPlaybackStatusUpdate(null);
      storyAudioPlayer.setOnPlaybackFinished(null);
    };
  }, [state.isAtChoicePoint, state.availableChoices, state.userSettings.preferredInputMode, state.currentSegment]);

  // Initialize a story experience
  const initializeStory = async (storyId: string) => {
    try {
      console.log('Initializing story with ID:', storyId);
      
      // Reset any previous state
      dispatch({ type: 'RESET_STATE' });
      
      // Initialize with the story ID first
      dispatch({ type: 'INIT_STORY', payload: { storyId, segment: null, audioSegment: null, choices: [] } });
      dispatch({ type: 'SET_LOADING_NEXT_SEGMENT', payload: { isLoading: true } });
      
      // Create mock data
      // In a real app, fetch the initial segment from API
      const mockInitialSegment = {
        id: 'segment_1',
        story_id: storyId,
        content: "You find yourself standing at the edge of a vast forest. The trees tower above you, their ancient branches reaching towards the sky. A narrow path winds its way through the undergrowth, disappearing into the shadows. The air is still and quiet, save for the occasional chirping of birds and rustling of leaves.",
        segment_order: 1,
        parent_segment_id: null,
        created_at: new Date().toISOString(),
        created_by: null
      };
      
      // Create a mock story object with segments array for the auto-continue feature
      const mockStory = {
        id: storyId,
        title: 'The Forest of Whispers',
        segments: [mockInitialSegment],
        isLoaded: true
      };
      
      // Use a timeout to ensure state updates complete properly
      setTimeout(() => {
        console.log('Setting story in state with timeout');
        
        // Dispatch all state updates in sequence
        dispatch({ type: 'LOAD_STORY', payload: mockStory });
        
        setTimeout(() => {
          console.log('Setting current segment with second timeout');
          dispatch({ type: 'SET_CURRENT_SEGMENT', payload: mockInitialSegment });
          
          // Create audio segment
          const mockAudioSegment = {
            id: 'audio_1',
            segmentId: 'segment_1',
            audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Using widely-supported MP3 format
            visualEffects: [{
              type: 'background',
              assetUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b',
              timing: { startTime: 0, duration: 0 } // persistent
            }],
            duration: 30000, // 30 seconds
            transcript: mockInitialSegment.content
          };
          
          dispatch({ type: 'SET_SEGMENT', payload: { segment: mockInitialSegment, audioSegment: mockAudioSegment } });
          
          // Set the choices
          const mockChoices = [
            {
              id: 'choice_1',
              segment_id: 'segment_1',
              choice_text: 'Follow the path into the forest',
              next_segment_id: 'segment_2',
              created_at: new Date().toISOString(),
              karmaImpact: {
                type: KarmaType.NEUTRAL,
                value: 0,
                description: 'A safe but unremarkable choice'
              }
            },
            {
              id: 'choice_2',
              segment_id: 'segment_1',
              choice_text: 'Explore the edge of the forest first',
              next_segment_id: 'segment_3',
              created_at: new Date().toISOString(),
              karmaImpact: {
                type: KarmaType.GOOD,
                value: 5,
                description: 'A cautious and wise approach'
              }
            },
            {
              id: 'choice_3',
              segment_id: 'segment_1',
              choice_text: 'Venture deep into the forest away from the path',
              next_segment_id: 'segment_4',
              created_at: new Date().toISOString(),
              karmaImpact: {
                type: KarmaType.EVIL,
                value: 3,
                description: 'A reckless decision that puts you at risk'
              }
            }
          ];
          
          dispatch({ type: 'SET_CHOICES', payload: { choices: mockChoices } });
          
          // Complete loading
          dispatch({ type: 'SET_LOADING_NEXT_SEGMENT', payload: { isLoading: false } });
          
          console.log('Story initialized successfully in sequential timeouts');
          
          // Add a direct call to explicitly start the narration after 12 seconds 
          // instead of relying on callback which might not get triggered
          setTimeout(async () => {
            console.log('12 seconds have passed since initialization, ensuring narration starts');
            
            if (mockInitialSegment && mockInitialSegment.content) {
              console.log('Starting direct narration of story content after 12 seconds');
              
              try {
                // Check if audio is still playing and fade it out if needed
                if (storyAudioPlayer.getIsPlaying()) {
                  console.log('Audio is still playing, stopping it first');
                  await storyAudioPlayer.fadeOut(1000);
                }
                
                // Wait a small amount of time for any fade out to complete
                await new Promise(resolve => setTimeout(resolve, 1200));
                
                // Directly call the speak function with the segment content
                await speakSegmentContent(
                  dispatch,
                  () => ({ 
                    ...state, 
                    playbackState: { 
                      ...state.playbackState, 
                      isPlaying: true 
                    } 
                  })
                )(mockInitialSegment.content);
                
                console.log('Direct narration completed successfully');
              } catch (error) {
                console.error('Error starting direct narration:', error);
                alert('There was a problem with the narration. Please restart the app.');
              }
            }
          }, 12000);
        }, 100);
      }, 100);
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error initializing story:', error);
      dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to initialize story. Please try again.' } });
      dispatch({ type: 'SET_LOADING_NEXT_SEGMENT', payload: { isLoading: false } });
      return Promise.reject(error);
    }
  };

  // Helper function to speak segment content using TTS
  const speakSegmentContent = (
    dispatch: Dispatch<StoryExperienceAction>,
    getState: () => StoryExperienceState
  ) => async (content: string) => {
    try {
      console.log('Speaking segment content with length:', content?.length);
      
      // Check if we have pending choices
      const state = getState();
      const hasChoices = state.availableChoices && state.availableChoices.length > 0;
      
      // Break the content if we're at a choice point
      let finalContent = content;
      
      if (hasChoices) {
        console.log('Detected choices are available, preparing content for choice point');
        // Stop at a natural sentence break before choices
        const sentences = content.split(/(?<=[.!?])\s+/);
        
        // Use just enough sentences to provide context but stop before choices
        const sentencesToUse = Math.min(sentences.length, Math.max(sentences.length - 2, 1));
        finalContent = sentences.slice(0, sentencesToUse).join(' ');
        
        console.log(`Adjusted content length for choice point: ${finalContent.length} (original: ${content.length})`);
      }
      
      // Update UI to show playing state
      dispatch({ 
        type: 'PLAYBACK_UPDATE', 
        payload: { 
          isPlaying: true, 
          isPaused: false,
          currentTime: 0,
          duration: 0
        } 
      });
      
      // Enhanced Kokoro audio experience
      try {
        // Initialize Kokoro audio service if not already
        if (!kokoroAudio.isInitialized) {
          await kokoroAudio.initialize();
        }
        
        // First play the intro sound with fade-out
        console.log('KOKORO: Playing intro sound before narration');
        await kokoroAudio.playIntroSound();
        
        // Determine emotion based on content
        let emotion = EmotionType.NEUTRAL;
        if (content.includes('fear') || content.includes('scared') || content.includes('terrified')) {
          emotion = EmotionType.FEARFUL;
        } else if (content.includes('happy') || content.includes('joy') || content.includes('delighted')) {
          emotion = EmotionType.HAPPY;
        } else if (content.includes('mystery') || content.includes('strange') || content.includes('unknown')) {
          emotion = EmotionType.MYSTERIOUS;
        }
        
        // Start ambiance based on content keywords
        if (content.includes('forest') || content.includes('woods') || content.includes('trees')) {
          await kokoroAudio.startAmbiance('forest');
        } else if (content.includes('cave') || content.includes('tunnel') || content.includes('underground')) {
          await kokoroAudio.startAmbiance('cave');
        } else if (content.includes('village') || content.includes('town') || content.includes('people')) {
          await kokoroAudio.startAmbiance('village');
        } else {
          // Default ambiance
          await kokoroAudio.startAmbiance('forest');
        }
        
        // Start narration with fade-in and emotional inflection
        console.log('KOKORO: Starting narration with emotion:', emotion);
        await kokoroAudio.startNarration(finalContent, emotion);
        
        // If we have choices, append "What will you do?" at the end
        if (hasChoices) {
          // Give a short pause after the main narration
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Play the "What will you do?" prompt
          console.log('KOKORO: Adding "What will you do?" prompt');
          await kokoroAudio.startNarration("What will you do?", EmotionType.MYSTERIOUS);
          
          // Short delay before showing choices to allow the prompt to be heard
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Pause narration and play choice prompt sound
          await kokoroAudio.pauseNarrationForChoices();
          
          // Show choices after narration completes
          console.log('KOKORO: Narration complete, showing choices');
          setTimeout(() => {
            dispatch({ type: 'SET_AT_CHOICE_POINT', payload: { isAtChoicePoint: true } });
          }, 300);
        }
        
        return;
      } catch (error) {
        console.error('Error with Kokoro audio experience:', error);
        // Fall back to regular TTS if Kokoro fails
      }
      
      // Fallback: Begin speaking with the regular TTS service
      const result = await textToSpeech.speak(finalContent, {
        onStart: () => {
          console.log('TTS started speaking segment content');
        },
        onComplete: () => {
          console.log('TTS finished speaking segment content');
          
          // Show choices immediately when narration finishes if any are available
          if (hasChoices) {
            console.log('Narration complete, showing choices');
            // IMPORTANT: Set at choice point after narration so it doesn't interrupt
            setTimeout(() => {
              dispatch({ type: 'SET_AT_CHOICE_POINT', payload: { isAtChoicePoint: true } });
            }, 300); // Short delay for better flow
          }
        },
        onError: (err) => {
          console.error('TTS error during narration:', err);
          dispatch({ 
            type: 'SET_ERROR', 
            payload: { error: 'Error during narration: ' + String(err) } 
          });
        }
      });
      
      console.log('TTS speak call completed with result:', result);
      return result;
    } catch (error) {
      console.error('Error in speakSegmentContent:', error);
      throw error;
    }
  };

  // Helper function to split text into chunks
  const splitTextIntoChunks = (text: string, maxChunkSize: number): string[] => {
    if (!text) return [];
    
    const chunks: string[] = [];
    let currentChunk = '';
    
    // Split by sentences to maintain natural breaks
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxChunkSize) {
        currentChunk += sentence;
      } else {
        // If the current chunk has content, push it
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
        }
        
        // If the sentence itself is longer than max chunk size,
        // split it by words
        if (sentence.length > maxChunkSize) {
          const words = sentence.split(' ');
          currentChunk = '';
          
          for (const word of words) {
            if (currentChunk.length + word.length + 1 <= maxChunkSize) {
              currentChunk += currentChunk.length > 0 ? ' ' + word : word;
            } else {
              chunks.push(currentChunk.trim());
              currentChunk = word;
            }
          }
        } else {
          currentChunk = sentence;
        }
      }
    }
    
    // Don't forget the last chunk
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  };

  // Audio control functions
  const playAudio = async () => {
    try {
      console.log('playAudio called - checking for content to play');
      
      // Get current state locally to avoid closure issues
      const currentState = { ...state };
      
      // Log comprehensive state information for debugging
      console.log('Current state when playAudio is called:', {
        hasCurrentSegment: !!currentState.currentSegment,
        currentSegmentId: currentState.currentSegment?.id,
        hasStory: !!currentState.story,
        storyId: currentState.story?.id,
        isStoryLoaded: currentState.story?.isLoaded,
        availableSegments: currentState.story?.segments?.length,
        hasContent: currentState.currentSegment?.content ? true : false,
        contentLength: currentState.currentSegment?.content?.length,
        hasAudioSegment: !!currentState.currentAudioSegment,
        audioSegmentId: currentState.currentAudioSegment?.id,
        audioUrl: currentState.currentAudioSegment?.audioUrl
      });
      
      // Check if story is loaded
      if (!currentState.story?.isLoaded) {
        console.warn('Story not loaded yet, displaying error');
        dispatch({ 
          type: 'SET_ERROR', 
          payload: { error: 'Story is still loading. Please wait a moment and try again.' } 
        });
        return;
      }
      
      // First check if we have a current segment
      if (!currentState.currentSegment) {
        console.warn('No current segment is available, checking if we can recover');
        
        // Check if we have a story with segments but segment wasn't set properly
        if (currentState.story?.segments?.length > 0) {
          console.log('Story has segments but current segment is not set. Attempting to recover by setting first segment.');
          
          // Try to recover by setting the first segment directly
          const firstSegment = currentState.story.segments[0];
          
          // Update the state
          dispatch({ type: 'SET_CURRENT_SEGMENT', payload: firstSegment });
          console.log('Dispatched SET_CURRENT_SEGMENT with first segment:', firstSegment.id);
          
          // Use the first segment content directly for playback
          if (firstSegment.content) {
            console.log('Using first segment content for playback');
            dispatch({ type: 'SET_PLAYING', payload: true });
            await speakSegmentContent(dispatch, () => ({ ...state, playbackState: { ...state.playbackState, isPlaying: true } }))(firstSegment.content);
            return;
          } else {
            console.error('First segment has no content');
            dispatch({ 
              type: 'SET_ERROR', 
              payload: { error: 'Story segment has no content. Please restart the story.' } 
            });
            return;
          }
        } else {
          console.error('No segments available in the story');
          dispatch({ 
            type: 'SET_ERROR', 
            payload: { error: 'Story has no segments. Please restart the app.' } 
          });
          return;
        }
      }
      
      // Get updated state after potential recovery
      const updatedState = { ...state };
      
      // Now we should have a currentSegment, but double-check
      if (!updatedState.currentSegment) {
        console.error('Failed to set current segment');
        dispatch({ 
          type: 'SET_ERROR', 
          payload: { error: 'Failed to set story segment. Please restart the app.' } 
        });
        return;
      }
      
      // Update playing state first, to ensure UI updates properly
      dispatch({ type: 'SET_PLAYING', payload: true });
      
      // Check for audio segment first
      if (updatedState.currentAudioSegment && updatedState.currentAudioSegment.audioUrl) {
        console.log('Playing audio from audio segment:', updatedState.currentAudioSegment.id);
        
        // First load the audio file
        try {
          const audioUrl = updatedState.currentAudioSegment.audioUrl;
          console.log('Loading audio from URL:', audioUrl);
          
          // First load the audio
          await storyAudioPlayer.loadAudio(audioUrl);
          console.log('Audio loaded successfully, starting playback');
          
          // Then play it
          await storyAudioPlayer.play();
          console.log('Audio playback initiated');
          
          // Alert the user that audio should be playing
          alert('Audio playback started. Please ensure your device volume is turned up.');
        } catch (audioError) {
          console.error('Error loading or playing audio file:', audioError);
          console.log('Falling back to TTS due to audio error');
          
          // If audio fails, fall back to TTS
          if (updatedState.currentSegment.content) {
            try {
              console.log('Starting TTS fallback with content length:', updatedState.currentSegment.content.length);
              
              // Ensure state is still set to playing for TTS
              dispatch({ type: 'SET_PLAYING', payload: true });
              
              // Call TTS with updated state to prevent premature stopping
              await speakSegmentContent(
                dispatch, 
                () => ({ ...state, playbackState: { ...state.playbackState, isPlaying: true } })
              )(updatedState.currentSegment.content);
              
              console.log('TTS fallback completed successfully');
            } catch (ttsError) {
              console.error('Error with TTS fallback:', ttsError);
              throw new Error('Text-to-speech fallback failed: ' + ttsError.message);
            }
          } else {
            throw new Error('No content available for TTS fallback');
          }
        }
      } 
      // Fall back to content for TTS
      else if (updatedState.currentSegment.content) {
        const content = updatedState.currentSegment.content;
        console.log('Playing audio using TTS with segment content length:', content.length);
        console.log('Content preview:', content.substring(0, 50) + '...');
        
        try {
          // If no audio segment is available, use TTS on the current segment content
          await speakSegmentContent(
            dispatch, 
            () => ({ ...state, playbackState: { ...state.playbackState, isPlaying: true } })
          )(content);
          console.log('TTS playback completed successfully');
        } catch (ttsError) {
          console.error('Error with direct TTS playback:', ttsError);
          throw new Error('Text-to-speech playback failed: ' + ttsError.message);
        }
      } 
      // No content available
      else {
        console.error('No segment content to speak!');
        dispatch({ 
          type: 'SET_ERROR', 
          payload: { error: 'Story content is missing. Please try again.' } 
        });
        dispatch({ type: 'SET_PLAYING', payload: false });
      }
      
      console.log('PlayAudio function completed successfully');
    } catch (error) {
      console.error('Error playing audio:', error);
      dispatch({ type: 'SET_PLAYING', payload: false });
      dispatch({ 
        type: 'SET_ERROR', 
        payload: { error: 'Failed to play audio: ' + (error.message || 'Unknown error') } 
      });
      alert('There was a problem playing audio: ' + (error.message || 'Unknown error'));
    }
  };

  const pauseAudio = async () => {
    await storyAudioPlayer.pause();
    textToSpeech.stop();
  };

  const stopAudio = async () => {
    await storyAudioPlayer.stop();
    textToSpeech.stop();
  };

  const rewindAudio = async (seconds = 10) => {
    await storyAudioPlayer.rewind(seconds);
  };

  const fastForwardAudio = async (seconds = 10) => {
    await storyAudioPlayer.fastForward(seconds);
  };

  const seekToPosition = async (milliseconds: number) => {
    await storyAudioPlayer.seekTo(milliseconds);
  };

  // Modified function to make a choice with audio effects
  const makeChoice = async (choiceId: string) => {
    try {
      console.log('User selected choice:', choiceId);
      
      // Set processing state
      dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: true } });
      
      // Find the selected choice
      const selectedChoice = state.availableChoices.find(choice => choice.id === choiceId);
      if (!selectedChoice) {
        console.error('Selected choice not found:', choiceId);
        dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: false } });
        return;
      }
      
      // Play appropriate sound effect based on choice
      try {
        // Determine effect type based on choice text
        let effectType = 'default';
        const choiceText = selectedChoice.choice_text.toLowerCase();
        
        if (choiceText.includes('walk') || choiceText.includes('run') || choiceText.includes('path')) {
          effectType = 'footsteps';
        } else if (choiceText.includes('door') || choiceText.includes('open') || choiceText.includes('enter')) {
          effectType = 'door';
        } else if (choiceText.includes('magic') || choiceText.includes('spell') || choiceText.includes('power')) {
          effectType = 'magic';
        }
        
        // Play the effect using Kokoro
        await kokoroAudio.playChoiceEffect(effectType);
      } catch (error) {
        console.error('Error playing choice effect:', error);
        // Continue with choice processing even if effect fails
      }
      
      // Process karma impact if present
      if ((selectedChoice as StoryChoiceWithKarma).karmaImpact) {
        const impact = (selectedChoice as StoryChoiceWithKarma).karmaImpact;
        if (impact && typeof impact.value === 'number') {
          const newScore = karmaSystem.adjustKarma(state.karmaScore, impact.value);
          dispatch({ type: 'UPDATE_KARMA_SCORE', payload: { score: newScore } });
        }
      }
      
      // Mock API call to get the next segment based on the choice
      // In a real app, this would be an API call to your backend
      setTimeout(async () => {
        try {
          console.log('Getting next segment for choice:', choiceId);
          
          dispatch({ type: 'SET_LOADING_NEXT_SEGMENT', payload: { isLoading: true } });
          
          // Save the choice to history
          dispatch({ 
            type: 'ADD_CHOICE_TO_HISTORY', 
            payload: { 
              segmentId: state.currentSegment?.id || 'unknown', 
              choiceId: selectedChoice.id 
            } 
          });
          
          // Find the next segment 
          const nextSegment = {
            id: `segment_${Math.random().toString(36).substring(7)}`,
            content: "The path ahead becomes clearer as you make your choice. You continue your journey, embracing the consequences of your decision."
          };
          
          const nextAudioSegment = {
            id: nextSegment.id,
            url: null, // We're using TTS, not pre-recorded audio
            transcript: nextSegment.content,
            offset: 0,
            duration: 0
          };
          
          // Reset choice point state
          dispatch({ type: 'SET_AT_CHOICE_POINT', payload: { isAtChoicePoint: false } });
          
          // Update state with new segment
          dispatch({ 
            type: 'SET_SEGMENT', 
            payload: { 
              segment: nextSegment, 
              audioSegment: nextAudioSegment
            } 
          });
          
          // Clear choices after selection
          dispatch({ type: 'SET_CHOICES', payload: { choices: [] } });
          
          // End processing state
          dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: false } });
          
          // Resume narration after choice is made
          try {
            await kokoroAudio.resumeNarrationAfterChoice(nextSegment.content);
          } catch (error) {
            console.error('Error resuming narration after choice:', error);
            // Fallback: Use standard playback if Kokoro fails
            await speakSegmentContent(dispatch, () => state)(nextSegment.content);
          }
          
          // Mark segment load as complete
          dispatch({ type: 'SET_LOADING_NEXT_SEGMENT', payload: { isLoading: false } });
          
        } catch (error) {
          console.error('Error processing choice:', error);
          dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: false } });
          dispatch({ type: 'SET_LOADING_NEXT_SEGMENT', payload: { isLoading: false } });
          dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to process choice. Please try again.' } });
        }
      }, 1500); // Short delay for better user experience
      
    } catch (error) {
      console.error('Error in makeChoice:', error);
      dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: false } });
      dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to process choice. Please try again.' } });
    }
  };

  // Voice input handling
  const startVoiceInput = async () => {
    if (state.userSettings.preferredInputMode !== InputMode.VOICE) return;
    
    try {
      await speechRecognition.startListening({
        onResult: (result) => {
          processVoiceInput(result);
        },
        onError: (error) => {
          console.error('Voice recognition error:', error);
          dispatch({ type: 'SET_ERROR', payload: { error: 'Voice recognition failed. Please try again or use touch input.' } });
        }
      });
    } catch (error) {
      console.error('Error starting voice input:', error);
    }
  };

  const stopVoiceInput = async () => {
    await speechRecognition.stopListening();
  };

  // Process voice input to find matching choice
  const processVoiceInput = (input: string) => {
    if (!input || !state.isAtChoicePoint) return;
    
    // Find the choice that best matches the user's voice input
    const choiceMatch = findBestChoiceMatch(input, state.availableChoices);
    
    if (choiceMatch) {
      stopVoiceInput();
      makeChoice(choiceMatch.id);
    }
  };

  // Find the best matching choice for a voice input
  const findBestChoiceMatch = (input: string, choices: StoryChoiceWithKarma[]): StoryChoiceWithKarma | null => {
    const inputLower = input.toLowerCase();
    
    // Try to find an exact match first
    const exactMatch = choices.find(choice => 
      inputLower.includes(choice.choice_text.toLowerCase())
    );
    
    if (exactMatch) return exactMatch;
    
    // If no exact match, use a simple word matching algorithm
    // Count the number of words from each choice that appear in the input
    let bestMatch = null;
    let highestScore = 0;
    
    choices.forEach(choice => {
      const choiceWords = choice.choice_text.toLowerCase().split(' ');
      const inputWords = inputLower.split(' ');
      
      let matchScore = 0;
      choiceWords.forEach(word => {
        if (word.length > 3 && inputWords.includes(word)) {
          matchScore += 1;
        }
      });
      
      if (matchScore > highestScore) {
        highestScore = matchScore;
        bestMatch = choice;
      }
    });
    
    // Return the best match if it has at least one significant word match
    return highestScore > 0 ? bestMatch : null;
  };

  // Handle open-ended input (premium feature)
  const submitOpenEndedInput = async (input: string) => {
    if (!input || !state.isAtChoicePoint) return;
    
    dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: true } });
    
    try {
      // In a real app, send the input to an AI service for processing
      // For now, we'll use a simple sentiment analysis simulation
      
      // Simulate AI processing delay
      setTimeout(() => {
        // Simple sentiment analysis - count positive and negative words
        const positiveWords = ['good', 'nice', 'help', 'kind', 'friendly', 'save'];
        const negativeWords = ['bad', 'evil', 'hurt', 'attack', 'kill', 'steal'];
        
        const inputLower = input.toLowerCase();
        let sentiment = 0;
        
        positiveWords.forEach(word => {
          if (inputLower.includes(word)) sentiment += 0.2;
        });
        
        negativeWords.forEach(word => {
          if (inputLower.includes(word)) sentiment -= 0.2;
        });
        
        // Clamp sentiment between -1 and 1
        sentiment = Math.max(-1, Math.min(1, sentiment));
        
        // Extract simple keywords
        const keywords = inputLower.split(' ')
          .filter(word => word.length > 3)
          .slice(0, 5);
        
        // Simple intent classification
        let intent = 'neutral';
        if (sentiment > 0.3) intent = 'help';
        else if (sentiment < -0.3) intent = 'attack';
        else if (inputLower.includes('run') || inputLower.includes('flee')) intent = 'flee';
        else if (inputLower.includes('hide')) intent = 'hide';
        else if (inputLower.includes('talk') || inputLower.includes('speak')) intent = 'talk';
        
        // Create the processed input
        const processedInput: OpenEndedInput = {
          text: input,
          sentiment,
          keywords,
          intent
        };
        
        dispatch({ type: 'SET_OPEN_ENDED_INPUT', payload: { input: processedInput } });
        
        // Based on intent, choose a path
        let nextChoiceId = '';
        
        if (intent === 'help' || intent === 'talk') {
          // Find a good/friendly choice
          const goodChoice = state.availableChoices.find(c => 
            c.karmaImpact?.type === KarmaType.GOOD
          );
          if (goodChoice) nextChoiceId = goodChoice.id;
        } else if (intent === 'attack') {
          // Find an aggressive/evil choice
          const evilChoice = state.availableChoices.find(c => 
            c.karmaImpact?.type === KarmaType.EVIL
          );
          if (evilChoice) nextChoiceId = evilChoice.id;
        } else {
          // Find a neutral choice
          const neutralChoice = state.availableChoices.find(c => 
            c.karmaImpact?.type === KarmaType.NEUTRAL
          );
          if (neutralChoice) nextChoiceId = neutralChoice.id;
        }
        
        // If we found a matching choice, select it
        if (nextChoiceId) {
          makeChoice(nextChoiceId);
        } else if (state.availableChoices.length > 0) {
          // Fallback to the first choice
          makeChoice(state.availableChoices[0].id);
        }
      }, 2000);
    } catch (error) {
      console.error('Error processing open-ended input:', error);
      dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to process your input. Please try again.' } });
      dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: false } });
    }
  };

  // Update user settings
  const updateUserSettings = (settings: Partial<StoryExperienceState['userSettings']>) => {
    dispatch({ type: 'SET_INPUT_MODE', payload: { inputMode: settings.preferredInputMode } });
  };

  // Reset the story experience state
  const resetStoryExperience = () => {
    stopAudio();
    stopVoiceInput();
    dispatch({ type: 'RESET_STATE' });
  };

  const contextValue: StoryExperienceContextType = {
    state,
    initializeStory,
    playAudio,
    pauseAudio,
    stopAudio,
    rewindAudio,
    fastForwardAudio,
    seekToPosition,
    makeChoice,
    startVoiceInput,
    stopVoiceInput,
    submitOpenEndedInput,
    updateUserSettings,
    resetStoryExperience
  };

  return (
    <StoryExperienceContext.Provider value={contextValue}>
      {children}
    </StoryExperienceContext.Provider>
  );
};

// Custom hook for using the story experience context
export const useStoryExperience = () => {
  const context = useContext(StoryExperienceContext);
  if (context === undefined) {
    throw new Error('useStoryExperience must be used within a StoryExperienceProvider');
  }
  return context;
};

export default StoryExperienceContext; 