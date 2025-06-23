import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { AVPlaybackStatus, Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import * as Battery from 'expo-battery';

import {
    NarrationContextState,
    NarrationContextActions,
    NarrationContextValue,
    VisualMode,
    NarrationSegment,
    VisualAsset,
    NarrationChoice,
    // Achievement type is now managed by AchievementsContext
} from '../types/narration.types';
import { Story } from '../types/story.types'; // Import Story type
import { UserPreferences } from '../types/user.types';
import { useAuth } from './AuthContext';
import { useAchievements } from './AchievementsContext'; // Import achievement hook
// TODO: Replace with actual API service imports
import { getStorySegments, getStoryDetails, getNextSegment } from '../services/api/stories';
import { getUserPreferences, updateUserPreference } from '../services/api/users';
import { getOrCreateVisual } from '../services/ai/mediaGeneration';
import { trackEvent } from '../services/analytics/tracking'; // Assuming analytics service exists
import {
    cacheSegmentAssets,
    getCachedSegment,
    getCachedAssetUri,
    downloadAndCacheAsset,
    getAssetFilename, // Import new cache utils
    isSegmentOfflineReady // Import offline check
} from '../utils/cache.utils';

// Define UUID type if not globally available
type UUID = string;

const NarrationContext = createContext<NarrationContextValue | undefined>(undefined);

// Restore full initialState structure to satisfy NarrationContextState type
const initialState: NarrationContextState = {
    storyId: null,
    currentSegment: null,
    nextSegment: null,
    visualMode: 'static', // Default visual mode
    currentVisualAsset: null,
    nextVisualAsset: null, // For pre-loading
    playbackStatus: null,
    isLoadingVisual: false,
    isLoadingAudio: false,
    isChoiceActive: false,
    userKarma: 0, // Default or fetch initial karma for the story/user
    experienceMode: 'calm', // Default experience mode
    isOfflineMode: false,
    isLowBandwidthMode: false,
    isLowPowerMode: false,
    playbackSpeed: 1.0,
    isCaptionsEnabled: false,
    storyDetails: null, // Add story details to state
    lastKarmaChange: null, // Initialize last karma change
    achievementToDisplay: null, // Keep for type conformance, managed by AchievementsContext
    earnedAchievements: new Set<string>(), // Keep for type conformance, managed by AchievementsContext
};

// --- Reducer ---
// Remove achievement-related action types
type Action =
    | { type: 'SET_STORY_LOADING'; payload: boolean }
    | { type: 'SET_STORY_DATA'; payload: { storyId: UUID; storyDetails: Story; initialSegment: NarrationSegment; nextSegment?: NarrationSegment; initialKarma: number; preferences: Pick<UserPreferences, 'visual_mode' | 'experience_mode'> } }
    | { type: 'SET_CURRENT_SEGMENT'; payload: { segment: NarrationSegment; visualAsset: VisualAsset | null } }
    | { type: 'SET_NEXT_SEGMENT'; payload: { segment: NarrationSegment | null; visualAsset: VisualAsset | null } }
    | { type: 'SET_VISUAL_MODE'; payload: VisualMode }
    | { type: 'SET_VISUAL_ASSET'; payload: { asset: VisualAsset | null; target: 'current' | 'next' } }
    | { type: 'SET_LOADING'; payload: { type: 'visual' | 'audio'; isLoading: boolean } }
    | { type: 'SET_PLAYBACK_STATUS'; payload: AVPlaybackStatus }
    | { type: 'SET_PLAYBACK_SPEED'; payload: number }
    | { type: 'SET_CAPTIONS_ENABLED'; payload: boolean }
    | { type: 'TRIGGER_CHOICE' }
    | { type: 'RESOLVE_CHOICE' }
    | { type: 'UPDATE_KARMA'; payload: { change: number; triggerFlash: boolean } } // Include flag to trigger flash
    | { type: 'SET_LAST_KARMA_CHANGE'; payload: number | null } // Action to set/reset the flash trigger
    | { type: 'SET_NETWORK_STATE'; payload: { isOffline: boolean; isLowBandwidth: boolean } }
    | { type: 'SET_POWER_STATE'; payload: boolean }
    | { type: 'RESET_STATE' };


function narrationReducer(state: NarrationContextState, action: Action): NarrationContextState {
    switch (action.type) {
        case 'SET_STORY_LOADING':
            return { ...state, isLoadingAudio: action.payload, isLoadingVisual: action.payload };
        case 'SET_STORY_DATA':
            return {
                ...state,
                storyId: action.payload.storyId,
                storyDetails: action.payload.storyDetails,
                currentSegment: action.payload.initialSegment,
                nextSegment: action.payload.nextSegment ?? null,
                userKarma: action.payload.initialKarma,
                visualMode: action.payload.preferences.visual_mode,
                experienceMode: action.payload.preferences.experience_mode,
                isLoadingAudio: false,
                isLoadingVisual: false,
                // Reset achievement state on new story load (even though managed elsewhere)
                earnedAchievements: new Set<string>(),
                achievementToDisplay: null,
                lastKarmaChange: null,
            };
        case 'SET_CURRENT_SEGMENT':
            return {
                ...state,
                currentSegment: action.payload.segment,
                currentVisualAsset: action.payload.visualAsset,
                isChoiceActive: false,
                isLoadingAudio: false,
                isLoadingVisual: false,
            };
        case 'SET_NEXT_SEGMENT':
             return { ...state, nextSegment: action.payload.segment, nextVisualAsset: action.payload.visualAsset };
        case 'SET_VISUAL_MODE':
            return { ...state, visualMode: action.payload };
        case 'SET_VISUAL_ASSET':
            if (action.payload.target === 'current') {
                return { ...state, currentVisualAsset: action.payload.asset, isLoadingVisual: false };
            } else {
                return { ...state, nextVisualAsset: action.payload.asset };
            }
        case 'SET_LOADING':
            if (action.payload.type === 'visual') {
                return { ...state, isLoadingVisual: action.payload.isLoading };
            } else {
                return { ...state, isLoadingAudio: action.payload.isLoading };
            }
        case 'SET_PLAYBACK_STATUS':
            return { ...state, playbackStatus: action.payload };
        case 'SET_PLAYBACK_SPEED':
            return { ...state, playbackSpeed: action.payload };
        case 'SET_CAPTIONS_ENABLED':
            return { ...state, isCaptionsEnabled: action.payload };
        case 'TRIGGER_CHOICE':
            return { ...state, isChoiceActive: true };
        case 'RESOLVE_CHOICE':
            return { ...state, isChoiceActive: false };
        case 'UPDATE_KARMA':
            return { ...state, userKarma: state.userKarma + action.payload.change };
        case 'SET_LAST_KARMA_CHANGE':
            return { ...state, lastKarmaChange: action.payload };
        case 'SET_NETWORK_STATE':
            return { ...state, isOfflineMode: action.payload.isOffline, isLowBandwidthMode: action.payload.isLowBandwidth };
        case 'SET_POWER_STATE':
            return { ...state, isLowPowerMode: action.payload };
        // Removed achievement cases
        case 'RESET_STATE':
            return initialState; // Use the full initialState now
        default:
            return state;
    }
}

// --- Provider Component ---
export function NarrationProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(narrationReducer, initialState);
    const { user, profile } = useAuth();
    const { actions: achievementActions } = useAchievements(); // Get achievement actions
    const soundRef = useRef<Audio.Sound | null>(null);
    const currentSegmentRef = useRef<NarrationSegment | null>(null);
    const visualModeRef = useRef<VisualMode>(state.visualMode);
    const isUnloadingRef = useRef(false);

    // Update refs when state changes
    useEffect(() => {
        currentSegmentRef.current = state.currentSegment;
        visualModeRef.current = state.visualMode;
    }, [state.currentSegment, state.visualMode]);

    // --- Effects ---

    // Network listener
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
            const isOffline = netState.isConnected === false;
            let isLowBandwidth = false;
            if (!isOffline && netState.type === 'cellular' && netState.details?.cellularGeneration) {
                const gen = netState.details.cellularGeneration;
                isLowBandwidth = (gen === '2g' || gen === '3g');
            }
            dispatch({ type: 'SET_NETWORK_STATE', payload: { isOffline, isLowBandwidth } });
            if (isLowBandwidth && (visualModeRef.current === 'motion-comic' || visualModeRef.current === 'video')) {
                console.log("Low bandwidth detected, downgrading visual mode.");
                actions.setVisualMode('illustrated'); // Use internal actions object
            }
        });
        return () => unsubscribe();
    }, []); // actions removed from deps

    // Battery listener
    useEffect(() => {
        let subscription: Battery.Subscription | null = null;
        const checkBattery = async () => {
            const lowPowerMode = await Battery.isLowPowerModeEnabledAsync();
            dispatch({ type: 'SET_POWER_STATE', payload: lowPowerMode });
            if (lowPowerMode && (visualModeRef.current === 'motion-comic' || visualModeRef.current === 'video')) {
                console.log("Low power mode detected, disabling motion/video modes.");
                actions.setVisualMode('illustrated'); // Use internal actions object
            }
            subscription = Battery.addLowPowerModeListener(({ lowPowerMode }: { lowPowerMode: boolean }) => {
                dispatch({ type: 'SET_POWER_STATE', payload: lowPowerMode });
                 if (lowPowerMode && (visualModeRef.current === 'motion-comic' || visualModeRef.current === 'video')) {
                    console.log("Low power mode detected, disabling motion/video modes.");
                    actions.setVisualMode('illustrated'); // Use internal actions object
                }
            });
        };
        checkBattery();
        return () => {
            subscription?.remove();
        };
    }, []); // actions removed from deps

    // Audio Playback Status Update Handler
    const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (isUnloadingRef.current) return;
        dispatch({ type: 'SET_PLAYBACK_STATUS', payload: status });

        if (status.isLoaded) {
            if (status.didJustFinish) {
                console.log('Segment finished playing.');
                actions._handleSegmentEnd(); // Use internal actions object
            }
            const segment = currentSegmentRef.current;
            if (segment?.choices && segment.durationMs && state.experienceMode === 'dynamic') {
                const timeToChoice = segment.durationMs - 500;
                if (status.positionMillis >= timeToChoice && status.positionMillis < timeToChoice + 150) {
                    console.log('Triggering pre-choice haptic.');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
            }
        } else {
             if (status.error) {
                 console.error("Audio playback error:", status.error);
             }
        }
    }, [state.experienceMode]); // actions removed from deps

    // --- Action Implementations ---

    // Loads audio, checking cache first, then downloading/caching if necessary.
    const loadAudio = useCallback(async (segmentId: UUID, remoteUri: string): Promise<Audio.Sound | null> => {
        dispatch({ type: 'SET_LOADING', payload: { type: 'audio', isLoading: true } });
        let finalUri: string | null = null;
        const localFilename = getAssetFilename(remoteUri, segmentId, 'audio');

        try {
            finalUri = await getCachedAssetUri(localFilename);
            if (!finalUri && !state.isOfflineMode) {
                console.log(`[Cache] Audio for ${segmentId} not found locally, downloading...`);
                finalUri = await downloadAndCacheAsset(remoteUri, localFilename);
            }

            if (finalUri) {
                if (soundRef.current) {
                    await soundRef.current.unloadAsync();
                    soundRef.current = null;
                }
                console.log(`Loading audio from local URI: ${finalUri}`);
                const { sound } = await Audio.Sound.createAsync(
                    { uri: finalUri },
                    { shouldPlay: false, progressUpdateIntervalMillis: 100 },
                    onPlaybackStatusUpdate
                );
                soundRef.current = sound;
                dispatch({ type: 'SET_LOADING', payload: { type: 'audio', isLoading: false } });
                console.log('Audio loaded successfully.');
                return sound;
            } else {
                throw new Error(`Audio not available locally and could not be downloaded (Offline: ${state.isOfflineMode})`);
            }
        } catch (error) {
            console.error(`Error loading audio for segment ${segmentId}:`, error);
            dispatch({ type: 'SET_LOADING', payload: { type: 'audio', isLoading: false } });
            return null;
        }
    }, [state.isOfflineMode, onPlaybackStatusUpdate]);

    // Fetches or generates the visual asset, checking cache first, then generating/downloading/caching.
    const loadVisualAsset = useCallback(async (segment: NarrationSegment, mode: VisualMode): Promise<VisualAsset | null> => {
        if (mode === 'static' || !segment.prompt) {
             if (mode !== 'static' && !segment.prompt) console.warn(`Segment ${segment.id} has no prompt for visual generation.`);
            return null;
        }

        const visualType = mode === 'illustrated' ? 'image' : 'loop';
        const placeholderRemoteUrl = `http://placeholder.com/${segment.id}_${visualType}.asset`;
        const localFilename = getAssetFilename(placeholderRemoteUrl, segment.id, 'visual');
        const currentUserId = user?.id ?? 'test-user-id'; // Use temp ID if user is null

        try {
            let localUri = await getCachedAssetUri(localFilename);
            if (localUri) {
                console.log(`[Cache] Visual asset found locally for segment ${segment.id}: ${localUri}`);
                return { uri: localUri, type: visualType, altText: `Cached visual for: ${segment.prompt.substring(0, 50)}...` };
            }

            if (state.isOfflineMode) {
                console.log(`[Cache] Visual asset for segment ${segment.id} not cached and offline.`);
                return null;
            }

            if (state.isLowBandwidthMode && (mode === 'motion-comic' || mode === 'video')) return null;
            if (state.isLowPowerMode && (mode === 'motion-comic' || mode === 'video')) return null;

            console.log(`Requesting visual asset generation: segment=${segment.id}, type=${visualType}`);
            const remoteAsset = await getOrCreateVisual(segment.id, visualType, segment.prompt, currentUserId); // Pass user ID

            if (!remoteAsset || !remoteAsset.uri || !remoteAsset.uri.startsWith('http')) {
                 console.warn(`Failed to get remote URL for visual asset for segment ${segment.id}, mode ${mode}.`);
                 return null;
            }

            localUri = await downloadAndCacheAsset(remoteAsset.uri, localFilename);

            if (localUri) {
                return { uri: localUri, type: visualType, altText: remoteAsset.altText ?? `Visual for: ${segment.prompt.substring(0, 50)}...` };
            } else {
                console.warn(`Failed to download/cache visual asset for segment ${segment.id}, mode ${mode}.`);
                return null;
            }

        } catch (error) {
            console.error(`Error in loadVisualAsset for segment ${segment.id}:`, error);
            return null;
        }
    }, [user?.id, state.isLowBandwidthMode, state.isLowPowerMode, state.isOfflineMode]);


    // Loads audio and visual assets for a segment and updates the state.
    const loadSegment = useCallback(async (segment: NarrationSegment | null, target: 'current' | 'next', currentVisualMode: VisualMode) => {
        if (!segment) {
            if (target === 'next') {
                dispatch({ type: 'SET_NEXT_SEGMENT', payload: { segment: null, visualAsset: null } });
            }
            return;
        }

        console.log(`Loading segment ${segment.segmentOrder} (${segment.id}) for target: ${target}`);

        let audioPromise: Promise<Audio.Sound | null> = Promise.resolve(null);
        let visualPromise: Promise<VisualAsset | null> = Promise.resolve(null);

        if (target === 'current') {
            dispatch({ type: 'SET_LOADING', payload: { type: 'audio', isLoading: true } });
            dispatch({ type: 'SET_LOADING', payload: { type: 'visual', isLoading: true } });
            audioPromise = loadAudio(segment.id, segment.audioUri);
            visualPromise = loadVisualAsset(segment, currentVisualMode);
        } else {
            visualPromise = loadVisualAsset(segment, currentVisualMode);
        }

        const [sound, visualAsset] = await Promise.all([audioPromise, visualPromise]);

        if (target === 'current') {
            const audioLoaded = !!sound;
            if (audioLoaded) {
                dispatch({ type: 'SET_CURRENT_SEGMENT', payload: { segment, visualAsset } });
                trackEvent('segment_start', { story_id: state.storyId, segment_id: segment.id, segment_order: segment.segmentOrder });
                await actions.play(); // Use internal actions object
                cacheSegmentAssets(segment, visualAsset ?? undefined); // Pass undefined if null
            } else {
                console.error(`Failed to load audio for current segment ${segment.id}`);
                dispatch({ type: 'SET_LOADING', payload: { type: 'audio', isLoading: false } });
                dispatch({ type: 'SET_LOADING', payload: { type: 'visual', isLoading: false } });
            }
        } else {
            dispatch({ type: 'SET_NEXT_SEGMENT', payload: { segment, visualAsset } });
            console.log(`Pre-loaded next segment ${segment.segmentOrder} with visual: ${visualAsset?.uri ?? 'none'}`);
        }

    }, [loadAudio, loadVisualAsset, state.storyId]); // actions removed from deps


    // Define actions object separately to avoid direct dependency cycle in callbacks
    // Note: We need to cast the final object to NarrationContextActions to satisfy the type
    const actions = {
        loadStory: async (storyId: UUID) => {
            console.log(`Loading story: ${storyId}`);
            dispatch({ type: 'SET_STORY_LOADING', payload: true });
            
            // Create mock story data
            const mockStory: Story = {
                id: storyId,
                title: 'Demo Story',
                description: 'A sample story for testing',
                cover_image_url: 'https://via.placeholder.com/300',
                base_narrative: '',
                author_id: 'test-author',
                genre_ids: ['fantasy'],
                estimated_length_minutes: 15,
                is_featured: false,
                is_multiplayer: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                avg_rating: 4.5,
                play_count: 0
            };
            
            // Create mock initial segment
            const mockSegment: NarrationSegment = {
                id: 'segment-1',
                storyId: storyId,
                segmentOrder: 1,
                content: 'This is the beginning of the story...',
                audioUri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                durationMs: 5000,
                choices: []
            };
            
            dispatch({
                type: 'SET_STORY_DATA',
                payload: { 
                    storyId,
                    storyDetails: mockStory,
                    initialSegment: mockSegment,
                    nextSegment: undefined,
                    initialKarma: 0,
                    preferences: {
                        visual_mode: 'static',
                        experience_mode: 'calm'
                    }
                }
            });
            
            // Load the initial segment
            await loadSegment(mockSegment, 'current', 'static');
        },
        play: async () => console.warn("play (placeholder)"),
        pause: async () => console.warn("pause (placeholder)"),
        seek: async () => console.warn("seek (placeholder)"),
        setPlaybackSpeed: async () => console.warn("setPlaybackSpeed (placeholder)"),
        toggleCaptions: () => console.warn("toggleCaptions (placeholder)"),
        setVisualMode: async () => console.warn("setVisualMode (placeholder)"),
        makeChoice: async () => console.warn("makeChoice (placeholder)"),
        retryLoadAsset: () => console.warn("retryLoadAsset (placeholder)"),
        _handleSegmentEnd: () => console.warn("_handleSegmentEnd (placeholder)"),
        _updatePlaybackStatus: () => console.warn("_updatePlaybackStatus (placeholder)"),
        _setVisualAsset: () => console.warn("_setVisualAsset (placeholder)"),
        _setLoadingState: () => console.warn("_setLoadingState (placeholder)"),
        _updateKarma: () => console.warn("_updateKarma (placeholder)"),
        _setNetworkState: () => console.warn("_setNetworkState (placeholder)"),
        _setPowerState: () => console.warn("_setPowerState (placeholder)"),
        _clearLastKarmaChange: () => console.warn("_clearLastKarmaChange (placeholder)"),
        _toggleMicInput: () => console.warn("_toggleMicInput (placeholder)"),
    } as NarrationContextActions;

    // Cleanup effect on unmount
    useEffect(() => {
        return () => {
            console.log('Unmounting NarrationProvider, unloading audio.');
            isUnloadingRef.current = true;
            soundRef.current?.unloadAsync();
            soundRef.current = null;
            dispatch({ type: 'RESET_STATE' });
        };
    }, []);

    // Recalculate value object to include the correctly defined actions
    const value = { ...state, actions };

    return <NarrationContext.Provider value={value}>{children}</NarrationContext.Provider>;
}

// --- Hook ---
export function useNarration() {
    const context = useContext(NarrationContext);
    if (context === undefined) {
        throw new Error('useNarration must be used within a NarrationProvider');
    }
    return context;
}
