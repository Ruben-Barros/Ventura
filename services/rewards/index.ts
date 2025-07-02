import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

serve(async (req) => {
  const { userId, event } = await req.json()

  // In a real implementation, we would calculate rewards based on the event
  // and update the user's profile.
  // For now, we'll just return a static reward.
  const reward = {
    xp: 10,
    coins: 5,
  }

  return new Response(JSON.stringify({ reward }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
