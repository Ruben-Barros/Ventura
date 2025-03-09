const { kokoroAudio, EmotionType } = require('./services/audio/KokoroAudioService');

// Demo script to showcase the Kokoro audio experience
async function demoKokoroAudio() {
  console.log('🔊 Starting Kokoro Audio Experience Demo 🔊');
  console.log('------------------------------------------');
  
  // Initialize the Kokoro audio service
  console.log('Initializing Kokoro Audio Service...');
  const initResult = await kokoroAudio.initialize();
  if (!initResult) {
    console.error('Failed to initialize Kokoro Audio Service. Exiting demo.');
    return;
  }
  console.log('✅ Initialization complete!');
  console.log('------------------------------------------');
  
  try {
    // 1. Play intro sound with fade-out effect
    console.log('Step 1: Playing intro sound with fade-out...');
    await kokoroAudio.playIntroSound();
    console.log('✅ Intro sound completed with fade-out');
    console.log('------------------------------------------');
    
    // Wait a bit before next step
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. Start ambient forest sound and narration
    console.log('Step 2: Starting forest ambiance and narration...');
    await kokoroAudio.startAmbiance('forest', { volume: 0.3, fadeInDuration: 2000 });
    console.log('✅ Ambiance started');
    
    // Start narration with neutral emotion
    const storyIntro = "You find yourself standing at the edge of a dense forest. The trees tower above you, their branches forming a canopy that filters the sunlight. A narrow path winds its way into the depths of the woods. The air is crisp and filled with the scent of pine needles and moss.";
    
    console.log('Starting neutral narration...');
    await kokoroAudio.startNarration(storyIntro, EmotionType.NEUTRAL);
    console.log('✅ Neutral narration complete');
    console.log('------------------------------------------');
    
    // Wait a bit before next step
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 3. Add a mystery element with different emotion
    console.log('Step 3: Adding mysterious narration...');
    const mysteryText = "As you peer deeper into the forest, you notice something strange. A faint light seems to flicker between the trees, beckoning you forward. What could it be? And more importantly, do you dare investigate?";
    
    await kokoroAudio.startNarration(mysteryText, EmotionType.MYSTERIOUS);
    console.log('✅ Mysterious narration complete');
    console.log('------------------------------------------');
    
    // Wait a bit before next step
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Pause for choices
    console.log('Step 4: Pausing narration for choices...');
    await kokoroAudio.pauseNarrationForChoices();
    console.log('✅ Narration paused, choice bell played');
    console.log('------------------------------------------');
    
    // Wait as if user is making a choice
    console.log('Waiting for user choice (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 5. Play choice effect and resume narration
    console.log('Step 5: User selected "Investigate the light". Playing effect...');
    await kokoroAudio.playChoiceEffect('magic');
    console.log('✅ Choice effect played');
    
    // Wait a bit before resuming narration
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 6. Resume narration after choice with different emotion
    console.log('Step 6: Resuming narration after choice...');
    const choiceResult = "You decide to investigate the mysterious light. As you move deeper into the forest, the path narrows and the trees seem to close in around you. The light grows stronger, casting eerie shadows on the forest floor. Your heart races with excitement and a touch of fear.";
    
    await kokoroAudio.resumeNarrationAfterChoice(choiceResult, EmotionType.EXCITED);
    console.log('✅ Post-choice narration complete');
    console.log('------------------------------------------');
    
    // 7. Change ambiance for new scene
    console.log('Step 7: Changing ambiance for cave scene...');
    await kokoroAudio.startAmbiance('cave', { volume: 0.4, fadeInDuration: 3000 });
    
    // Add echo effect for cave
    await kokoroAudio.applySceneEffect('echo');
    console.log('✅ Cave ambiance with echo effect started');
    
    // Wait a bit before next narration
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 8. Final narration with fearful emotion
    console.log('Step 8: Final narration with fearful emotion...');
    const finalScene = "The light leads you to the mouth of a cave. Cold air rushes past you from the darkness within. Strange sounds echo from deep inside, almost like whispers calling your name. You shiver involuntarily, but something compels you to enter. What secrets await you in the darkness?";
    
    await kokoroAudio.startNarration(finalScene, EmotionType.FEARFUL);
    console.log('✅ Final narration complete');
    console.log('------------------------------------------');
    
    // Finish demo
    console.log('Demo complete! Cleaning up resources...');
    await kokoroAudio.cleanup();
    console.log('✅ Resources cleaned up');
    console.log('------------------------------------------');
    console.log('🎉 Kokoro Audio Experience Demo completed successfully! 🎉');
    
  } catch (error) {
    console.error('Error during demo:', error);
    await kokoroAudio.cleanup();
  }
}

// Export instead of immediate execution for better control
module.exports = { demoKokoroAudio }; 