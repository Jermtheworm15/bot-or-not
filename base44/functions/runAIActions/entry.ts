import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ success: false, error: 'Admin only' }, { status: 401 });
        }

        console.log('[AI Actions] Running AI user actions...');

        // Get all active AI profiles
        const aiProfiles = await base44.asServiceRole.entities.AIProfile.filter({ enabled: true });
        
        const actions = [];

        for (const profile of aiProfiles) {
            try {
                // Random chance to perform action based on frequency
                const shouldAct = Math.random() < 0.3;
                if (!shouldAct) continue;

                const actionType = Math.random();
                
                // Vote on images (40% chance)
                if (actionType < 0.4) {
                    const images = await base44.asServiceRole.entities.Image.list('?random', 1);
                    if (images.length > 0) {
                        const image = images[0];
                        const guess = Math.random() < 0.6 ? (image.is_bot ? 'bot' : 'human') : (image.is_bot ? 'human' : 'bot');
                        
                        await base44.asServiceRole.entities.Vote.create({
                            image_id: image.id,
                            guess: guess,
                            was_correct: guess === (image.is_bot ? 'bot' : 'human'),
                            user_email: profile.user_email
                        });

                        await base44.asServiceRole.entities.AnalyticsEvent.create({
                            event_type: 'vote_submitted',
                            user_email: profile.user_email,
                            actor_type: 'ai',
                            image_id: image.id,
                            metadata: { guess, correct: guess === (image.is_bot ? 'bot' : 'human') }
                        });

                        actions.push({ ai: profile.display_name, action: 'voted' });
                        console.log(`[AI Actions] ${profile.display_name} voted on image`);
                    }
                }
                // Join tournament (20% chance)
                else if (actionType < 0.6) {
                    const tournaments = await base44.asServiceRole.entities.Tournament.filter({ status: 'open' });
                    if (tournaments.length > 0) {
                        const tournament = tournaments[0];
                        const participants = tournament.participants || [];
                        
                        if (!participants.some(p => p.email === profile.user_email) && participants.length < tournament.max_participants) {
                            const wallet = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: profile.user_email });
                            
                            if (wallet.length > 0 && wallet[0].balance >= tournament.entry_fee) {
                                participants.push({
                                    email: profile.user_email,
                                    name: profile.display_name,
                                    joined_at: new Date().toISOString(),
                                    score: 0
                                });

                                await base44.asServiceRole.entities.Tournament.update(tournament.id, {
                                    participants,
                                    prize_pool: (tournament.prize_pool || 0) + tournament.entry_fee
                                });

                                await base44.asServiceRole.entities.TokenWallet.update(wallet[0].id, {
                                    balance: wallet[0].balance - tournament.entry_fee
                                });

                                await base44.asServiceRole.entities.AnalyticsEvent.create({
                                    event_type: 'tournament_joined',
                                    user_email: profile.user_email,
                                    actor_type: 'ai',
                                    tournament_id: tournament.id
                                });

                                actions.push({ ai: profile.display_name, action: 'joined tournament' });
                                console.log(`[AI Actions] ${profile.display_name} joined tournament`);
                            }
                        }
                    }
                }
                // Marketplace action (20% chance)
                else if (actionType < 0.8) {
                    const listings = await base44.asServiceRole.entities.MarketplaceListing.filter({ status: 'active' });
                    if (listings.length > 0 && profile.risk_tolerance > 0.5) {
                        const listing = listings[Math.floor(Math.random() * listings.length)];
                        const wallet = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: profile.user_email });
                        
                        if (wallet.length > 0 && wallet[0].balance >= listing.price && listing.seller_email !== profile.user_email) {
                            // AI might buy
                            actions.push({ ai: profile.display_name, action: 'browsed marketplace' });
                            console.log(`[AI Actions] ${profile.display_name} browsed marketplace`);
                        }
                    }
                }

                // Update last action time
                await base44.asServiceRole.entities.AIProfile.update(profile.id, {
                    last_action_at: new Date().toISOString()
                });

            } catch (error) {
                console.error(`[AI Actions] Error for ${profile.display_name}:`, error);
            }
        }

        console.log(`[AI Actions] Completed ${actions.length} actions`);

        return Response.json({ 
            success: true,
            actions: actions,
            count: actions.length
        });

    } catch (error) {
        console.error('[AI Actions] Error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});