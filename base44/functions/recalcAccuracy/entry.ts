import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Admin only' }, { status: 403 });
  }

  // Get all votes with image data
  const [votes, images, profiles] = await Promise.all([
    base44.asServiceRole.entities.Vote.list(),
    base44.asServiceRole.entities.Image.list(),
    base44.asServiceRole.entities.UserProfile.list()
  ]);

  // Build image lookup
  const imageMap = {};
  images.forEach(img => { imageMap[img.id] = img; });

  // Accumulate per-user stats
  const userStats = {};
  votes.forEach(vote => {
    if (!vote.user_email || !vote.image_id) return;
    const img = imageMap[vote.image_id];
    if (!img) return;

    if (!userStats[vote.user_email]) {
      userStats[vote.user_email] = { botTotal: 0, botCorrect: 0, humanTotal: 0, humanCorrect: 0 };
    }
    const s = userStats[vote.user_email];
    if (img.is_bot) {
      s.botTotal++;
      if (vote.was_correct) s.botCorrect++;
    } else {
      s.humanTotal++;
      if (vote.was_correct) s.humanCorrect++;
    }
  });

  // Update each profile
  let updated = 0;
  for (const profile of profiles) {
    const s = userStats[profile.user_email];
    if (!s) continue;

    const botAccuracy = s.botTotal > 0 ? Math.round((s.botCorrect / s.botTotal) * 1000) / 10 : 0;
    const humanAccuracy = s.humanTotal > 0 ? Math.round((s.humanCorrect / s.humanTotal) * 1000) / 10 : 0;

    await base44.asServiceRole.entities.UserProfile.update(profile.id, {
      bot_accuracy: botAccuracy,
      human_accuracy: humanAccuracy,
      bot_votes_count: s.botTotal,
      human_votes_count: s.humanTotal
    });
    updated++;
  }

  return Response.json({ success: true, updated });
});