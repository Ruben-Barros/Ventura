import { supabase } from '../../lib/supabase'; // Import your Supabase client
import { Story, StorySegment, StoryChoice } from '../../types/story.types'; // Import types
import { NarrationSegment } from '../../types/narration.types'; // Import Narration types

type UUID = string;

// Helper function to convert DB segment/choice types to NarrationSegment
function mapToNarrationSegment(segment: StorySegment, choices: StoryChoice[] | null): NarrationSegment {
    // TODO: Fetch actual audio URI and duration, potentially from another table or service
    const dummyAudioUri = `https://example.com/audio/${segment.id}.mp3`;
    const dummyDurationMs = Math.floor(Math.random() * 5000) + 3000; // Random 3-8 seconds
    const dummyPrompt = `Placeholder prompt for segment ${segment.segment_order}: ${segment.content.substring(0, 50)}...`;

    return {
        id: segment.id,
        storyId: segment.story_id,
        content: segment.content,
        audioUri: dummyAudioUri, // Replace with actual audio URI
        durationMs: dummyDurationMs, // Replace with actual duration
        prompt: dummyPrompt, // Replace with actual prompt if stored, or generate if needed
        segmentOrder: segment.segment_order,
        choices: choices?.map(c => ({
            id: c.id,
            segmentId: c.segment_id,
            choiceText: c.choice_text,
            nextSegmentId: c.next_segment_id,
            // TODO: Add karma effect if stored in DB
            karmaEffect: Math.random() > 0.66 ? 'positive' : Math.random() > 0.33 ? 'negative' : 'neutral', // Random karma for placeholder
            decisionTimeSeconds: 10, // Example decision time
        })) ?? [],
    };
}

export const getStorySegments = async (storyId: UUID, initialSegmentId?: UUID | null) => {
    console.log(`API: Fetching segments for story ${storyId}, starting from ${initialSegmentId}`);

    // TODO: Implement logic to fetch user progress to determine the actual starting segment if initialSegmentId is null
    const segmentIdToFetch = initialSegmentId ?? 'segment-1-placeholder'; // Need actual logic here

    try {
        // --- Placeholder Logic ---
        console.log(`Placeholder: Fetching segments for story ${storyId}, starting from ${initialSegmentId}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        const dummySegment = {
            id: initialSegmentId || 'segment-1-dummy', story_id: storyId, content: 'Dummy Segment 1', segment_order: 1,
            // Add other required fields from StorySegment type with dummy values
            parent_segment_id: null, created_at: new Date().toISOString(), created_by: null,
        };
        const dummyChoice = {
            id: 'choice-1a-dummy', segment_id: dummySegment.id, choice_text: 'Go Left (Dummy)', next_segment_id: 'segment-2a-dummy', created_at: new Date().toISOString(),
        };
        const dummyNextSegment = {
             id: 'segment-2a-dummy', story_id: storyId, content: 'Dummy Segment 2a', segment_order: 2,
             parent_segment_id: dummySegment.id, created_at: new Date().toISOString(), created_by: null,
        };
        const currentNarrationSegment = mapToNarrationSegment(dummySegment, [dummyChoice]);
        const nextNarrationSegment = mapToNarrationSegment(dummyNextSegment, []);
        const initialKarma = 0;
        return { currentSegment: currentNarrationSegment, nextSegment: nextNarrationSegment, initialKarma };
        // --- End Placeholder ---

        /* --- Original Supabase Logic ---
        const { data: segmentData, error: segmentError } = await supabase
            .from('story_segments')
            .select('*')
            .eq('story_id', storyId)
            .eq(initialSegmentId ? 'id' : 'segment_order', initialSegmentId ?? 1) // Fetch by ID or order 1 if starting
            .single();

        if (segmentError || !segmentData) throw segmentError || new Error('Initial segment not found');

        const { data: choicesData, error: choicesError } = await supabase
            .from('story_choices')
            .select('*')
            .eq('segment_id', segmentData.id);

        if (choicesError) console.warn("Error fetching choices:", choicesError.message); // Non-critical if no choices

        const currentNarrationSegment = mapToNarrationSegment(segmentData, choicesData);

        // Fetch the *next* segment (assuming linear progression or first choice path for now)
        // This needs more robust logic based on actual story structure/choices
        let nextNarrationSegment: NarrationSegment | null = null;
        const nextSegmentId = choicesData?.[0]?.next_segment_id ?? null; // Example: Prefetch first choice path
        let nextSegmentOrder = segmentData.segment_order + 1;

        if (nextSegmentId) {
             const { data: nextSegData, error: nextSegError } = await supabase
                .from('story_segments')
                .select('*')
                .eq('id', nextSegmentId)
                .single();
             if (nextSegData && !nextSegError) {
                 const { data: nextChoicesData } = await supabase.from('story_choices').select('*').eq('segment_id', nextSegData.id);
                 nextNarrationSegment = mapToNarrationSegment(nextSegData, nextChoicesData);
             }
        } else {
             const { data: nextSegDataByOrder, error: nextSegByOrderError } = await supabase
                .from('story_segments')
                .select('*')
                .eq('story_id', storyId)
                .eq('segment_order', nextSegmentOrder)
                .single();
             if (nextSegDataByOrder && !nextSegByOrderError) {
                 const { data: nextChoicesData } = await supabase.from('story_choices').select('*').eq('segment_id', nextSegDataByOrder.id);
                 nextNarrationSegment = mapToNarrationSegment(nextSegDataByOrder, nextChoicesData);
             }
        }


        // TODO: Fetch initial user karma for this story if tracked separately
        const initialKarma = 0;

        return {
            currentSegment: currentNarrationSegment,
            nextSegment: nextNarrationSegment,
            initialKarma: initialKarma,
        };
        */ // End Original Supabase Logic

    } catch (error: any) {
        console.error("Error fetching story segments:", error.message);
        // Return nulls or throw error based on desired handling
        return { currentSegment: null, nextSegment: null, initialKarma: 0 };
    }
};

export const getStoryDetails = async (storyId: UUID): Promise<Story | null> => {
    console.log(`API: Fetching details for story ${storyId}`);
    try {
        // --- Placeholder Logic ---
        console.log(`Placeholder: Fetching details for story ${storyId}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
            id: storyId,
            title: 'Placeholder Story Title',
            cover_image_url: 'https://via.placeholder.com/300x400.png/CCCCCC/FFFFFF?text=Story+Cover',
            // Add other required fields from Story type with dummy values
            description: 'A placeholder description.', base_narrative: '', author_id: null, genre_ids: [], estimated_length_minutes: 10, is_featured: false, is_multiplayer: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), avg_rating: 0, play_count: 0,
        } as Story;
        // --- End Placeholder ---

        /* --- Original Supabase Logic ---
        const { data, error } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (error) throw error;
        return data as Story;
        */ // End Original Supabase Logic
    } catch (error: any) {
        console.error("Error fetching story details:", error.message);
        return null;
    }
};

