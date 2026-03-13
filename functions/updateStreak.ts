import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { streak_type } = await req.json();

        if (!streak_type) {
            return Response.json({ success: false, error: 'streak_type required' }, { status: 400 });
        }

        console.log('[Streak] Updating streak:', streak_type, 'for user:', user.email);

        const today = new Date().toISOString().split('T')[0];

        // Get existing streak
        let streaks = await base44.asServiceRole.entities.DailyStreak.filter({
            user_email: user.email,
            streak_type: streak_type
        });

        let streak;
        if (streaks.length === 0) {
            // Create new streak
            streak = await base44.asServiceRole.entities.DailyStreak.create({
                user_email: user.email,
                streak_type: streak_type,
                current_streak: 1,
                best_streak: 1,
                last_activity_date: today
            });
        } else {
            streak = streaks[0];
            const lastDate = new Date(streak.last_activity_date);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Same day, no update
                return Response.json({
                    success: true,
                    current_streak: streak.current_streak,
                    best_streak: streak.best_streak,
                    message: 'Streak already updated today'
                });
            } else if (diffDays === 1) {
                // Consecutive day, increment
                const newStreak = streak.current_streak + 1;
                streak = await base44.asServiceRole.entities.DailyStreak.update(streak.id, {
                    current_streak: newStreak,
                    best_streak: Math.max(newStreak, streak.best_streak),
                    last_activity_date: today
                });
            } else {
                // Streak broken, reset
                streak = await base44.asServiceRole.entities.DailyStreak.update(streak.id, {
                    current_streak: 1,
                    last_activity_date: today
                });
            }
        }

        // Check for streak milestones
        const milestones = [7, 14, 30, 60, 100];
        if (milestones.includes(streak.current_streak)) {
            // Create achievement or reward
            await base44.asServiceRole.entities.SocialFeed.create({
                user_email: user.email,
                activity_type: 'streak_milestone',
                title: `${streak.current_streak}-Day ${streak_type} Streak!`,
                description: `Achieved ${streak.current_streak} consecutive days`,
                metadata: {
                    streak_type,
                    streak_count: streak.current_streak
                }
            });

            // Grant bonus tokens
            const bonusAmount = streak.current_streak * 10;
            await base44.functions.invoke('grantReward', {
                reward_type: 'streak_milestone',
                amount: bonusAmount,
                metadata: {
                    streak_type,
                    streak_count: streak.current_streak
                }
            });
        }

        console.log('[Streak] Updated successfully. Current:', streak.current_streak);

        return Response.json({
            success: true,
            current_streak: streak.current_streak,
            best_streak: streak.best_streak
        });

    } catch (error) {
        console.error('[Streak] Update error:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});