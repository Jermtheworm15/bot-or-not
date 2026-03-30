import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Target, Zap, Brain, Image, Trophy, Star, Bot, User, Eye } from 'lucide-react';
import RealWorldComparison from '@/components/analytics/RealWorldComparison';

const TIER_COLORS = { bronze: '#cd7f32', silver: '#c0c0c0', gold: '#ffd700', platinum: '#e5e4e2' };
const CHART_COLORS = ['#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

function StatCard({ icon: Icon, label, value, sub, color = 'violet', delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-black text-${color}-400`}>{value}</p>
              {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
            </div>
            <div className={`p-2 rounded-lg bg-${color}-950/50 border border-${color}-900/50`}>
              <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Analytics() {
  const [userStats, setUserStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [imageStats, setImageStats] = useState(null);
  const [topPlayers, setTopPlayers] = useState([]);
  const [accuracyOverTime, setAccuracyOverTime] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);
  const [myEmail, setMyEmail] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setIsLoading(true);
    const user = await base44.auth.me();
    setMyEmail(user.email);

    const [profiles, myVotes, allVotes, allImages, diffVotes] = await Promise.all([
      base44.entities.UserProfile.list('-points', 200),
      base44.entities.Vote.filter({ user_email: user.email }),
      base44.entities.Vote.list('-created_date', 500),
      base44.entities.Image.list('-created_date', 200),
      base44.entities.ImageDifficultyVote?.list?.('-created_date', 500).catch(() => []) || Promise.resolve([])
    ]);

    // ── My stats ──
    const myProfile = profiles.find(p => p.user_email === user.email);
    const correct = myVotes.filter(v => v.was_correct).length;
    const botVotes = myVotes.filter(v => v.guessed_bot === true);
    const humanVotes = myVotes.filter(v => v.guessed_bot === false);
    const botCorrect = botVotes.filter(v => v.was_correct).length;
    const humanCorrect = humanVotes.filter(v => v.was_correct).length;

    setUserStats({
      total: myVotes.length,
      correct,
      accuracy: myVotes.length ? ((correct / myVotes.length) * 100).toFixed(1) : 0,
      points: myProfile?.points || 0,
      streak: myProfile?.perfect_streak || 0,
      level: myProfile?.level || 1,
      tier: myProfile?.tier || 'bronze',
      botAccuracy: botVotes.length ? ((botCorrect / botVotes.length) * 100).toFixed(1) : 0,
      humanAccuracy: humanVotes.length ? ((humanCorrect / humanVotes.length) * 100).toFixed(1) : 0,
      radarData: [
        { metric: 'Bot Detect', value: botVotes.length ? (botCorrect / botVotes.length) * 100 : 0 },
        { metric: 'Human Detect', value: humanVotes.length ? (humanCorrect / humanVotes.length) * 100 : 0 },
        { metric: 'Volume', value: Math.min((myVotes.length / 500) * 100, 100) },
        { metric: 'Streak', value: Math.min(((myProfile?.perfect_streak || 0) / 50) * 100, 100) },
        { metric: 'Points', value: Math.min(((myProfile?.points || 0) / 10000) * 100, 100) },
      ]
    });

    // ── Accuracy over time (bucket by 20 votes) ──
    const sorted = [...myVotes].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const buckets = [];
    const SIZE = 20;
    for (let i = 0; i < sorted.length; i += SIZE) {
      const slice = sorted.slice(i, i + SIZE);
      const acc = (slice.filter(v => v.was_correct).length / slice.length * 100).toFixed(1);
      buckets.push({ vote: i + SIZE, accuracy: parseFloat(acc) });
    }
    setAccuracyOverTime(buckets);

    // ── Leaderboard ──
    const lb = profiles.slice(0, 50).map((p, i) => ({
      rank: i + 1,
      username: p.username || p.user_email?.split('@')[0] || '—',
      points: p.points || 0,
      tier: p.tier || 'bronze',
      accuracy: p.bot_accuracy ? ((p.bot_accuracy + (p.human_accuracy || 0)) / 2).toFixed(1) : '—',
      votes: (p.bot_votes_count || 0) + (p.human_votes_count || 0),
      streak: p.perfect_streak || 0,
      isMe: p.user_email === user.email,
    }));
    setLeaderboard(lb);
    setUserRank(lb.find(p => p.isMe)?.rank || profiles.length);

    // Top 10 for comparison chart
    setTopPlayers(lb.slice(0, 10).map(p => ({
      name: p.username.slice(0, 10),
      points: p.points,
      votes: p.votes,
    })));

    // ── Image stats ──
    const botImages = allImages.filter(img => img.is_bot);
    const humanImages = allImages.filter(img => !img.is_bot);
    const genderDist = ['male', 'female', 'unknown'].map(g => ({
      name: g, value: allImages.filter(img => img.gender === g).length
    }));

    // Per-image vote accuracy
    const votesByImage = {};
    allVotes.forEach(v => {
      if (!votesByImage[v.image_id]) votesByImage[v.image_id] = { total: 0, correct: 0 };
      votesByImage[v.image_id].total++;
      if (v.was_correct) votesByImage[v.image_id].correct++;
    });
    const imageDifficulty = Object.entries(votesByImage)
      .filter(([, d]) => d.total >= 3)
      .map(([id, d]) => ({
        id,
        difficulty: 100 - (d.correct / d.total * 100),
        votes: d.total,
        img: allImages.find(i => i.id === id)
      }))
      .sort((a, b) => b.difficulty - a.difficulty);

    const hardest = imageDifficulty.slice(0, 5);
    const easiest = imageDifficulty.slice(-5).reverse();

    const overallAccuracy = allVotes.length
      ? (allVotes.filter(v => v.was_correct).length / allVotes.length * 100).toFixed(1)
      : 0;

    setImageStats({
      total: allImages.length,
      botCount: botImages.length,
      humanCount: humanImages.length,
      genderDist,
      hardest,
      easiest,
      totalVotes: allVotes.length,
      overallAccuracy,
      difficultyBuckets: [
        { range: 'Easy (0-25%)', count: imageDifficulty.filter(i => i.difficulty < 25).length },
        { range: 'Medium (25-50%)', count: imageDifficulty.filter(i => i.difficulty >= 25 && i.difficulty < 50).length },
        { range: 'Hard (50-75%)', count: imageDifficulty.filter(i => i.difficulty >= 50 && i.difficulty < 75).length },
        { range: 'Expert (75%+)', count: imageDifficulty.filter(i => i.difficulty >= 75).length },
      ]
    });

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Crunching the numbers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-8">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/20 via-zinc-950 to-emerald-950/10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-black mb-2">📊 Intelligence Dashboard</h1>
          <p className="text-zinc-400 text-sm">Deep analytics on players, images & real-world AI recognition benchmarks</p>
        </motion.div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Target} label="My Accuracy" value={`${userStats.accuracy}%`} color="emerald" delay={0} />
          <StatCard icon={Trophy} label="Global Rank" value={`#${userRank}`} sub={`of ${leaderboard.length}+ players`} color="amber" delay={0.05} />
          <StatCard icon={Zap} label="Best Streak" value={userStats.streak} color="violet" delay={0.1} />
          <StatCard icon={Star} label="Points" value={userStats.points.toLocaleString()} sub={`Tier: ${userStats.tier}`} color="pink" delay={0.15} />
        </div>

        <Tabs defaultValue="player" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-zinc-900 border border-zinc-800 mb-6">
            <TabsTrigger value="player"><Users className="w-3 h-3 mr-1 inline" />My Stats</TabsTrigger>
            <TabsTrigger value="leaderboard"><Trophy className="w-3 h-3 mr-1 inline" />Rankings</TabsTrigger>
            <TabsTrigger value="images"><Image className="w-3 h-3 mr-1 inline" />Images</TabsTrigger>
            <TabsTrigger value="realworld"><Brain className="w-3 h-3 mr-1 inline" />AI vs Human</TabsTrigger>
          </TabsList>

          {/* ── MY STATS ── */}
          <TabsContent value="player" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Radar */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Performance Radar</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart data={userStats.radarData}>
                      <PolarGrid stroke="#3f3f46" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 9 }} />
                      <Radar name="You" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.35} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Bot vs Human accuracy */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Bot vs Human Detection Accuracy</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={[
                      { name: 'Bot Detection', accuracy: parseFloat(userStats.botAccuracy), avg: 61.3 },
                      { name: 'Human Detection', accuracy: parseFloat(userStats.humanAccuracy), avg: 68.7 },
                      { name: 'Overall', accuracy: parseFloat(userStats.accuracy), avg: 64.8 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey="accuracy" name="You %" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avg" name="Platform Avg %" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Accuracy over time */}
            {accuracyOverTime.length > 2 && (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Accuracy Over Time (per 20 votes)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={accuracyOverTime}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="vote" tick={{ fill: '#71717a', fontSize: 10 }} label={{ value: 'Vote #', position: 'insideBottom', fill: '#71717a', fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} formatter={(v) => [`${v}%`, 'Accuracy']} />
                      <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                      <Line type="monotone" dataKey={() => 64.8} name="Avg" stroke="#f59e0b" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Correct/Incorrect Pie */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Correct vs Incorrect</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={[
                        { name: 'Correct', value: userStats.correct },
                        { name: 'Wrong', value: userStats.total - userStats.correct }
                      ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-center text-sm text-zinc-400 mt-2">{userStats.correct} / {userStats.total} correct</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 col-span-2">
                <CardHeader><CardTitle className="text-sm">Your Skill Profile</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Bot Detection Rate', value: userStats.botAccuracy, color: 'bg-violet-500' },
                    { label: 'Human Detection Rate', value: userStats.humanAccuracy, color: 'bg-emerald-500' },
                    { label: 'Overall Accuracy', value: userStats.accuracy, color: 'bg-sky-500' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-400">{item.label}</span>
                        <span className="text-white font-bold">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className={`h-full ${item.color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-zinc-800 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-400">Tier Status</span>
                      <Badge style={{ background: TIER_COLORS[userStats.tier], color: '#000' }} className="uppercase text-xs font-black">
                        {userStats.tier}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── LEADERBOARD ── */}
          <TabsContent value="leaderboard" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Top 10 — Points</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topPlayers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} width={70} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                      <Bar dataKey="points" fill="#a855f7" radius={[0, 4, 4, 0]} name="Points" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader><CardTitle className="text-sm">Top 10 — Vote Volume</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topPlayers} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis type="number" tick={{ fill: '#71717a', fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} width={70} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                      <Bar dataKey="votes" fill="#06b6d4" radius={[0, 4, 4, 0]} name="Votes" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Full leaderboard table */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-sm">Full Rankings — Top 50</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 text-xs uppercase tracking-wider">
                        <th className="text-left p-3">Rank</th>
                        <th className="text-left p-3">Player</th>
                        <th className="text-right p-3">Points</th>
                        <th className="text-right p-3">Votes</th>
                        <th className="text-right p-3">Accuracy</th>
                        <th className="text-right p-3">Streak</th>
                        <th className="text-center p-3">Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((p) => (
                        <tr key={p.rank}
                          className={`border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${p.isMe ? 'bg-violet-950/30 border-violet-800/50' : ''}`}
                        >
                          <td className="p-3 font-bold text-zinc-400">
                            {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : `#${p.rank}`}
                          </td>
                          <td className="p-3 font-medium text-white">{p.username}{p.isMe && <span className="ml-2 text-xs text-violet-400">(you)</span>}</td>
                          <td className="p-3 text-right text-amber-400 font-bold">{p.points.toLocaleString()}</td>
                          <td className="p-3 text-right text-sky-400">{p.votes}</td>
                          <td className="p-3 text-right text-emerald-400">{p.accuracy}%</td>
                          <td className="p-3 text-right text-violet-400">{p.streak}</td>
                          <td className="p-3 text-center">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: TIER_COLORS[p.tier] + '33', color: TIER_COLORS[p.tier], border: `1px solid ${TIER_COLORS[p.tier]}55` }}>
                              {p.tier}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── IMAGES ── */}
          <TabsContent value="images" className="space-y-6">
            {imageStats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard icon={Image} label="Total Images" value={imageStats.total.toLocaleString()} color="violet" />
                  <StatCard icon={Bot} label="AI-Generated" value={imageStats.botCount} sub={`${((imageStats.botCount / imageStats.total) * 100).toFixed(0)}% of pool`} color="pink" />
                  <StatCard icon={User} label="Real Humans" value={imageStats.humanCount} color="emerald" />
                  <StatCard icon={Eye} label="Total Votes Cast" value={imageStats.totalVotes.toLocaleString()} color="sky" />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Bot vs Human ratio */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader><CardTitle className="text-sm">Bot vs Human Ratio</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={[
                            { name: 'AI-Generated', value: imageStats.botCount },
                            { name: 'Real Humans', value: imageStats.humanCount }
                          ]} cx="50%" cy="50%" outerRadius={80} paddingAngle={4} dataKey="value">
                            <Cell fill="#a855f7" />
                            <Cell fill="#10b981" />
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                          <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Gender distribution */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader><CardTitle className="text-sm">Gender Distribution</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={imageStats.genderDist} cx="50%" cy="50%" outerRadius={80} paddingAngle={4} dataKey="value" nameKey="name">
                            {imageStats.genderDist.map((_, i) => <Cell key={i} fill={CHART_COLORS[i]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                          <Legend wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Difficulty buckets */}
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader><CardTitle className="text-sm">Image Difficulty Distribution</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={imageStats.difficultyBuckets}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                          <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 8 }} />
                          <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                          <Bar dataKey="count" name="Images" radius={[4, 4, 0, 0]}>
                            {imageStats.difficultyBuckets.map((_, i) => <Cell key={i} fill={['#10b981', '#f59e0b', '#f97316', '#ef4444'][i]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Hardest & Easiest images */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader><CardTitle className="text-sm">🔥 Hardest Images (most fooling)</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {imageStats.hardest.map((img, i) => (
                        <div key={i} className="flex items-center gap-3">
                          {img.img?.url && <img src={img.img.url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-zinc-400 truncate">{img.img?.is_bot ? '🤖 AI' : '👤 Human'} · {img.votes} votes</span>
                              <span className="text-red-400 font-bold">{img.difficulty.toFixed(0)}% fool rate</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full">
                              <div className="h-full bg-red-500 rounded-full" style={{ width: `${img.difficulty}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader><CardTitle className="text-sm">✅ Easiest Images (most obvious)</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {imageStats.easiest.map((img, i) => (
                        <div key={i} className="flex items-center gap-3">
                          {img.img?.url && <img src={img.img.url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-zinc-400 truncate">{img.img?.is_bot ? '🤖 AI' : '👤 Human'} · {img.votes} votes</span>
                              <span className="text-emerald-400 font-bold">{(100 - img.difficulty).toFixed(0)}% correct rate</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${100 - img.difficulty}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Overall accuracy banner */}
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="pt-5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                        <p className="text-zinc-400 text-sm mb-1">Platform-wide community accuracy</p>
                        <p className="text-4xl font-black text-white">{imageStats.overallAccuracy}<span className="text-xl text-zinc-400">%</span></p>
                        <p className="text-xs text-zinc-500 mt-1">Across {imageStats.totalVotes.toLocaleString()} total votes on {imageStats.total.toLocaleString()} images</p>
                      </div>
                      <div className="flex-1 max-w-sm">
                        <div className="h-4 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${imageStats.overallAccuracy}%` }} transition={{ duration: 1.2 }}
                            className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full" />
                        </div>
                        <div className="flex justify-between text-xs text-zinc-600 mt-1">
                          <span>Random (50%)</span><span>Perfect (100%)</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ── REAL WORLD ── */}
          <TabsContent value="realworld">
            <RealWorldComparison platformAccuracy={imageStats?.overallAccuracy} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}