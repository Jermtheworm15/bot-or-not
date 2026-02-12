import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile and voting history
    const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (profiles.length === 0) {
      return Response.json({ error: 'User profile not found' }, { status: 404 });
    }
    
    const userProfile = profiles[0];
    const votes = await base44.entities.Vote.filter({ user_email: user.email });
    const videoVotes = await base44.entities.VideoVote.filter({ user_email: user.email });
    
    // Calculate performance metrics
    const totalVotes = votes.length + videoVotes.length;
    const correctVotes = votes.filter(v => v.was_correct).length + videoVotes.filter(v => v.was_correct).length;
    const accuracy = totalVotes > 0 ? (correctVotes / totalVotes * 100).toFixed(1) : 0;
    
    // Use AI to generate personalized challenges
    const prompt = `You are a gamification expert. Based on the following user performance data, generate 3 personalized challenges that will help them improve and stay engaged:

User Stats:
- Total votes: ${totalVotes}
- Accuracy: ${accuracy}%
- Best streak: ${userProfile.perfect_streak || 0}
- Current tier: ${userProfile.tier || 'bronze'}
- Points: ${userProfile.points || 0}
- Daily votes: ${userProfile.daily_votes || 0}

Generate challenges that are:
1. Achievable but challenging based on their current skill level
2. Varied (covering different metrics: accuracy, streak, speed, volume)
3. Tiered appropriately (bronze for beginners, silver/gold/platinum for advanced)

Return as JSON array with this exact structure:
{
  "challenges": [
    {
      "title": "Challenge name",
      "description": "Motivating description",
      "metric": "votes|accuracy|streak|speed",
      "goal": <number>,
      "tier": "bronze|silver|gold|platinum",
      "reward_points": <number>,
      "reward_badge": "badge_id_or_null"
    }
  ]
}`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          challenges: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                metric: { type: "string" },
                goal: { type: "number" },
                tier: { type: "string" },
                reward_points: { type: "number" },
                reward_badge: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Create personalized challenges
    const createdChallenges = [];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7); // 7 days from now

    for (const challenge of response.challenges) {
      const created = await base44.asServiceRole.entities.Challenge.create({
        title: challenge.title,
        description: challenge.description,
        type: 'personalized',
        goal: challenge.goal,
        metric: challenge.metric,
        reward_points: challenge.reward_points,
        reward_badge: challenge.reward_badge === 'null' ? null : challenge.reward_badge,
        tier: challenge.tier,
        active: true,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        user_email: user.email
      });
      createdChallenges.push(created);
    }

    return Response.json({ 
      success: true,
      challenges: createdChallenges 
    });
  } catch (error) {
    console.error('Error generating challenges:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});