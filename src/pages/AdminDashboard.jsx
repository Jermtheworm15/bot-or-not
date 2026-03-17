import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users, Vote, Activity, Target, Trophy, Video, Gamepad2,
  UserPlus, RefreshCw, TrendingUp, Medal, BarChart3
} from 'lucide-react';

const ALLOWED_EMAIL = 'jpadgett15@gmail.com';

function StatCard({ icon: Icon, label, value, sub, color = 'purple' }) {
  const colors = {
    purple: 'border-purple-500/30 text-purple-400',
    green: 'border-green-500/30 text-green-400',
    yellow: 'border-yellow-500/30 text-yellow-400',
    blue: 'border-blue-500/30 text-blue-400',
    pink: 'border-pink-500/30 text-pink-400',
    orange: 'border-orange-500/30 text-orange-400',
  };
  return (
    <Card className={`bg-black/60 ${colors[color]} border p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${colors[color].split(' ')[1]}`} />
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-black text-white">{value ?? '—'}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </Card>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      setUser(me);
      if (me?.email !== ALLOWED_EMAIL) { setLoading(false); return; }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayISO = todayStart.toISOString();

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      const weekISO = weekStart.toISOString();

      const [
        allUsers,
        allVotes,
        allVotesBig,
        arcadeScores,
        arcadeGames,
        tournaments,
        referrals,
        videos,
        videoVotes,
        profiles,
      ] = await Promise.all([
        base44.entities.User.list('-created_date', 2000),
        base44.entities.Vote.filter({ created_date: { $gte: todayISO } }),
        base44.entities.Vote.list('-created_date', 5000),
        base44.entities.ArcadeScore.list('-created_date', 1000),
        base44.entities.ArcadeGame.list(),
        base44.entities.Tournament.list('-created_date', 200),
        base44.entities.Referral.filter({ created_date: { $gte: weekISO } }),
        base44.entities.Video.list('-views', 20),
        base44.entities.VideoVote.list('-created_date', 1000),
        base44.entities.UserProfile.list('-points', 50),
      ]);

      // Total users
      const totalUsers = allUsers.length;

      // New users today
      const newUsersToday = allUsers.filter(u => u.created_date >= todayISO).length;

      // Votes today
      const votesToday = allVotes.length;

      // Active users today (unique emails in today's votes)
      const activeEmails = new Set(allVotes.map(v => v.user_email).filter(Boolean));
      const activeUsersToday = activeEmails.size;

      // Average accuracy (from all votes with was_correct)
      const correctableVotes = allVotesBig.filter(v => v.was_correct !== undefined && v.was_correct !== null);
      const correctVotes = correctableVotes.filter(v => v.was_correct === true);
      const avgAccuracy = correctableVotes.length > 0
        ? Math.round((correctVotes.length / correctableVotes.length) * 100)
        : 0;

      // Tournament fill rate
      const openTournaments = tournaments.filter(t => t.status === 'open' || t.status === 'active');
      let fillRate = 0;
      if (openTournaments.length > 0) {
        const totalSlots = openTournaments.reduce((sum, t) => sum + (t.max_participants || 8), 0);
        const filledSlots = openTournaments.reduce((sum, t) => sum + ((t.participants || []).length || t.participant_count || 0), 0);
        fillRate = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
      }

      // Top 3 players by points
      const top3 = profiles.slice(0, 3).map(p => ({
        email: p.user_email,
        username: p.username || p.user_email?.split('@')[0],
        points: p.points || 0,
        level: p.level || 1,
      }));

      // Most viewed videos (top 3)
      const topVideos = videos.slice(0, 3).map(v => ({
        title: v.title || 'Untitled',
        views: v.views || 0,
        category: v.category || '',
      }));

      // Most played arcade game
      const gamePlayCounts = {};
      arcadeScores.forEach(s => {
        if (s.game_id) gamePlayCounts[s.game_id] = (gamePlayCounts[s.game_id] || 0) + 1;
      });
      const topGameId = Object.entries(gamePlayCounts).sort((a, b) => b[1] - a[1])[0];
      const topGame = topGameId
        ? { game: arcadeGames.find(g => g.game_id === topGameId[0]), plays: topGameId[1] }
        : null;

      // Referrals this week
      const referralsThisWeek = referrals.length;

      setStats({
        totalUsers,
        newUsersToday,
        votesToday,
        activeUsersToday,
        avgAccuracy,
        fillRate,
        openTournaments: openTournaments.length,
        top3,
        topVideos,
        topGame,
        referralsThisWeek,
      });
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('[AdminDashboard] Error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full" />
        <p className="text-sm text-zinc-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!user || user.email !== ALLOWED_EMAIL) {
    return (
      <div className="min-h-screen bg-black text-green-400 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
          <h2 className="text-2xl font-black text-white mb-2">Access Denied</h2>
          <p className="text-zinc-500">This dashboard is restricted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-400 p-4 pb-32 overflow-y-auto">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              Daily Stats Dashboard
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              {lastRefreshed ? `Last refreshed: ${lastRefreshed.toLocaleTimeString()}` : 'Loading...'}
            </p>
          </div>
          <Button
            onClick={load}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {stats && (
          <div className="space-y-6">

            {/* Row 1 — Core metrics */}
            <div>
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Users</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="purple" />
                <StatCard icon={UserPlus} label="New Today" value={stats.newUsersToday} color="green" />
                <StatCard icon={Activity} label="Active Today" value={stats.activeUsersToday} color="blue" />
                <StatCard icon={Vote} label="Votes Today" value={stats.votesToday} color="pink" />
              </div>
            </div>

            {/* Row 2 — Performance */}
            <div>
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Performance</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon={Target} label="Avg Accuracy" value={`${stats.avgAccuracy}%`} color="yellow" />
                <StatCard
                  icon={Trophy}
                  label="Tournament Fill Rate"
                  value={`${stats.fillRate}%`}
                  sub={`${stats.openTournaments} open tournament${stats.openTournaments !== 1 ? 's' : ''}`}
                  color="orange"
                />
                <StatCard icon={TrendingUp} label="Referrals This Week" value={stats.referralsThisWeek} color="green" />
              </div>
            </div>

            {/* Top 3 Players */}
            <div>
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Top 3 Players</h2>
              <Card className="bg-black/60 border-yellow-500/30 divide-y divide-zinc-800">
                {stats.top3.length === 0 && (
                  <div className="p-6 text-center text-zinc-500 text-sm">No player data yet</div>
                )}
                {stats.top3.map((p, i) => (
                  <div key={p.email} className="flex items-center gap-4 px-4 py-3">
                    <div className={`text-2xl font-black w-8 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-zinc-300' : 'text-orange-400'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-white">{p.username}</div>
                      <div className="text-xs text-zinc-500">{p.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-yellow-400">{p.points.toLocaleString()} pts</div>
                      <div className="text-xs text-zinc-500">Level {p.level}</div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>

            {/* Most Viewed Videos */}
            <div>
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Most Viewed Videos</h2>
              <Card className="bg-black/60 border-blue-500/30 divide-y divide-zinc-800">
                {stats.topVideos.length === 0 && (
                  <div className="p-6 text-center text-zinc-500 text-sm">No video data yet</div>
                )}
                {stats.topVideos.map((v, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3">
                    <Video className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate">{v.title}</div>
                      {v.category && <div className="text-xs text-zinc-500">{v.category}</div>}
                    </div>
                    <div className="text-blue-400 font-bold text-sm">{v.views.toLocaleString()} views</div>
                  </div>
                ))}
              </Card>
            </div>

            {/* Most Played Arcade Game */}
            <div>
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Most Played Arcade Game</h2>
              <Card className="bg-black/60 border-purple-500/30 p-4">
                {stats.topGame ? (
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{stats.topGame.game?.icon || '🎮'}</div>
                    <div>
                      <div className="text-xl font-black text-white">{stats.topGame.game?.name || stats.topGame.game?.game_id || 'Unknown'}</div>
                      <div className="text-sm text-purple-400 font-bold">{stats.topGame.plays} total plays</div>
                      {stats.topGame.game?.category && (
                        <div className="text-xs text-zinc-500 mt-0.5 capitalize">{stats.topGame.game.category}</div>
                      )}
                    </div>
                    <Gamepad2 className="w-10 h-10 text-purple-400/30 ml-auto" />
                  </div>
                ) : (
                  <p className="text-zinc-500 text-sm text-center py-2">No arcade data yet</p>
                )}
              </Card>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}