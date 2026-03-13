import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Tag, TrendingUp, X, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

const rarityColors = {
  common: 'bg-slate-600 text-white',
  uncommon: 'bg-green-600 text-white',
  rare: 'bg-blue-600 text-white',
  epic: 'bg-purple-600 text-white',
  legendary: 'bg-orange-600 text-white'
};

export default function Collection() {
  const [collectibles, setCollectibles] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listingPrice, setListingPrice] = useState({});
  const [showListDialog, setShowListDialog] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const wallets = await base44.entities.TokenWallet.filter({ user_email: currentUser.email });
      if (wallets.length > 0) {
        setWallet(wallets[0]);
      }

      const myCollectibles = await base44.entities.ImageCollectible.filter({ owner_email: currentUser.email });
      
      // Get image data
      const enriched = await Promise.all(myCollectibles.map(async (c) => {
        try {
          const image = await base44.entities.Image.get(c.image_id);
          return { ...c, image };
        } catch (err) {
          console.error('Failed to load image for collectible:', err);
          return { ...c, image: null };
        }
      }));

      setCollectibles(enriched);
    } catch (error) {
      console.error('Load collection error:', error);
      toast.error('Failed to load collection');
    }
    setLoading(false);
  };

  const handleListForSale = async (collectible) => {
    const price = parseFloat(listingPrice[collectible.id] || 0);
    if (price <= 0) {
      toast.error('Enter a valid price');
      return;
    }

    try {
      const listing = await base44.entities.MarketplaceListing.create({
        collectible_id: collectible.id,
        image_id: collectible.image_id,
        seller_email: user.email,
        price,
        status: 'active'
      });

      await base44.entities.ImageCollectible.update(collectible.id, {
        is_listed: true,
        list_price: price
      });

      toast.success('Listed for sale!');
      setShowListDialog(null);
      loadData();
    } catch (error) {
      console.error('List error:', error);
      toast.error('Failed to list item');
    }
  };

  const handleCancelListing = async (collectible) => {
    try {
      const listings = await base44.entities.MarketplaceListing.filter({
        collectible_id: collectible.id,
        status: 'active'
      });

      if (listings.length > 0) {
        await base44.entities.MarketplaceListing.update(listings[0].id, { status: 'cancelled' });
      }

      await base44.entities.ImageCollectible.update(collectible.id, {
        is_listed: false,
        list_price: null
      });

      toast.success('Listing cancelled');
      loadData();
    } catch (error) {
      console.error('Cancel listing error:', error);
      toast.error('Failed to cancel listing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-4 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black flex items-center gap-2">
              <Package className="w-8 h-8" />
              My Collection
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-black/60 border border-purple-500/30 rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-square bg-purple-900/20" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-purple-900/20 rounded w-3/4" />
                  <div className="h-4 bg-purple-900/20 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
              <Package className="w-8 h-8" />
              My Collection
            </h1>
            <p className="text-green-500/60">{collectibles.length} collectibles owned</p>
          </div>
          {wallet && (
            <Link to={createPageUrl('Wallet')} className="bg-purple-900/30 border border-purple-500/30 rounded-lg px-4 py-2 hover:bg-purple-900/50 transition-colors cursor-pointer">
              <div className="text-xs text-green-500/60">Tokens</div>
              <div className="text-2xl font-bold text-purple-400">{wallet.balance.toLocaleString()} 🪙</div>
            </Link>
          )}
        </div>

        {/* Collection Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {collectibles.map((collectible) => (
            <Card key={collectible.id} className="bg-black/60 border-purple-500/30 overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={collectible.image?.url}
                  alt="Collectible"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x400/1a1a1a/4a5568?text=No+Image';
                  }}
                />
                <div className="absolute top-1 right-1 md:top-2 md:right-2">
                  <Badge className={`${rarityColors[collectible.rarity_tier]} text-xs`}>
                    {collectible.rarity_tier}
                  </Badge>
                </div>
                {collectible.is_listed && (
                  <div className="absolute top-1 left-1 md:top-2 md:left-2">
                    <Badge className="bg-yellow-600 text-white text-xs">Listed</Badge>
                  </div>
                )}
              </div>
              <div className="p-2 md:p-4">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <div className="text-xs text-green-500/60">
                    Diff: {collectible.average_difficulty?.toFixed(1)}/10
                  </div>
                  <div className="text-xs text-green-500/60">
                    {collectible.vote_count}v
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-between mb-2">
                  <div className="text-sm text-green-500/80">
                    Value: {collectible.value_score?.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-500/60">
                    Trades: {collectible.total_trades || 0}
                  </div>
                </div>
                <div className="mt-2 md:mt-4">
                  {collectible.is_listed ? (
                    <div>
                      <div className="text-sm md:text-lg font-bold text-yellow-400 mb-2">
                        {collectible.list_price?.toLocaleString()} 🪙
                      </div>
                      <Button
                        onClick={() => handleCancelListing(collectible)}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs md:text-sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Dialog open={showListDialog === collectible.id} onOpenChange={(open) => setShowListDialog(open ? collectible.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-xs md:text-sm">
                          <Tag className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                          List
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black border-purple-500/30">
                        <DialogHeader>
                          <DialogTitle className="text-green-400">Set Price</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Input
                            type="number"
                            placeholder="Price in tokens"
                            value={listingPrice[collectible.id] || ''}
                            onChange={(e) => setListingPrice({ ...listingPrice, [collectible.id]: e.target.value })}
                            className="bg-black border-green-500/30"
                          />
                          <Button
                            onClick={() => handleListForSale(collectible)}
                            className="w-full bg-purple-600 hover:bg-purple-700"
                          >
                            List for Sale
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {collectibles.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
            <p className="text-green-500/60">No collectibles yet. Upload images to start collecting!</p>
          </div>
        )}
      </div>
    </div>
  );
}