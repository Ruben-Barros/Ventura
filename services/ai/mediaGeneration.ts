import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
// import { supabase } from '../../lib/supabase'; // Assuming Supabase client setup
import { VisualAsset } from '../../types/narration.types';

type UUID = string;

const CACHE_DIR = FileSystem.cacheDirectory + 'visuals/';

// Ensure cache directory exists
async function ensureCacheDirExists() {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
      console.log('Creating visual cache directory:', CACHE_DIR);
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
      console.error("Failed to ensure cache directory exists:", error);
  }
}

function getCacheKey(segmentId: UUID, mode: 'image' | 'loop'): string {
    const extension = mode === 'image' ? 'jpg' : 'mp4'; // Adjust extension based on API output
    return `${segmentId}_${mode}.${extension}`;
}

// --- Placeholder Functions ---

async function checkGenerationLimits(userId: UUID, costUnits: number): Promise<boolean> {
    console.warn(`Placeholder: Checking generation limits for user ${userId}, cost ${costUnits}. Assuming allowed.`);
    return true;
}

async function decrementGenerationCredits(userId: UUID, costUnits: number): Promise<void> {
    console.warn(`Placeholder: Decrementing ${costUnits} credits for user ${userId}.`);
}

export async function generateIllustration(prompt: string, seed?: number): Promise<string | null> {
  console.log(`Generating illustration for prompt: ${prompt.substring(0, 50)}...`);

  // --- Actual Implementation (Example using a backend proxy) ---
  try {
    // TODO: Replace with actual backend endpoint URL
    const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'; // Example base URL
    const response = await fetch(`${backendUrl}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header if needed:
        // 'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        prompt: prompt,
        size: "1024x576",
        quality: "standard",
        seed: seed, // Pass seed if provided
        // Potentially pass userId for rate limiting/billing on backend
      }),
    });
    if (!response.ok) {
       const errorBody = await response.text();
       console.error(`Image generation failed: ${response.status} ${response.statusText}`, errorBody);
       throw new Error(`Image generation failed: ${response.statusText}`);
    }
    const result = await response.json();
    if (!result.imageUrl) {
        console.error("Backend response missing imageUrl:", result);
        throw new Error("Invalid response from image generation API");
    }
    console.log("Successfully generated image via backend.");
    return result.imageUrl;
  } catch (error) {
    console.error("Error calling image generation API via backend:", error);
    return null; // Return null on failure
  }
  // --- End Actual Implementation ---

  /*


  // --- Placeholder Implementation ---
  console.log(`Placeholder: Simulating generation for prompt: ${prompt.substring(0, 50)}...`);
  await new Promise(resolve => setTimeout(resolve, 150)); // Simulate network delay
  const placeholders = [
      'https://via.placeholder.com/1024x576.png/0000FF/FFFFFF?text=Generated+Image+1',
      'https://via.placeholder.com/1024x576.png/FF0000/FFFFFF?text=Generated+Image+2',
      'https://via.placeholder.com/1024x576.png/00FF00/FFFFFF?text=Generated+Image+3',
  ];
  return placeholders[Math.floor(Math.random() * placeholders.length)];
   // --- End Placeholder ---
  */
}

export async function generateMotionLoop(prompt: string): Promise<string | null> {
  console.log(`Generating motion loop for prompt: ${prompt.substring(0, 50)}...`);

  // --- Actual Implementation (Example using a backend proxy) ---
  // try {
  //   // Assume backend endpoint handles Runway/Luma API key and call
  //   const response = await fetch('/api/generate-motion-loop', { // Replace with your actual backend endpoint
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       prompt: prompt,
  //       duration_seconds: 5, // Or desired duration
  //       fps: 8, // Or desired fps
  //       // Add other parameters like seed, motion score, etc.
  //     }),
  //   });
  //   if (!response.ok) {
  //     throw new Error(`Motion loop generation failed: ${response.statusText}`);
  //   }
  //   const result = await response.json();
  //   return result.loopUrl; // Assuming backend returns { loopUrl: '...' }
  // } catch (error) {
  //   console.error("Error calling motion loop generation API:", error);
  //   return null;
  // }
  // --- End Actual Implementation ---


  // --- Placeholder Implementation ---
  console.log(`Placeholder: Simulating motion loop generation for prompt: ${prompt.substring(0, 50)}...`);
 // --- Actual Implementation (Example using a backend proxy) ---
  // try {
  //   const backendUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  //   const response = await fetch(`${backendUrl}/api/generate-motion-loop`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       prompt: prompt,
  //       duration_seconds: 5,
  //       fps: 8,
  //     }),
  //   });
  //   if (!response.ok) {
  //      const errorBody = await response.text();
  //      console.error(`Motion loop generation failed: ${response.status} ${response.statusText}`, errorBody);
  //      throw new Error(`Motion loop generation failed: ${response.statusText}`);
  //   }
  //   const result = await response.json();
  //    if (!result.loopUrl) {
  //        console.error("Backend response missing loopUrl:", result);
  //        throw new Error("Invalid response from motion loop generation API");
  //    }
  //   console.log("Successfully generated motion loop via backend.");
  //   return result.loopUrl;
  // } catch (error) {
  //   console.error("Error calling motion loop generation API via backend:", error);
  //   return null;
  // }
 // --- End Actual Implementation ---

 // --- Placeholder Implementation ---
 console.log(`Placeholder: Simulating motion loop generation for prompt: ${prompt.substring(0, 50)}...`);
 await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
 // Return a placeholder video URL (ensure it's a short loop)
 // Using a static image URL as a placeholder for the loop for now
 return 'https://via.placeholder.com/1024x576.png/FFA500/FFFFFF?text=Generated+Loop'; // Replace with actual short loop video for testing if possible
 // --- End Placeholder ---
}

// --- Main Exported Function ---

export async function getOrCreateVisual(
    segmentId: UUID,
    mode: 'image' | 'loop',
    prompt: string,
    userId?: UUID // Needed for COGS check
): Promise<VisualAsset | null> {
  await ensureCacheDirExists();
  const cacheKey = getCacheKey(segmentId, mode);
  const localUri = CACHE_DIR + cacheKey;
  // const storagePath = getStoragePath(segmentId, mode); // For Supabase upload

  // 1. Check Local Cache
  try {
      const localFileInfo = await FileSystem.getInfoAsync(localUri);
      if (localFileInfo.exists) {
        console.log(`Cache hit (local): ${cacheKey}`);
        return { uri: localUri, type: mode, altText: prompt };
      }
  } catch (error) {
      console.error("Error checking local cache:", error);
  }

  // 2. Check Supabase Storage (Placeholder - Skipped)
  // console.log("Placeholder: Skipping Supabase storage check.");

  // 3. COGS Guard (Cost Check)
  const generationCost = mode === 'image' ? 1 : 5; // Example cost units
  if (userId && !(await checkGenerationLimits(userId, generationCost))) {
      console.log(`User ${userId} exceeded generation limits for ${mode}.`);
      return null; // Return null if limits exceeded
  }

  // 4. Generate New Visual
  let generatedUrl: string | null = null;
  try {
    if (mode === 'image') {
      generatedUrl = await generateIllustration(prompt);
    } else if (mode === 'loop') {
      generatedUrl = await generateMotionLoop(prompt);
    }
  } catch (error) {
      console.error(`Error during ${mode} generation for segment ${segmentId}:`, error);
      return null;
  }

  if (!generatedUrl) {
    console.error(`Generation failed to return a URL for ${mode}, segment ${segmentId}.`);
    return null;
  }

  // 5. Process & Cache Result
  try {
    console.log(`Downloading generated ${mode} from ${generatedUrl} to ${localUri}`);
    const downloadResult = await FileSystem.downloadAsync(generatedUrl, localUri);

    if (downloadResult.status === 200) {
      console.log(`Successfully downloaded and cached: ${localUri}`);

      // Placeholder: Skip Supabase upload for now
      // console.log("Placeholder: Skipping Supabase storage upload.");

      // Decrement credits after successful download/cache
      if (userId) {
          await decrementGenerationCredits(userId, generationCost);
      }

      const altText = `AI-generated ${mode}: ${prompt.substring(0, 100)}...`;
      return { uri: localUri, type: mode, altText: altText };
    } else {
      console.error(`Failed to download generated ${mode}. Status: ${downloadResult.status}`);
      await FileSystem.deleteAsync(localUri, { idempotent: true }); // Clean up failed download
      return null;
    }
  } catch (error) {
    console.error(`Error processing/caching generated ${mode}:`, error);
    await FileSystem.deleteAsync(localUri, { idempotent: true }); // Clean up potentially corrupted file
    return null;
  }
}