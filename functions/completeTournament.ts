import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { tournament_id } = await req.json();

        console.log('[Tournament Complete] Completing tournament:', tournament_id);

        // Get tournament
        const tournament = await base44.asServiceRole.entities.Tournament.get(tournament_id);

        if (tournament.status === 'completed') {
            return Response.json({ success: false, error: 'Tournament already completed' }, { status: 400 });
        }

        // Sort participants by score (descending)
        const rankedParticipants = [...(tournament.participants || [])].sort((a, b) => (b.score || 0) - (a.score || 0));

        // Award prizes to top 3
        const prizeDistribution = [0.5, 0.3, 0.2]; // 50%, 30%, 20%
        const winners = [];

        for (let i = 0; i < Math.min(3, rankedParticipants.length); i++) {
            const participant = rankedParticipants[i];
            const prize = Math.floor((tournament.prize_pool || 0) * prizeDistribution[i]);

            winners.push({
                place: i + 1,
                email: participant.email,
                name: participant.name,
                score: participant.score || 0,
                prize: prize
            });

            // Award prize tokens
            if (prize > 0) {
                const wallets = await base44.asServiceRole.entities.TokenWallet.filter({ 
                    user_email: participant.email 
                });

                if (wallets.length > 0) {
                    const wallet = wallets[0];
                    await base44.asServiceRole.entities.TokenWallet.update(wallet.id, {
                        balance: wallet.balance + prize,
                        lifetime_earned: (wallet.lifetime_earned || 0) + prize
                    });

                    // Create transaction
                    await base44.asServiceRole.entities.TokenTransaction.create({
                        from_email: null,
                        to_email: participant.email,
                        amount: prize,
                        transaction_type: 'reward',
                        reference_id: tournament_id,
                        description: `Tournament ${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : 'rd'} place: ${tournament.name}`
                    });
                }
            }

            // Update user profile stats
            const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
                user_email: participant.email 
            });

            if (profiles.length > 0) {
                const profile = profiles[0];
                const updateData = {
                    tournament_points: (profile.tournament_points || 0) + prize
                };

                // Update best finish if this is better
                if (!profile.best_tournament_finish || (i + 1) < profile.best_tournament_finish) {
                    updateData.best_tournament_finish = i + 1;
                }

                // Update tournaments won for 1st place
                if (i === 0) {
                    updateData.tournaments_won = (profile.tournaments_won || 0) + 1;
                }

                await base44.asServiceRole.entities.UserProfile.update(profile.id, updateData);

                console.log(`[Tournament Complete] Updated stats for ${participant.email}: Place ${i + 1}`);
            }
        }

        // Update tournament
        await base44.asServiceRole.entities.Tournament.update(tournament_id, {
            status: 'completed',
            winners: winners,
            end_date: new Date().toISOString()
        });

        console.log('[Tournament Complete] Tournament completed successfully');

        return Response.json({ 
            success: true,
            winners: winners,
            message: 'Tournament completed and prizes awarded'
        });

    } catch (error) {
        console.error('[Tournament Complete] Error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Failed to complete tournament' 
        }, { status: 500 });
    }
});