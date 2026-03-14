import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, Database, Play, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function ArcadeAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);
  const [audit, setAudit] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      if (currentUser.role !== 'admin') {
        toast.error('Admin access required');
        navigate('/ArcadeHub');
        return;
      }

      const [gamesData, auditResult] = await Promise.all([
        base44.entities.ArcadeGame.list(),
        base44.functions.invoke('auditArcadeGames', {})
      ]);

      setGames(gamesData);
      setAudit(auditResult.data?.audit);

    } catch (error) {
      console.error('[Admin] Load error:', error);
      toast.error('Failed to load admin data');
    }
    setLoading(false);
  };

  const seedGames = async () => {
    try {
      toast.loading('Seeding games...');
      const result = await base44.functions.invoke('seedExpandedArcade', {});
      
      if (result.data?.success) {
        toast.success(result.data.message);
        await loadData();
      } else {
        toast.error('Seeding failed');
      }
    } catch (error) {
      console.error('[Seed] Error:', error);
      toast.error('Failed to seed games');
    }
  };

  const fixEmbedTypes = async () => {
    try {
      toast.loading('Fixing embed types...');
      const result = await base44.functions.invoke('fixArcadeEmbedTypes', {});
      
      if (result.data?.success) {
        toast.success(result.data.message);
        await loadData();
      } else {
        toast.error('Fix failed');
      }
    } catch (error) {
      console.error('[Fix] Error:', error);
      toast.error('Failed to fix embed types');
    }
  };

  const toggleGame = async (game) => {
    try {
      await base44.entities.ArcadeGame.update(game.id, {
        is_active: !game.is_active
      });
      toast.success(game.is_active ? 'Game disabled' : 'Game enabled');
      await loadData();
    } catch (error) {
      toast.error('Failed to toggle game');
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
    <div className="min-h-screen bg-black text-white p-4 pb-32">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-emerald-950/20 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/ArcadeHub')}
              className="text-green-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
            <h1 className="text-3xl font-black text-white">Arcade Admin</h1>
            <div className="w-20" />
          </div>
        </div>

        {audit && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-black/60 border-purple-500/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-6 h-6 text-purple-400" />
                <div className="text-3xl font-bold text-white">{audit.totalGames}</div>
              </div>
              <div className="text-sm text-green-500/60">Total Games</div>
            </Card>

            <Card className="bg-black/60 border-green-500/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div className="text-3xl font-bold text-white">{audit.activeGames}</div>
              </div>
              <div className="text-sm text-green-500/60">Active Games</div>
            </Card>

            <Card className="bg-black/60 border-yellow-500/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                <div className="text-3xl font-bold text-white">{audit.issues.length}</div>
              </div>
              <div className="text-sm text-green-500/60">Issues</div>
            </Card>

            <Card className="bg-black/60 border-blue-500/30 p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <div className="text-3xl font-bold text-white">{audit.gameplay.totalPlays}</div>
              </div>
              <div className="text-sm text-green-500/60">Total Plays</div>
            </Card>
          </div>
        )}

        <div className="flex gap-3 mb-6">
          <Button
            onClick={seedGames}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Database className="w-4 h-4 mr-2" />
            Seed Games
          </Button>
          <Button
            onClick={fixEmbedTypes}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Fix Embed Types
          </Button>
          <Button
            onClick={loadData}
            variant="outline"
            className="border-purple-500/30 text-purple-400"
          >
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-black/60 border border-purple-500/30">
            <TabsTrigger value="all">All Games</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="audit">Audit Report</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-3">
              {games.map(game => (
                <Card key={game.id} className="bg-black/60 border-purple-500/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{game.icon || '🎮'}</div>
                      <div>
                        <div className="font-bold text-white">{game.name}</div>
                        <div className="text-sm text-green-500/60 flex gap-2 mt-1">
                          <Badge className="bg-purple-600">{game.category}</Badge>
                          <Badge className="bg-yellow-600">{game.difficulty}</Badge>
                          <Badge className={game.embed_type === 'native' ? 'bg-green-600' : 'bg-blue-600'}>
                            {game.embed_type || 'unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="sm"
                        onClick={() => navigate(`/ArcadeGame/${game.game_id}`)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant={game.is_active ? 'destructive' : 'outline'}
                        onClick={() => toggleGame(game)}
                      >
                        {game.is_active ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories">
            {audit && (
              <div className="grid gap-6">
                {Object.entries(audit.byCategory).map(([category, count]) => (
                  <Card key={category} className="bg-black/60 border-purple-500/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white capitalize">{category}</h3>
                      <Badge className="bg-purple-600 text-lg">{count} games</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {games.filter(g => g.category === category).map(game => (
                        <div
                          key={game.id}
                          className="bg-black/40 rounded p-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{game.icon || '🎮'}</span>
                            <span className="text-sm text-white">{game.name}</span>
                          </div>
                          {!game.is_active && (
                            <Badge variant="destructive">Disabled</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit">
            {audit && (
              <div className="space-y-6">
                <Card className="bg-black/60 border-purple-500/30 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Embed Types</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-black/40 rounded p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">{audit.embedTypes.native}</div>
                      <div className="text-sm text-green-500/60">Native</div>
                    </div>
                    <div className="bg-black/40 rounded p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">{audit.embedTypes.iframe}</div>
                      <div className="text-sm text-green-500/60">iFrame</div>
                    </div>
                    <div className="bg-black/40 rounded p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">{audit.embedTypes.unknown}</div>
                      <div className="text-sm text-green-500/60">Unknown</div>
                    </div>
                  </div>
                </Card>

                {audit.issues.length > 0 && (
                  <Card className="bg-black/60 border-red-500/30 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Issues</h3>
                    <div className="space-y-2">
                      {audit.issues.map((issue, i) => (
                        <div key={i} className="bg-red-900/20 rounded p-3 text-red-400 text-sm">
                          {issue}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {audit.recommendations.length > 0 && (
                  <Card className="bg-black/60 border-yellow-500/30 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Recommendations</h3>
                    <div className="space-y-2">
                      {audit.recommendations.map((rec, i) => (
                        <div key={i} className="bg-yellow-900/20 rounded p-3 text-yellow-400 text-sm">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <Card className="bg-black/60 border-purple-500/30 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Top Games</h3>
                  <div className="space-y-2">
                    {audit.topGames.map((game, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded">
                        <span className="text-white">#{i + 1} {game.name}</span>
                        <span className="text-green-500/60">{game.plays} plays • {game.players} players</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}