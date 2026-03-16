import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const BASE_REWARD = 10;
// Keep in sync with REWARDS in grantReward.js
const STREAK_REWARDS = {
  3: 30,
  5: 75,
  10: 200,
  25: 750,
  50: 2000
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { vote_id, was_correct, image_id } = await req.json();

        if (!vote_id || was_correct === undefined) {
            return Response.json({ success: false, error: 'vote_id and was_correct required' }, { status: 400 });
        }

        console.log('[Vote Reward] Processing for user:', user.email, 'Correct:', was_correct);

        // Get or create reward stats
        let stats = await base44.asServiceRole.entities.UserRewardStats.filter({ user_email: user.email });
        if (stats.length === 0) {
            stats = [await base44.asServiceRole.entities.UserRewardStats.create({
                user_email: user.email,
                correct_votes: 0,
                current_vote_streak: 0,
                best_vote_streak: 0,
                lifetime_rewards_earned: 0
            })];
        }
        const rewardStats = stats[0];

        if (!was_correct) {
            // Reset streak
            await base44.asServiceRole.entities.UserRewardStats.update(rewardStats.id, {
                current_vote_streak: 0
            });
            return Response.json({ 
                success: true,
                reward_amount: 0,
                message: 'Streak reset'
            });
        }

        // Update streak
        const newStreak = rewardStats.current_vote_streak + 1;
        const newBestStreak = Math.max(newStreak, rewardStats.best_vote_streak);

        await base44.asServiceRole.entities.UserRewardStats.update(rewardStats.id, {
            correct_votes: rewardStats.correct_votes + 1,
            current_vote_streak: newStreak,
            best_vote_streak: newBestStreak,
            last_vote_reward_at: new Date().toISOString()
        });

        // Calculate rewards
        let totalReward = BASE_REWARD;
        let bonusReward = 0;
        let streakBonusMessage = '';

        // Check for streak bonuses
        if (STREAK_REWARDS[newStreak]) {
            bonusReward = STREAK_REWARDS[newStreak];
            totalReward += bonusReward;
            streakBonusMessage = `${newStreak}-vote streak bonus!`;
        }

        // Grant reward via existing function
        const rewardResult = await base44.functions.invoke('grantReward', {
            reward_type: 'correct_vote',
            amount: totalReward,
            metadata: {
                vote_id,
                image_id,
                streak: newStreak,
                bonus_amount: bonusReward
            }
        });

        console.log('[Vote Reward] Granted:', totalReward, 'tokens. Streak:', newStreak);

        return Response.json({ 
            success: true,
            reward_amount: totalReward,
            base_reward: BASE_REWARD,
            streak_bonus: bonusReward,
            current_streak: newStreak,
            best_streak: newBestStreak,
            streak_message: streakBonusMessage,
            balance: rewardResult.data?.balance
        });

    } catch (error) {
        console.error('[Vote Reward] Error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});