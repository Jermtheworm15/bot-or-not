import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingCart, Sparkles, TrendingUp, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

const rarityColors = {
  common: 'bg-slate-600 text-white',
  uncommon: 'bg-green-600 text-white',
  rare: 'bg-blue-600 text-white',
  epic: 'bg-purple-600 text-white',
  legendary: 'bg-orange-600 text-white'
};

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [filteredListings, setFilteredListings] = useState([]);
  const [myWallet, setMyWallet] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rarityFilter, setRarityFilter] = useState('all');
  const [priceSort, setPriceSort] = useState('asc');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [listings, rarityFilter, priceSort]);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const wallets = await base44.entities.TokenWallet.filter({ user_email: currentUser.email });
      if (wallets.length > 0) {
        setMyWallet(wallets[0]);
      } else {
        // Create wallet
        const newWallet = await base44.entities.TokenWallet.create({
          user_email: currentUser.email,
          balance: 1000,
          lifetime_earned: 1000,
          lifetime_spent: 0
        });
        setMyWallet(newWallet);
      }

      const activeListings = await base44.entities.MarketplaceListing.filter({ status: 'active' });
      
      // Get collectible and image data for each listing
      const enriched = await Promise.all(activeListings.map(async (listing) => {
        try {
          const collectible = await base44.entities.ImageCollectible.get(listing.collectible_id);
          const image = await base44.entities.Image.get(listing.image_id);
          return { ...listing, collectible, image };
        } catch (err) {
          console.error('Failed to enrich listing:', err);
          return null;
        }
      }));

      const validListings = enriched.filter(l => l !== null);

      setListings(validListings);
    } catch (error) {
      console.error('Load marketplace error:', error);
      toast.error('Failed to load marketplace');
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...listings];

    if (rarityFilter !== 'all') {
      filtered = filtered.filter(l => l.collectible?.rarity_tier === rarityFilter);
    }

    filtered.sort((a, b) => {
      if (priceSort === 'asc') return a.price - b.price;
      return b.price - a.price;
    });

    setFilteredListings(filtered);
  };

  const handlePurchase = async (listing) => {
    if (!myWallet || myWallet.balance < listing.price) {
      toast.error('Insufficient tokens');
      return;
    }

    const toastId = toast.loading('Processing purchase...');

    try {
      const result = await base44.functions.invoke('purchaseCollectible', { listing_id: listing.id });
      if (result.data.success) {
        toast.success('Purchase successful!', { id: toastId });
        loadData();
      } else {
        toast.error(result.data.error || 'Purchase failed', { id: toastId });
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed - please try again', { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 p-4 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-black flex items-center gap-2">
              <ShoppingCart className="w-8 h-8" />
              Marketplace
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
              <ShoppingCart className="w-8 h-8" />
              Marketplace
            </h1>
            <p className="text-green-500/60">Buy rare collectible images with tokens</p>
          </div>
          {myWallet && (
            <Link to={createPageUrl('Wallet')} className="bg-purple-900/30 border border-purple-500/30 rounded-lg px-4 py-2 hover:bg-purple-900/50 transition-colors cursor-pointer">
              <div className="text-xs text-green-500/60">Your Balance</div>
              <div className="text-2xl font-bold text-purple-400">{myWallet.balance.toLocaleString()} 🪙</div>
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <select
              value={rarityFilter}
              onChange={(e) => setRarityFilter(e.target.value)}
              className="bg-black border border-green-500/30 rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">All Rarities</option>
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <select
              value={priceSort}
              onChange={(e) => setPriceSort(e.target.value)}
              className="bg-black border border-green-500/30 rounded-lg px-3 py-2 text-sm"
            >
              <option value="asc">Price: Low to High</option>
              <option value="desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="bg-black/60 border-purple-500/30 overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={listing.image?.url}
                  alt="Collectible"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x400/1a1a1a/4a5568?text=No+Image';
                  }}
                />
                <div className="absolute top-1 right-1 md:top-2 md:right-2">
                  <Badge className={`${rarityColors[listing.collectible?.rarity_tier || 'common']} text-xs`}>
                    {listing.collectible?.rarity_tier || 'common'}
                  </Badge>
                </div>
              </div>
              <div className="p-2 md:p-4">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <div className="text-xs text-green-500/60">
                    Diff: {listing.collectible?.average_difficulty?.toFixed(1)}/10
                  </div>
                  <div className="text-xs text-green-500/60">
                    {listing.collectible?.vote_count}v
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-between mb-2">
                  <div className="text-sm text-green-500/80">
                    Value: {listing.collectible?.value_score?.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-500/60">
                    Trades: {listing.collectible?.total_trades || 0}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 md:mt-4">
                  <div className="text-lg md:text-2xl font-bold text-purple-400">
                    {listing.price.toLocaleString()} 🪙
                  </div>
                  <Button
                    onClick={() => handlePurchase(listing)}
                    disabled={listing.seller_email === user?.email || (myWallet?.balance || 0) < listing.price}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700 text-xs md:text-sm"
                  >
                    Buy
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredListings.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
            <p className="text-green-500/60">No listings match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}