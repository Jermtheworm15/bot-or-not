import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listing_id } = await req.json();

    // Get listing
    const listing = await base44.asServiceRole.entities.MarketplaceListing.get(listing_id);
    if (!listing || listing.status !== 'active') {
      return Response.json({ error: 'Listing not available' }, { status: 400 });
    }

    if (listing.seller_email === user.email) {
      return Response.json({ error: 'Cannot buy your own listing' }, { status: 400 });
    }

    // Get buyer wallet
    const buyerWallets = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: user.email });
    if (buyerWallets.length === 0) {
      return Response.json({ error: 'Wallet not found' }, { status: 400 });
    }
    const buyerWallet = buyerWallets[0];

    if (buyerWallet.balance < listing.price) {
      return Response.json({ error: 'Insufficient tokens' }, { status: 400 });
    }

    // Get seller wallet
    const sellerWallets = await base44.asServiceRole.entities.TokenWallet.filter({ user_email: listing.seller_email });
    if (sellerWallets.length === 0) {
      return Response.json({ error: 'Seller wallet not found' }, { status: 400 });
    }
    const sellerWallet = sellerWallets[0];

    // Get collectible
    const collectible = await base44.asServiceRole.entities.ImageCollectible.get(listing.collectible_id);
    if (!collectible || collectible.owner_email !== listing.seller_email) {
      return Response.json({ error: 'Invalid collectible ownership' }, { status: 400 });
    }

    // Execute atomic transaction
    // 1. Update buyer wallet
    await base44.asServiceRole.entities.TokenWallet.update(buyerWallet.id, {
      balance: buyerWallet.balance - listing.price,
      lifetime_spent: (buyerWallet.lifetime_spent || 0) + listing.price
    });

    // 2. Update seller wallet
    await base44.asServiceRole.entities.TokenWallet.update(sellerWallet.id, {
      balance: sellerWallet.balance + listing.price,
      lifetime_earned: (sellerWallet.lifetime_earned || 0) + listing.price
    });

    // 3. Transfer collectible ownership
    await base44.asServiceRole.entities.ImageCollectible.update(collectible.id, {
      owner_email: user.email,
      is_listed: false,
      list_price: null,
      acquisition_date: new Date().toISOString(),
      total_trades: (collectible.total_trades || 0) + 1
    });

    // 4. Mark listing as sold
    await base44.asServiceRole.entities.MarketplaceListing.update(listing.id, {
      status: 'sold',
      buyer_email: user.email,
      sold_at: new Date().toISOString()
    });

    // 5. Create transaction records
    await base44.asServiceRole.entities.TokenTransaction.create({
      from_email: user.email,
      to_email: listing.seller_email,
      amount: listing.price,
      transaction_type: 'purchase',
      reference_id: listing.id,
      description: `Purchase collectible #${collectible.id}`
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('purchaseCollectible error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});