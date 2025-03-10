# Audio Files for Ventura App

This directory contains audio files used throughout the app for sound effects and ambient sounds.

## Required Audio Files

The app is set up to use the following local audio files:

1. `intro_chime.mp3` - A short intro sound played before narration begins
2. `choice_prompt.mp3` - Sound played when a choice is presented to the user
3. `choice_selected.mp3` - Sound played when a choice is selected by the user
4. `forest_ambiance.mp3` - Background ambient sound for forest environment
5. `cave_ambiance.mp3` - Background ambient sound for cave environment
6. `footsteps.mp3` - Sound of footsteps for movement effects

## Adding Your Own Audio Files

If these files are missing, please add your own MP3 files with these exact filenames. You can find free sound effects at sites like:

- [Mixkit](https://mixkit.co/free-sound-effects/)
- [SoundHelix](https://www.soundhelix.com/audio-examples)
- [FreeSound](https://freesound.org/)

## Handling Missing Files

The app has been updated to handle missing audio files gracefully. If a file is missing, the app will continue to function without that specific sound effect, focusing on the core narration functionality using Kokoro TTS.

## Manually Adding Files

To manually add files:
1. Place MP3 files in this directory with the exact names listed above
2. Restart the app to load the new audio files

For the best experience, please ensure all audio files are available.

## Audio Format Guidelines

For optimal performance:

- Use MP3 format for all audio files
- Keep file sizes small (compressed MP3s)
- Ensure ambient tracks are seamlessly loopable
- Normalize volume levels across all audio assets

## Implementation Note

These audio files are used by the `StoryAudioContext` provider to create an immersive storytelling experience. 