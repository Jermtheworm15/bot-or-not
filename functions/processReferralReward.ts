import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const SIGNUP_REWARD = 200;
const ACTIVATION_REWARD = 500;
const ACTIVATION_THRESHOLD = 5; // actions needed for activation

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { referral_code, action_type } = await req.json();

        console.log('[Referral] Processing:', action_type, 'Code:', referral_code);

        // Find referral
        const referrals = await base44.asServiceRole.entities.Referral.filter({ referral_code });
        
        if (referrals.length === 0) {
            return Response.json({ success: false, error: 'Referral not found' }, { status: 404 });
        }

        const referral = referrals[0];

        // Prevent self-referral
        if (referral.referrer_email === user.email) {
            return Response.json({ success: false, error: 'Cannot refer yourself' }, { status: 400 });
        }

        let rewardGranted = false;
        let rewardAmount = 0;
        let message = '';

        // Handle signup reward
        if (action_type === 'signup' && !referral.rewarded_signup) {
            await base44.asServiceRole.entities.Referral.update(referral.id, {
                referred_email: user.email,
                status: 'signed_up',
                rewarded_signup: true
            });

            // Grant signup reward to referrer
            await base44.functions.invoke('grantReward', {
                reward_type: 'referral_signup',
                amount: SIGNUP_REWARD,
                metadata: {
                    referral_id: referral.id,
                    referred_user: user.email
                }
            });

            rewardGranted = true;
            rewardAmount = SIGNUP_REWARD;
            message = 'Signup reward granted to referrer';

            console.log('[Referral] Signup reward granted');
        }

        // Handle activation reward
        if (action_type === 'activation' && !referral.rewarded_activation) {
            const newActionCount = referral.activation_actions + 1;

            await base44.asServiceRole.entities.Referral.update(referral.id, {
                activation_actions: newActionCount
            });

            if (newActionCount >= ACTIVATION_THRESHOLD) {
                await base44.asServiceRole.entities.Referral.update(referral.id, {
                    status: 'activated',
                    rewarded_activation: true
                });

                // Grant activation reward to referrer
                await base44.functions.invoke('grantReward', {
                    reward_type: 'referral_activation',
                    amount: ACTIVATION_REWARD,
                    metadata: {
                        referral_id: referral.id,
                        referred_user: user.email
                    }
                });

                // Update referrer stats
                const referrerStats = await base44.asServiceRole.entities.UserRewardStats.filter({ 
                    user_email: referral.referrer_email 
                });
                
                if (referrerStats.length > 0) {
                    await base44.asServiceRole.entities.UserRewardStats.update(referrerStats[0].id, {
                        referral_count: referrerStats[0].referral_count + 1
                    });
                }

                rewardGranted = true;
                rewardAmount = ACTIVATION_REWARD;
                message = 'Activation reward granted to referrer';

                console.log('[Referral] Activation reward granted');
            }
        }

        return Response.json({ 
            success: true,
            reward_granted: rewardGranted,
            reward_amount: rewardAmount,
            message: message,
            activation_progress: referral.activation_actions
        });

    } catch (error) {
        console.error('[Referral] Error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});