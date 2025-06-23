import React, { createContext, useContext, useEffect, useCallback, useReducer, Dispatch } from 'react';
import {
  StoryExperienceState,
  defaultStoryExperienceState,
  InputMode,
  OpenEndedInput,
  StoryChoiceWithKarma,
  StoryAudioSegment,
  StoryPlaybackState,
  StoryUserSettings,
  StoryVisualEffect // Import StoryVisualEffect
} from '../types/storyExperience.types';
import { StorySegment, StoryChoice } from '../types/story.types';
import { storyAudioPlayer } from '../services/audio/storyAudioPlayer';
import textToSpeech from '../services/ai/ttsService'; // Update import path
import { speechRecognition } from '../services/audio/speechRecognition';
import { karmaSystem, KarmaType } from '../services/game/karmaSystem';
// import { api } from '../services/api'; // Comment out missing service for now
import { Audio } from 'expo-av';

// Define the actions that can be dispatched to the reducer
type StoryExperienceAction =
  // Allow null for segment/audioSegment in INIT_STORY for initial setup
  | { type: 'INIT_STORY'; payload: { storyId: string; segment: StorySegment | null; audioSegment: StoryAudioSegment | null; choices: StoryChoice[] } }
  | { type: 'SET_SEGMENT'; payload: { segment: StorySegment; audioSegment: StoryAudioSegment } }
  | { type: 'SET_CHOICES'; payload: { choices: StoryChoice[] } }
  | { type: 'SELECT_CHOICE'; payload: { choiceId: string } }
  | { type: 'SET_PROCESSING_CHOICE'; payload: { isProcessingChoice: boolean } }
  | { type: 'SET_AT_CHOICE_POINT'; payload: { isAtChoicePoint: boolean } }
  | { type: 'SET_INPUT_MODE'; payload: { inputMode: InputMode } }
  | { type: 'UPDATE_KARMA_SCORE'; payload: { score: number } }
  | { type: 'ADD_STORY_POINTS'; payload: { points: number; reason: string } }
  | { type: 'ADD_CHOICE_TO_HISTORY'; payload: { segmentId: string; choiceId: string } }
  | { type: 'PLAYBACK_UPDATE'; payload: Partial<StoryPlaybackState> } // Use partial for flexibility
  | { type: 'SET_ERROR'; payload: { error: string | null } } // Allow null error
  | { type: 'SET_LOADING_NEXT_SEGMENT'; payload: { isLoading: boolean } }
  | { type: 'SET_OPEN_ENDED_INPUT'; payload: { input: OpenEndedInput | null } }
  | { type: 'SET_PLAYING'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'RESET_STATE' };

