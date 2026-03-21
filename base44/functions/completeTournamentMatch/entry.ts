import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { match_id, winner_email } = await req.json();

        console.log('[Tournament Match] Completing match:', match_id, 'Winner:', winner_email);

        // Get match
        const match = await base44.asServiceRole.entities.TournamentMatch.get(match_id);
        
        if (match.status === 'completed') {
            return Response.json({ success: false, error: 'Match already completed' }, { status: 400 });
        }

        // Update match
        await base44.asServiceRole.entities.TournamentMatch.update(match_id, {
            winner_email: winner_email,
            status: 'completed',
            completed_at: new Date().toISOString()
        });

        // Update user profiles for both players
        const updatePlayerStats = async (playerEmail, won) => {
            const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
                user_email: playerEmail 
            });

            if (profiles.length > 0) {
                const profile = profiles[0];
                const matchesPlayed = (profile.tournament_matches_played || 0) + 1;
                const matchWins = (profile.tournament_match_wins || 0) + (won ? 1 : 0);
                const matchLosses = (profile.tournament_match_losses || 0) + (won ? 0 : 1);
                const winRate = matchesPlayed > 0 ? (matchWins / matchesPlayed) * 100 : 0;
                const pointsEarned = won ? 100 : 25;

                await base44.asServiceRole.entities.UserProfile.update(profile.id, {
                    tournament_matches_played: matchesPlayed,
                    tournament_match_wins: matchWins,
                    tournament_match_losses: matchLosses,
                    tournament_win_rate: winRate,
                    tournament_points: (profile.tournament_points || 0) + pointsEarned
                });

                console.log(`[Tournament Match] Updated stats for ${playerEmail}: ${matchWins}W/${matchLosses}L`);
            }
        };

        await updatePlayerStats(match.player1_email, match.player1_email === winner_email);
        if (match.player2_email && !match.is_ai_opponent) {
            await updatePlayerStats(match.player2_email, match.player2_email === winner_email);
        }

        console.log('[Tournament Match] Match completed successfully');

        return Response.json({ 
            success: true,
            message: 'Match completed and stats updated'
        });

    } catch (error) {
        console.error('[Tournament Match] Error:', error);
        return Response.json({ 
            success: false,
            error: error.message || 'Failed to complete match' 
        }, { status: 500 });
    }
});