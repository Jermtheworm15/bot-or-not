import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const DAILY_REWARDS = [100, 150, 200, 300, 500, 750, 1000]; // 7-day cycle

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Daily Reward] Claiming for user:', user.email);

        const today = new Date().toISOString().split('T')[0];

        // Check if already claimed today
        const existing = await base44.asServiceRole.entities.DailyReward.filter({
            user_email: user.email,
            reward_date: today
        });

        if (existing.length > 0 && existing[0].claimed) {
            return Response.json({
                success: false,
                error: 'Daily reward already claimed today'
            }, { status: 400 });
        }

        // Get login streak
        const loginStreaks = await base44.asServiceRole.entities.DailyStreak.filter({
            user_email: user.email,
            streak_type: 'login'
        });

        const dayNumber = loginStreaks.length > 0 
            ? (loginStreaks[0].current_streak % 7) || 7
            : 1;

        const rewardAmount = DAILY_REWARDS[dayNumber - 1];

        // Create or update reward record
        if (existing.length > 0) {
            await base44.asServiceRole.entities.DailyReward.update(existing[0].id, {
                claimed: true,
                token_amount: rewardAmount
            });
        } else {
            await base44.asServiceRole.entities.DailyReward.create({
                user_email: user.email,
                reward_date: today,
                day_number: dayNumber,
                token_amount: rewardAmount,
                claimed: true
            });
        }

        // Grant reward
        await base44.functions.invoke('grantReward', {
            reward_type: 'daily_active',
            amount: rewardAmount,
            metadata: {
                day_number: dayNumber
            }
        });

        console.log('[Daily Reward] Granted:', rewardAmount, 'tokens');

        return Response.json({
            success: true,
            reward_amount: rewardAmount,
            day_number: dayNumber,
            next_reward: DAILY_REWARDS[dayNumber % 7]
        });

    } catch (error) {
        console.error('[Daily Reward] Error:', error);
        return Response.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
});