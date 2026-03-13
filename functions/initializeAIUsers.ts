import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ success: false, error: 'Admin only' }, { status: 401 });
        }

        console.log('[AI Init] Creating initial AI users...');

        const aiUsers = [
            { name: 'AICollector_Alpha', behavior: 'collector', risk: 0.3 },
            { name: 'AITrader_Beta', behavior: 'trader', risk: 0.7 },
            { name: 'AICompetitor_Gamma', behavior: 'competitive', risk: 0.8 },
            { name: 'AICasual_Delta', behavior: 'casual', risk: 0.4 },
            { name: 'AIAggressive_Epsilon', behavior: 'aggressive', risk: 0.9 },
            { name: 'AIModerate_Zeta', behavior: 'moderate', risk: 0.5 },
            { name: 'AICollector_Eta', behavior: 'collector', risk: 0.4 },
            { name: 'AITrader_Theta', behavior: 'trader', risk: 0.6 },
            { name: 'AICompetitor_Iota', behavior: 'competitive', risk: 0.7 },
            { name: 'AICasual_Kappa', behavior: 'casual', risk: 0.3 }
        ];

        const created = [];

        for (const ai of aiUsers) {
            const email = `${ai.name.toLowerCase()}@ai.botornot.app`;

            // Check if already exists
            const existing = await base44.asServiceRole.entities.User.filter({ email });
            if (existing.length > 0) {
                console.log(`[AI Init] ${ai.name} already exists`);
                continue;
            }

            // Create user account
            const aiUser = await base44.asServiceRole.entities.User.create({
                email,
                full_name: ai.name,
                role: 'user',
                account_type: 'ai',
                is_ai: true
            });

            // Create AI profile
            await base44.asServiceRole.entities.AIProfile.create({
                user_email: email,
                display_name: ai.name,
                behavior_type: ai.behavior,
                risk_tolerance: ai.risk,
                enabled: true,
                last_action_at: new Date().toISOString()
            });

            // Create user profile
            await base44.asServiceRole.entities.UserProfile.create({
                user_email: email,
                bio: `AI player with ${ai.behavior} strategy`
            });

            // Create wallet
            await base44.asServiceRole.entities.TokenWallet.create({
                user_email: email,
                balance: 2000,
                lifetime_earned: 2000,
                lifetime_spent: 0
            });

            created.push(ai.name);
            console.log(`[AI Init] Created ${ai.name}`);
        }

        console.log('[AI Init] Initialization complete');

        return Response.json({ 
            success: true,
            created: created,
            message: `Created ${created.length} AI users`
        });

    } catch (error) {
        console.error('[AI Init] Error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});