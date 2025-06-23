# StoryPlayerScreen Implementation Plan

## Core Architecture
### Video Playback System
- `expo-av` Video component with adaptive bitrate
- Prefetch next segment 2s before current ends
- Auto-pause at choice points with 15% darken

### Choice Handling
- `ChoiceSheet` slide-up animation (Reanimated spring)
- 10s radial countdown with jitter effect after 7s
- Voice input via `expo-speech` recognition
- Freeze-frame + "Path Locked" stamp on selection

### Visual Modes
| Mode | Components | Assets |
|------|------------|--------|
| Static | Background color | None |
| Illustrated | Generated images | `mediaGeneration` service |
| Motion-Comic | `MotionLoopPlayer` | Looping videos |
| Video | Full-screen player | Cinematic assets |

### HUD Components
- **Score**: Rolling odometer (Reanimated)
- **Karma**: 3-segment color-coded bar
- **Streak**: Animated SVG flame
- **Mystery Chest**: Flashing icon when bonus available

## Dopamine Triggers
1. **Variable Rewards**  
   - 10% chance of bonus points on choice  
   - Confetti + "shing" sound

2. **Zeigarnik Tension**  
   - Pulsing progress ring ("0/5 CHAPTERS LEFT")

3. **Endowed Progress**  
   - Initial 20% progress fill ("Welcome Boost")

4. **FOMO Timer**  
   - Red wobble animation increasing in frequency

5. **Social Proof**  
   - Realtime emoji bursts via Supabase  
   - "26 players picked this" display

6. **Investment Loop**  
   - Local stat tracking  
   - "Continue to lock in XP" mosaic on exit

7. **Sensory Layering**  
   - Haptic: `ImpactFeedbackStyle.Heavy`  
   - Audio: Stereo "click-pop"  
   - Visual: 80ms scale-up animation

## Performance Optimization
- **Animations**: Reanimated + Moti for 60fps
- **Memory**: < 200MB via asset unloading
- **Caching**: Pre-cache next 3 segments
- **Monitoring**: `expo-performance` counters

## Gamification
- **Achievements**: Integrate with `AchievementsContext`
- **Karma**: Visual feedback on changes
- **Offline**: "Download Next 3 Segments" option
- **Notifications**: `expo-notifications` for bonus XP

## Quality Assurance
### Type Safety
- Strict TypeScript (`tsc --noEmit`)
- Supabase typed queries
- Zero `any` types

### Testing
- 85% unit test coverage (Jest)
- End-to-end with Detox
- Performance budgets:
  - TTI < 1500ms (Pixel 5)
  - 0 dropped frames in animations

## Implementation Sequence
1. Core video playback system
2. Choice handling mechanics
3. Visual mode integrations
4. Dopamine trigger implementations
5. Performance optimizations
6. Gamification hooks
7. QA and profiling

> **Next Step**: Switch to Code mode for implementation