// Reducer function to handle state updates
const storyExperienceReducer = (state: StoryExperienceState, action: StoryExperienceAction): StoryExperienceState => {
  switch (action.type) {
    case 'INIT_STORY':
      return {
        ...defaultStoryExperienceState, // Start from default on init
        storyId: action.payload.storyId,
        currentSegment: action.payload.segment,
        currentAudioSegment: action.payload.audioSegment,
        availableChoices: action.payload.choices,
        isLoadingNextSegment: true, // Start in loading state
      };
    case 'SET_SEGMENT':
      return {
        ...state,
        currentSegment: action.payload.segment,
        currentAudioSegment: action.payload.audioSegment,
        selectedChoice: null,
        isAtChoicePoint: false,
        isLoadingNextSegment: false, // Loading finished
        error: null,
      };
    case 'SET_CHOICES':
      return {
        ...state,
        availableChoices: action.payload.choices,
      };
    case 'SELECT_CHOICE':
      return {
        ...state,
        selectedChoice: action.payload.choiceId,
      };
    case 'SET_PROCESSING_CHOICE':
      return {
        ...state,
        isProcessingChoice: action.payload.isProcessingChoice,
      };
    case 'SET_AT_CHOICE_POINT':
      return {
        ...state,
        isAtChoicePoint: action.payload.isAtChoicePoint,
      };
    case 'SET_INPUT_MODE':
      return {
        ...state,
        userSettings: {
          ...state.userSettings,
          preferredInputMode: action.payload.inputMode,
        },
      };
    case 'UPDATE_KARMA_SCORE':
      return {
        ...state,
        karmaScore: action.payload.score,
      };
    case 'ADD_STORY_POINTS':
      return {
        ...state,
        storyPoints: {
          current: state.storyPoints.current + action.payload.points,
          history: [
            ...state.storyPoints.history,
            {
              amount: action.payload.points,
              reason: action.payload.reason,
              timestamp: Date.now(),
            },
          ],
        },
      };
    case 'ADD_CHOICE_TO_HISTORY':
      return {
        ...state,
        choiceHistory: [
          ...state.choiceHistory,
          { ...action.payload, timestamp: Date.now() },
        ],
      };
    case 'PLAYBACK_UPDATE':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          ...action.payload,
        },
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
      };
    case 'SET_LOADING_NEXT_SEGMENT':
      return {
        ...state,
        isLoadingNextSegment: action.payload.isLoading,
      };
    case 'SET_OPEN_ENDED_INPUT':
      return {
        ...state,
        openEndedInput: action.payload.input,
      };
    case 'SET_PLAYING':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          isPlaying: action.payload,
          isPaused: action.payload ? false : state.playbackState.isPaused,
        },
      };
    case 'SET_PAUSED':
      return {
        ...state,
        playbackState: {
          ...state.playbackState,
          isPaused: action.payload,
          isPlaying: action.payload ? false : state.playbackState.isPlaying,
        },
      };
    case 'RESET_STATE':
      return defaultStoryExperienceState;
    default:
      return state;
  }
};

// Define the shape of the context value, including dispatch
interface StoryExperienceContextType {
  state: StoryExperienceState;
  dispatch: Dispatch<StoryExperienceAction>;
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
  updateUserSettings: (settings: Partial<StoryUserSettings>) => void;
  resetStoryExperience: () => void;
}

const StoryExperienceContext = createContext<StoryExperienceContextType | undefined>(undefined);

// Provider component
interface StoryExperienceProviderProps {
  children: React.ReactNode;
}