export const getNextSegment = async (storyId: UUID, chosenSegmentId: UUID, userId?: UUID) => {
    console.log(`API: Fetching next segment after ${chosenSegmentId} for story ${storyId}`);

    // TODO: Persist user choice/progress if needed (e.g., update user_story_progress table)

    try {
        // --- Placeholder Logic ---
        console.log(`Placeholder: Fetching next segment after ${chosenSegmentId} for story ${storyId}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        const dummyNextSeg = {
            id: chosenSegmentId, story_id: storyId, content: `Dummy Content for ${chosenSegmentId}`, segment_order: 2,
            parent_segment_id: 'segment-1-dummy', created_at: new Date().toISOString(), created_by: null,
        };
         const dummyFollowingSeg = {
             id: `segment-${dummyNextSeg.segment_order + 1}-dummy`, // Corrected property name
             story_id: storyId,
             content: `Dummy Content for segment ${dummyNextSeg.segment_order + 1}`, // Corrected property name
             segment_order: dummyNextSeg.segment_order + 1, // Corrected property name
             parent_segment_id: dummyNextSeg.id, created_at: new Date().toISOString(), created_by: null,
         };
        const currentNarrationSegment = mapToNarrationSegment(dummyNextSeg, []);
        const followingNarrationSegment = mapToNarrationSegment(dummyFollowingSeg, []);
        return { currentSegment: currentNarrationSegment, nextSegment: followingNarrationSegment };
        // --- End Placeholder ---

        /* --- Original Supabase Logic ---
        const { data: chosenSegData, error: chosenSegError } = await supabase
            .from('story_segments')
            .select('*')
            .eq('id', chosenSegmentId)
            .single();

        if (chosenSegError || !chosenSegData) throw chosenSegError || new Error('Chosen segment not found');

        const { data: choicesData, error: choicesError } = await supabase
            .from('story_choices')
            .select('*')
            .eq('segment_id', chosenSegData.id);

        if (choicesError) console.warn("Error fetching choices for next segment:", choicesError.message);

        const currentNarrationSegment = mapToNarrationSegment(chosenSegData, choicesData);

        // Fetch the *following* segment (after the chosen one)
        let followingNarrationSegment: NarrationSegment | null = null;
        const nextSegmentId = choicesData?.[0]?.next_segment_id ?? null; // Example: Prefetch first choice path
        let nextSegmentOrder = chosenSegData.segment_order + 1;

         if (nextSegmentId) {
             const { data: followingSegData, error: followingSegError } = await supabase
                .from('story_segments')
                .select('*')
                .eq('id', nextSegmentId)
                .single();
             if (followingSegData && !followingSegError) {
                 const { data: followingChoicesData } = await supabase.from('story_choices').select('*').eq('segment_id', followingSegData.id);
                 followingNarrationSegment = mapToNarrationSegment(followingSegData, followingChoicesData);
             }
        } else {
             const { data: followingSegDataByOrder, error: followingSegByOrderError } = await supabase
                .from('story_segments')
                .select('*')
                .eq('story_id', storyId)
                .eq('segment_order', nextSegmentOrder)
                .single();
             if (followingSegDataByOrder && !followingSegByOrderError) {
                 const { data: followingChoicesData } = await supabase.from('story_choices').select('*').eq('segment_id', followingSegDataByOrder.id);
                 followingNarrationSegment = mapToNarrationSegment(followingSegDataByOrder, followingChoicesData);
             }
        }

        return {
            currentSegment: currentNarrationSegment, // The segment resulting from the choice
            nextSegment: followingNarrationSegment, // The segment after the chosen one (for preloading)
        };
        */ // End Original Supabase Logic

    } catch (error: any) {
        console.error("Error fetching next story segment:", error.message);
        return { currentSegment: null, nextSegment: null };
    }
};