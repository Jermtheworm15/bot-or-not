import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trade_id } = await req.json();

    // Get trade offer
    const trade = await base44.asServiceRole.entities.TradeOffer.get(trade_id);
    if (!trade || trade.status !== 'pending') {
      return Response.json({ error: 'Trade not available' }, { status: 400 });
    }

    if (trade.recipient_email !== user.email) {
      return Response.json({ error: 'Not authorized for this trade' }, { status: 403 });
    }

    // Validate all collectibles exist and are owned correctly
    const initiatorCollectibles = await Promise.all(
      (trade.initiator_collectible_ids || []).map(id => 
        base44.asServiceRole.entities.ImageCollectible.get(id)
      )
    );

    const recipientCollectibles = await Promise.all(
      (trade.recipient_collectible_ids || []).map(id => 
        base44.asServiceRole.entities.ImageCollectible.get(id)
      )
    );

    // Verify ownership
    for (const c of initiatorCollectibles) {
      if (!c || c.owner_email !== trade.initiator_email) {
        return Response.json({ error: 'Invalid initiator collectible' }, { status: 400 });
      }
    }

    for (const c of recipientCollectibles) {
      if (!c || c.owner_email !== trade.recipient_email) {
        return Response.json({ error: 'Invalid recipient collectible' }, { status: 400 });
      }
    }

    // Get wallets
    const initiatorWallets = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: trade.initiator_email });
    const recipientWallets = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: trade.recipient_email });

    if (initiatorWallets.length === 0 || recipientWallets.length === 0) {
      return Response.json({ error: 'Wallets not found' }, { status: 400 });
    }

    const initiatorWallet = initiatorWallets[0];
    const recipientWallet = recipientWallets[0];

    // Verify balances
    if (initiatorWallet.balance < (trade.initiator_tokens || 0)) {
      return Response.json({ error: 'Initiator has insufficient tokens' }, { status: 400 });
    }

    if (recipientWallet.balance < (trade.recipient_tokens || 0)) {
      return Response.json({ error: 'Recipient has insufficient tokens' }, { status: 400 });
    }

    // Execute atomic trade
    // 1. Transfer tokens if any
    if (trade.initiator_tokens > 0) {
      await base44.asServiceRole.entities.TokenWallet.update(initiatorWallet.id, {
        balance: initiatorWallet.balance - trade.initiator_tokens,
        lifetime_spent: (initiatorWallet.lifetime_spent || 0) + trade.initiator_tokens
      });

      await base44.asServiceRole.entities.TokenWallet.update(recipientWallet.id, {
        balance: recipientWallet.balance + trade.initiator_tokens,
        lifetime_earned: (recipientWallet.lifetime_earned || 0) + trade.initiator_tokens
      });

      await base44.asServiceRole.entities.TokenTransaction.create({
        from_email: trade.initiator_email,
        to_email: trade.recipient_email,
        amount: trade.initiator_tokens,
        transaction_type: 'trade',
        reference_id: trade_id,
        description: 'Trade tokens'
      });
    }

    if (trade.recipient_tokens > 0) {
      await base44.asServiceRole.entities.TokenWallet.update(recipientWallet.id, {
        balance: recipientWallet.balance - trade.recipient_tokens,
        lifetime_spent: (recipientWallet.lifetime_spent || 0) + trade.recipient_tokens
      });

      await base44.asServiceRole.entities.TokenWallet.update(initiatorWallet.id, {
        balance: initiatorWallet.balance + trade.recipient_tokens,
        lifetime_earned: (initiatorWallet.lifetime_earned || 0) + trade.recipient_tokens
      });

      await base44.asServiceRole.entities.TokenTransaction.create({
        from_email: trade.recipient_email,
        to_email: trade.initiator_email,
        amount: trade.recipient_tokens,
        transaction_type: 'trade',
        reference_id: trade_id,
        description: 'Trade tokens'
      });
    }

    // 2. Transfer collectibles
    for (const c of initiatorCollectibles) {
      await base44.asServiceRole.entities.ImageCollectible.update(c.id, {
        owner_email: trade.recipient_email,
        is_listed: false,
        acquisition_date: new Date().toISOString(),
        total_trades: (c.total_trades || 0) + 1
      });
    }

    for (const c of recipientCollectibles) {
      await base44.asServiceRole.entities.ImageCollectible.update(c.id, {
        owner_email: trade.initiator_email,
        is_listed: false,
        acquisition_date: new Date().toISOString(),
        total_trades: (c.total_trades || 0) + 1
      });
    }

    // 3. Mark trade as accepted
    await base44.asServiceRole.entities.TradeOffer.update(trade_id, {
      status: 'accepted',
      completed_at: new Date().toISOString()
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('acceptTradeOffer error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});