export const StoryExperienceProvider: React.FC<StoryExperienceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(storyExperienceReducer, defaultStoryExperienceState);

  // --- Define speakSegmentContent first ---
  const speakSegmentContent = useCallback(async (content: string | null | undefined) => {
    if (!content) {
      console.warn("speakSegmentContent called with null or undefined content.");
      return;
    }
    try {
      console.log('Speaking segment content disabled - content length:', content.length);
      const hasChoices = state.availableChoices && state.availableChoices.length > 0;

      dispatch({ type: 'PLAYBACK_UPDATE', payload: { isPlaying: true, isPaused: false } });

      // AUDIO COMPLETELY DISABLED - simulate completion
      return new Promise<void>(resolve => {
        console.log('Simulating audio playback (disabled)');
        console.log('TTS started speaking segment content (simulated)');
        setTimeout(() => {
          console.log('TTS finished speaking segment content (simulated)');
          if (hasChoices) {
            console.log('Narration complete, showing choices');
             setTimeout(() => dispatch({ type: 'SET_AT_CHOICE_POINT', payload: { isAtChoicePoint: true } }), 300);
          }
           dispatch({ type: 'PLAYBACK_UPDATE', payload: { isPlaying: false } });
          resolve();
        }, 1000);
      });

    } catch (error) {
      console.error('Error in speakSegmentContent:', error);
      dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to speak content.' } });
      dispatch({ type: 'PLAYBACK_UPDATE', payload: { isPlaying: false } });
    }
  }, [state.availableChoices, dispatch]);

  // --- Initialize services ---
  useEffect(() => {
    const initServices = async () => {
      await storyAudioPlayer.init();
      await textToSpeech.init();
      await speechRecognition.init();
      await karmaSystem.init();
    };
    initServices();
    return () => {
      storyAudioPlayer.cleanup();
      textToSpeech.cleanup();
      speechRecognition.cleanup();
    };
  }, []);

  // --- Set up audio player listeners ---
  useEffect(() => {
    const statusUpdateCallback = (status: any) => {
       if (status.isLoaded) {
         // Temporarily comment out the dispatch to isolate the TypeError trigger
         /*
         dispatch({
           type: 'PLAYBACK_UPDATE',
           payload: {
             isPlaying: status.isPlaying,
             isPaused: !status.isPlaying && status.positionMillis > 0,
             currentTime: status.positionMillis,
             duration: status.durationMillis || state.playbackState.duration
           }
         });
         */
         // console.log("Status Update (dispatch commented out):", status); // Optional logging
       }
     };

    const playbackCompleteCallback = () => {
       console.log('Audio playback finished - checking if we need to start narration or show choices');
       setTimeout(async () => {
         // Add explicit check for string type before calling speakSegmentContent
         if (state.currentSegment && typeof state.currentSegment.content === 'string' && state.currentSegment.content) {
           console.log('Starting TTS narration after intro music completed');
           try {
             await speakSegmentContent(state.currentSegment.content);
           } catch (error) {
             console.error('Error starting narration after intro music:', error);
             dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to start narration: ' + (error instanceof Error ? error.message : String(error)) } });
           }
         } else if (!state.isAtChoicePoint && state.availableChoices?.length > 0) {
           console.log('No content to narrate, showing choices directly');
           dispatch({ type: 'SET_AT_CHOICE_POINT', payload: { isAtChoicePoint: true } });
         }
       }, 800);
     };

    storyAudioPlayer.setOnPlaybackStatusUpdate(statusUpdateCallback);
    storyAudioPlayer.setOnPlaybackComplete(playbackCompleteCallback);

    return () => {
      if (storyAudioPlayer.setOnPlaybackStatusUpdate) storyAudioPlayer.setOnPlaybackStatusUpdate(() => {});
      if (storyAudioPlayer.setOnPlaybackComplete) storyAudioPlayer.setOnPlaybackComplete(() => {});
    };
  }, [state.isAtChoicePoint, state.availableChoices, state.userSettings?.preferredInputMode, state.currentSegment, state.playbackState.duration, dispatch, speakSegmentContent]);

  // --- Context Actions ---

  const initializeStory = useCallback(async (storyId: string) => {
    try {
      console.log('Initializing story with ID:', storyId);
      dispatch({ type: 'RESET_STATE' });
      dispatch({ type: 'INIT_STORY', payload: { storyId, segment: null, audioSegment: null, choices: [] } });
      dispatch({ type: 'SET_LOADING_NEXT_SEGMENT', payload: { isLoading: true } });

      // MOCK DATA
      const mockInitialSegment: StorySegment = {
        id: 'segment_1', story_id: storyId, content: "You find yourself standing at the edge of a vast forest...", segment_order: 1, parent_segment_id: null, created_at: new Date().toISOString(), created_by: null
      };
      const mockAudioSegment: StoryAudioSegment = {
        id: 'audio_1', segmentId: 'segment_1', audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', visualEffects: [{ type: 'background', assetUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b', timing: { startTime: 0, duration: 0 } }] as StoryVisualEffect[], duration: 30000, transcript: mockInitialSegment.content
      };
      const mockChoices: StoryChoiceWithKarma[] = [
        { id: 'choice_1', segment_id: 'segment_1', choice_text: 'Follow the path', next_segment_id: 'segment_2', created_at: new Date().toISOString(), karmaImpact: { type: KarmaType.NEUTRAL, value: 0, description: 'Safe' } },
        { id: 'choice_2', segment_id: 'segment_1', choice_text: 'Explore edge', next_segment_id: 'segment_3', created_at: new Date().toISOString(), karmaImpact: { type: KarmaType.GOOD, value: 5, description: 'Cautious' } },
      ];

      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

      dispatch({ type: 'SET_SEGMENT', payload: { segment: mockInitialSegment, audioSegment: mockAudioSegment } });
      dispatch({ type: 'SET_CHOICES', payload: { choices: mockChoices } });

      console.log('Story initialized successfully');

    } catch (error) {
      console.error('Error initializing story:', error);
      dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to initialize story.' } });
      dispatch({ type: 'SET_LOADING_NEXT_SEGMENT', payload: { isLoading: false } });
    }
  }, [dispatch]);

  const playAudio = useCallback(async () => {
    try {
      console.log('playAudio called');
      const { currentSegment, currentAudioSegment } = state;

      if (!currentSegment) { dispatch({ type: 'SET_ERROR', payload: { error: 'No story segment loaded.' } }); return; }
      dispatch({ type: 'SET_PLAYING', payload: true });

      if (currentAudioSegment?.audioUrl) {
        try {
          await storyAudioPlayer.loadAudio(currentAudioSegment.audioUrl);
          await storyAudioPlayer.play();
        } catch (audioError) {
          console.error('Error playing audio file, falling back to TTS:', audioError);
          if (currentSegment.content) await speakSegmentContent(currentSegment.content);
          else { dispatch({ type: 'SET_ERROR', payload: { error: 'No content for TTS fallback.' } }); dispatch({ type: 'SET_PLAYING', payload: false }); }
        }
      } else if (currentSegment.content) {
        await speakSegmentContent(currentSegment.content);
      } else {
        dispatch({ type: 'SET_ERROR', payload: { error: 'No audio source available.' } }); dispatch({ type: 'SET_PLAYING', payload: false });
      }
    } catch (error) {
      console.error('Error in playAudio:', error);
      dispatch({ type: 'SET_PLAYING', payload: false }); dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to play audio.' } });
    }
  }, [state.currentSegment, state.currentAudioSegment, dispatch, speakSegmentContent]);

  const pauseAudio = useCallback(async () => {
    await storyAudioPlayer.pause();
    textToSpeech.stop();
    dispatch({ type: 'SET_PAUSED', payload: true });
  }, [dispatch]);

  const stopAudio = useCallback(async () => {
    await storyAudioPlayer.stop();
    textToSpeech.stop();
    dispatch({ type: 'PLAYBACK_UPDATE', payload: { isPlaying: false, isPaused: false, currentTime: 0 } });
  }, [dispatch]);

  const rewindAudio = useCallback(async (seconds = 10) => { await storyAudioPlayer.rewind(seconds); }, []);
  const fastForwardAudio = useCallback(async (seconds = 10) => { await storyAudioPlayer.fastForward(seconds); }, []);
  const seekToPosition = useCallback(async (milliseconds: number) => { await storyAudioPlayer.seekTo(milliseconds); }, []);

  const makeChoice = useCallback(async (choiceId: string) => {
     try {
       dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: true } });
       const selectedChoice = state.availableChoices.find(choice => choice.id === choiceId);
       if (!selectedChoice) { dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: false } }); return; }

       if ((selectedChoice as StoryChoiceWithKarma).karmaImpact) {
         const impact = (selectedChoice as StoryChoiceWithKarma).karmaImpact;
         if (impact && typeof impact.value === 'number') {
           // karmaSystem.adjustKarma doesn't exist
           const newScore = state.karmaScore + (impact.value ?? 0);
           dispatch({ type: 'UPDATE_KARMA_SCORE', payload: { score: newScore } });
         }
       }

       // MOCK API call
       setTimeout(async () => {
         try {
           dispatch({ type: 'SET_LOADING_NEXT_SEGMENT', payload: { isLoading: true } });
           dispatch({ type: 'ADD_CHOICE_TO_HISTORY', payload: { segmentId: state.currentSegment?.id || 'unknown', choiceId: selectedChoice.id } });

           // MOCK next segment data
           const nextSegment: StorySegment = { id: `segment_${Math.random().toString(36).substring(7)}`, story_id: state.storyId || 'unknown', content: "The path ahead becomes clearer...", segment_order: (state.currentSegment?.segment_order || 0) + 1, parent_segment_id: state.currentSegment?.id || null, created_at: new Date().toISOString(), created_by: null };
           const nextAudioSegment: StoryAudioSegment = { id: `audio_${nextSegment.id}`, segmentId: nextSegment.id, audioUrl: '', transcript: nextSegment.content, duration: 0, visualEffects: [] };

           dispatch({ type: 'SET_AT_CHOICE_POINT', payload: { isAtChoicePoint: false } });
           dispatch({ type: 'SET_SEGMENT', payload: { segment: nextSegment, audioSegment: nextAudioSegment } });
           dispatch({ type: 'SET_CHOICES', payload: { choices: [] } });
           dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: false } });

           await speakSegmentContent(nextSegment.content);

         } catch (error) {
           console.error('Error processing choice:', error);
           dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: false } });
           dispatch({ type: 'SET_LOADING_NEXT_SEGMENT', payload: { isLoading: false } });
           dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to process choice.' } });
         }
       }, 1500);

     } catch (error) {
       console.error('Error in makeChoice:', error);
       dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: false } });
       dispatch({ type: 'SET_ERROR', payload: { error: 'Failed to process choice.' } });
     }
   }, [state.availableChoices, state.karmaScore, state.currentSegment, state.storyId, dispatch, speakSegmentContent]);

  // Voice input handling (stubs)
  const startVoiceInput = useCallback(async () => { console.warn("Voice input start requested but service method is missing."); }, []);
  const stopVoiceInput = useCallback(async () => { console.warn("Voice input stop requested but service method is missing."); }, []);

  // Find best choice match (utility) - corrected type
   const findBestChoiceMatch = (input: string | undefined | null, choices: StoryChoiceWithKarma[]): StoryChoiceWithKarma | null => {
     // Check if input is a valid string
     if (typeof input !== 'string' || !input) {
       return null;
     }
     const inputLower = input.toLowerCase().trim(); // Add trim here for safety too

     // Find exact match (checking choice_text validity)
     const exactMatch = choices.find(choice =>
       typeof choice.choice_text === 'string' && inputLower.includes(choice.choice_text.toLowerCase().trim())
     );
     if (exactMatch) return exactMatch;

     let bestMatch: StoryChoiceWithKarma | null = null;
     let highestScore = 0;
     const inputWords = inputLower.split(' ');

     choices.forEach(choice => {
       // Check if choice_text is a valid string
       if (typeof choice.choice_text !== 'string' || !choice.choice_text) {
         return; // Skip this choice if text is invalid
       }
       const choiceWords = choice.choice_text.toLowerCase().trim().split(' ');
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

     return highestScore > 0 ? bestMatch : null;
   };

  // Process voice input (stub logic)
  const processVoiceInput = useCallback((input: string) => {
    if (!input || !state.isAtChoicePoint) return;
    const choiceMatch = findBestChoiceMatch(input, state.availableChoices);
    if (choiceMatch) { stopVoiceInput(); makeChoice(choiceMatch.id); }
  }, [state.isAtChoicePoint, state.availableChoices, stopVoiceInput, makeChoice]);

  // Handle open-ended input (stub logic)
  const submitOpenEndedInput = useCallback(async (input: string) => {
    if (!input || !state.isAtChoicePoint) return;
    dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: true } });
    console.log("Simulating open-ended input processing for:", input);
    setTimeout(() => {
       const processedInput: OpenEndedInput = { text: input, sentiment: 0, keywords: [], intent: 'neutral' };
       dispatch({ type: 'SET_OPEN_ENDED_INPUT', payload: { input: processedInput } });
       if (state.availableChoices.length > 0) makeChoice(state.availableChoices[0].id);
       else { dispatch({ type: 'SET_PROCESSING_CHOICE', payload: { isProcessingChoice: false } }); dispatch({ type: 'SET_ERROR', payload: { error: 'No choices available.' } }); }
    }, 2000);
  }, [state.isAtChoicePoint, state.availableChoices, dispatch, makeChoice]);

  // Update user settings
  const updateUserSettings = useCallback((settings: Partial<StoryUserSettings>) => {
    if (settings.preferredInputMode) {
      dispatch({ type: 'SET_INPUT_MODE', payload: { inputMode: settings.preferredInputMode } });
    }
  }, [dispatch]);

  // Reset the story experience state
  const resetStoryExperience = useCallback(() => {
    stopAudio();
    stopVoiceInput();
    dispatch({ type: 'RESET_STATE' });
  }, [stopAudio, stopVoiceInput, dispatch]);

  // Context value provided to consumers
  const contextValue: StoryExperienceContextType = {
    state,
    dispatch, // Include dispatch
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
    resetStoryExperience,
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

// export default StoryExperienceContext; // Optional