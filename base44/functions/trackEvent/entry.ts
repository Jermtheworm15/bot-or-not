import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        const { event_type, metadata, image_id, tournament_id, challenge_id, listing_id, trade_offer_id } = await req.json();

        if (!event_type) {
            return Response.json({ success: false, error: 'event_type required' }, { status: 400 });
        }

        console.log('[Analytics] Tracking event:', event_type, 'User:', user?.email);

        // Determine actor type
        let actorType = 'human';
        if (user?.email) {
            const users = await base44.asServiceRole.entities.User.filter({ email: user.email });
            if (users.length > 0 && users[0].is_ai) {
                actorType = 'ai';
            }
        }

        // Create analytics event
        await base44.asServiceRole.entities.AnalyticsEvent.create({
            event_type,
            user_email: user?.email || null,
            actor_type: actorType,
            image_id: image_id || null,
            tournament_id: tournament_id || null,
            challenge_id: challenge_id || null,
            listing_id: listing_id || null,
            trade_offer_id: trade_offer_id || null,
            metadata: metadata || {}
        });

        console.log('[Analytics] Event tracked successfully');

        return Response.json({ success: true });

    } catch (error) {
        console.error('[Analytics] Track error:', error);
        return Response.json({ 
            success: false,
            error: error.message 
        }, { status: 500 });
    }
});