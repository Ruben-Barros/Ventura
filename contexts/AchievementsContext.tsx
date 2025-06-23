import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { Achievement, AchievementToastData, AchievementsContextState, AchievementsContextActions, AchievementsContextValue } from '../types/narration.types'; // Use types defined earlier
import { trackEvent } from '../services/analytics/tracking'; // Assuming analytics service exists
// TODO: Import service to fetch achievement definitions and persist earned status
// import { fetchAchievementDefinition, persistUserAchievement } from '../services/api/achievements';
// import { useAuth } from './AuthContext';

// --- Placeholder Achievement Definitions ---
// In a real app, fetch this from a CMS or define in constants
const achievementRegistry: Record<string, Achievement> = {
    'first_choice': {
        id: 'first_choice',
        name: 'First Step Taken',
        description: 'You made your first choice!',
        // lottieAnimationSource: require('../assets/animations/first_step.json'),
    },
    'chapter_1_complete': {
        id: 'chapter_1_complete',
        name: 'Chapter 1 Complete',
        description: 'You finished the first chapter.',
    },
    // Add more achievements here...
};
// --- End Placeholder ---


const AchievementsContext = createContext<AchievementsContextValue | undefined>(undefined);

const initialState: AchievementsContextState = {
    earnedAchievements: {}, // Store as Record<string, Date>
    pendingAchievementToasts: [], // Queue for toasts
};

type Action =
    | { type: 'GRANT_ACHIEVEMENT'; payload: { id: string; timestamp: Date } }
    | { type: 'QUEUE_TOAST'; payload: AchievementToastData }
    | { type: 'DISMISS_TOAST'; payload: string }; // Payload is achievement ID to dismiss

function achievementsReducer(state: AchievementsContextState, action: Action): AchievementsContextState {
    switch (action.type) {
        case 'GRANT_ACHIEVEMENT':
            // Add to earned achievements if not already present
            if (state.earnedAchievements[action.payload.id]) {
                return state; // Already earned
            }
            return {
                ...state,
                earnedAchievements: {
                    ...state.earnedAchievements,
                    [action.payload.id]: action.payload.timestamp,
                },
            };
        case 'QUEUE_TOAST':
            // Add achievement to the display queue
            return {
                ...state,
                pendingAchievementToasts: [...state.pendingAchievementToasts, action.payload],
            };
        case 'DISMISS_TOAST':
            // Remove the achievement toast with the matching ID from the queue
            return {
                ...state,
                pendingAchievementToasts: state.pendingAchievementToasts.filter(
                    (toastData) => toastData.achievement.id !== action.payload
                ),
            };
        default:
            return state;
    }
}

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(achievementsReducer, initialState);
    // const { user } = useAuth(); // Needed for persisting achievements

    // TODO: Load initial earned achievements for the user when context mounts/user logs in

    const actions: AchievementsContextActions = {
        grantAchievement: useCallback((achievementId: string) => {
            // Check if already earned
            if (state.earnedAchievements[achievementId]) {
                console.log(`[Achievements] Achievement ${achievementId} already earned.`);
                return;
            }

            // Fetch definition (using placeholder registry for now)
            const achievementData = achievementRegistry[achievementId];

            if (achievementData) {
                console.log(`[Achievements] Granting: ${achievementData.name}`);
                const timestamp = new Date();

                // Mark as earned in state
                dispatch({ type: 'GRANT_ACHIEVEMENT', payload: { id: achievementId, timestamp } });

                // Add to toast queue
                dispatch({ type: 'QUEUE_TOAST', payload: { achievement: achievementData, timestamp: timestamp.getTime() } });

                // Track analytics
                trackEvent('achievement_earned', { achievement_id: achievementId, achievement_name: achievementData.name });

                // TODO: Persist earned achievement to backend
                // if (user?.id) {
                //     persistUserAchievement(user.id, achievementId, timestamp);
                // }
            } else {
                console.warn(`[Achievements] Definition not found for ID: ${achievementId}`);
            }
        }, [state.earnedAchievements /*, user?.id */]), // Add user dependency when using persist

        // Internal action called by the toast component when it finishes displaying
        _clearToast: useCallback((achievementId: string) => {
            dispatch({ type: 'DISMISS_TOAST', payload: achievementId });
        }, []),

        // Placeholder for potential logic to display next toast if queueing is implemented
        _displayNextToast: useCallback(() => {
            // This logic would depend on how toasts are managed (e.g., one at a time)
            console.warn("_displayNextToast not implemented");
        }, []),
    };

    // Select the next toast to display (simplest: just the first one in the queue)
    const achievementToDisplay = state.pendingAchievementToasts[0] ?? null;

    const value: AchievementsContextValue = {
        ...state,
        // Override pendingAchievementToasts with just the one to display for the hook consumer
        pendingAchievementToasts: achievementToDisplay ? [achievementToDisplay] : [],
        actions,
    };

    return <AchievementsContext.Provider value={value}>{children}</AchievementsContext.Provider>;
}

export function useAchievements() {
    const context = useContext(AchievementsContext);
    if (context === undefined) {
        throw new Error('useAchievements must be used within an AchievementsProvider');
    }
    return context;
}