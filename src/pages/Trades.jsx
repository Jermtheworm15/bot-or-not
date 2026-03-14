import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Repeat, Clock, CheckCircle, XCircle, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function Trades() {
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [received, sent] = await Promise.all([
        base44.entities.TradeOffer.filter({ recipient_email: currentUser.email }),
        base44.entities.TradeOffer.filter({ initiator_email: currentUser.email })
      ]);

      setReceivedOffers(received.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setSentOffers(sent.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error('Load trades error:', error);
      toast.error('Failed to load trades');
    }
    setLoading(false);
  };

  const handleAcceptTrade = async (tradeId) => {
    const toastId = toast.loading('Processing trade...');

    try {
      const result = await base44.functions.invoke('acceptTradeOffer', { trade_id: tradeId });
      if (result.data.success) {
        toast.success('Trade accepted!', { id: toastId });
        loadData();
        setSelectedOffer(null);
      } else {
        toast.error(result.data.error || 'Trade failed', { id: toastId });
      }
    } catch (error) {
      console.error('Accept trade error:', error);
      toast.error('Failed to accept trade - please try again', { id: toastId });
    }
  };

  const handleDeclineTrade = async (tradeId) => {
    try {
      await base44.entities.TradeOffer.update(tradeId, { status: 'declined' });
      toast.success('Trade declined');
      loadData();
      setSelectedOffer(null);
    } catch (error) {
      console.error('Decline trade error:', error);
      toast.error('Failed to decline trade');
    }
  };

  const handleCancelTrade = async (tradeId) => {
    try {
      await base44.entities.TradeOffer.update(tradeId, { status: 'cancelled' });
      toast.success('Trade cancelled');
      loadData();
    } catch (error) {
      console.error('Cancel trade error:', error);
      toast.error('Failed to cancel trade');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            <Repeat className="w-8 h-8" />
            Trade Offers
          </h1>
          <p className="text-green-500/60">Manage your trades and offers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-bold mb-4">Received Offers</h2>
            {receivedOffers.length === 0 ? (
              <Card className="bg-black/60 border-purple-500/30 p-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
                <p className="text-green-500/60">No offers received</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {receivedOffers.map((offer) => (
                  <Card 
                    key={offer.id} 
                    className="bg-black/60 border-purple-500/30 p-4 cursor-pointer hover:border-purple-500/50 transition-colors" 
                    onClick={() => setSelectedOffer(offer)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">From: {offer.initiator_email}</div>
                      <Badge className={
                        offer.status === 'pending' ? 'bg-yellow-600' :
                        offer.status === 'accepted' ? 'bg-green-600' :
                        'bg-red-600'
                      }>
                        {offer.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-green-500/60 mb-2">
                      {offer.initiator_collectible_ids?.length || 0} items + {offer.initiator_tokens || 0} tokens
                    </div>
                    <div className="text-xs text-green-500/40">
                      {new Date(offer.created_date).toLocaleDateString()}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold mb-4">Sent Offers</h2>
            {sentOffers.length === 0 ? (
              <Card className="bg-black/60 border-purple-500/30 p-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-4 text-green-500/30" />
                <p className="text-green-500/60">No offers sent</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {sentOffers.map((offer) => (
                  <Card key={offer.id} className="bg-black/60 border-purple-500/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium">To: {offer.recipient_email}</div>
                      <Badge className={
                        offer.status === 'pending' ? 'bg-yellow-600' :
                        offer.status === 'accepted' ? 'bg-green-600' :
                        'bg-red-600'
                      }>
                        {offer.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-green-500/60 mb-2">
                      {offer.initiator_collectible_ids?.length || 0} items + {offer.initiator_tokens || 0} tokens
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-green-500/40">
                        {new Date(offer.created_date).toLocaleDateString()}
                      </div>
                      {offer.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelTrade(offer.id);
                          }}
                          className="cursor-pointer"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedOffer && (
          <Dialog open={!!selectedOffer} onOpenChange={() => setSelectedOffer(null)}>
            <DialogContent className="bg-black border-purple-500/30">
              <DialogHeader>
                <DialogTitle className="text-green-400">Trade Offer Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-green-500/60 mb-2">From: {selectedOffer.initiator_email}</div>
                  <div className="text-sm text-green-500/80 mb-1">Offering:</div>
                  <div className="text-xs text-green-500/60">
                    • {selectedOffer.initiator_collectible_ids?.length || 0} collectible(s)
                  </div>
                  <div className="text-xs text-green-500/60">
                    • {selectedOffer.initiator_tokens || 0} tokens
                  </div>
                </div>
                <div>
                  <div className="text-sm text-green-500/80 mb-1">Requesting:</div>
                  <div className="text-xs text-green-500/60">
                    • {selectedOffer.recipient_collectible_ids?.length || 0} collectible(s)
                  </div>
                  <div className="text-xs text-green-500/60">
                    • {selectedOffer.recipient_tokens || 0} tokens
                  </div>
                </div>
                {selectedOffer.message && (
                  <div>
                    <div className="text-sm text-green-500/80 mb-1">Message:</div>
                    <p className="text-xs text-green-500/60 italic">{selectedOffer.message}</p>
                  </div>
                )}
                {selectedOffer.status === 'pending' && (
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => handleAcceptTrade(selectedOffer.id)} 
                      className="flex-1 bg-green-600 hover:bg-green-700 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                    <Button 
                      onClick={() => handleDeclineTrade(selectedOffer.id)} 
                      variant="outline" 
                      className="flex-1 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}