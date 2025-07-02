import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { OpenAI } from 'https://deno.land/x/openai/mod.ts'

const openai = new OpenAI(Deno.env.get('OPENAI_API_KEY')!)

serve(async (req) => {
  const { userId, storyId, choiceId } = await req.json()

  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a creative storyteller.' },
      {
        role: 'user',
        content: `Given story ${storyId} and user choice ${choiceId}, generate the next part of the story.`,
      },
    ],
  })

  const storySegment = completion.choices[0].message.content

  return new Response(JSON.stringify({ segmentUrl: storySegment, ttsUrl: '', branchMeta: {} }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
