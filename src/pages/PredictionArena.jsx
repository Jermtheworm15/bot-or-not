import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Trophy, Timer, Users, TrendingUp, TrendingDown, Shield, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ROUND_SECONDS = 10;

function ConfidenceMeter({ pct, label, color }) {
  return (
    <div className="flex-1">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="font-black" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function PredictionArena() {
  const [image, setImage] = useState(null);
  const [images, setImages] = useState([]);
  const [voted, setVoted] = useState(false);
  const [guess, setGuess] = useState(null);
  const [correct, setCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const [liveVotes, setLiveVotes] = useState({ bot: 0, human: 0 });
  const [crowdVotes, setCrowdVotes] = useState({ bot: 0, human: 0 });
  const [roundScore, setRoundScore] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [powerUp, setPowerUp] = useState(null); // 'double' | 'shield' | null
  const [tokens, setTokens] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    init();
    return () => clearInterval(timerRef.current);
  }, []);

  const init = async () => {
    const u = await base44.auth.me();
    setUser(u);
    const wallets = await base44.entities.TokenWallet.filter({ user_email: u.email });
    setTokens(wallets[0]?.balance || 0);
    const imgs = await base44.entities.Image.list('-created_date', 300);
    const valid = imgs.filter(i => i.url && typeof i.is_bot === 'boolean');
    setImages(valid);
    startRound(valid);
    setLoading(false);
  };

  const startRound = (pool = images) => {
    clearInterval(timerRef.current);
    if (!pool.length) return;
    const idx = Math.floor(Math.random() * pool.length);
    const img = pool[idx];
    setImage(img);
    setVoted(false);
    setGuess(null);
    setCorrect(null);
    setShowResult(false);
    setTimeLeft(ROUND_SECONDS);

    // Simulate live crowd votes building up
    const botBias = img.is_bot ? 0.55 : 0.35;
    setLiveVotes({ bot: 0, human: 0 });

    setTimerActive(true);
    let t = ROUND_SECONDS;
    let botVotes = 0, humanVotes = 0;
    timerRef.current = setInterval(() => {
      t -= 1;
      // Add random crowd votes each second
      const newBotVotes = Math.floor(Math.random() * 20 * botBias);
      const newHumanVotes = Math.floor(Math.random() * 20 * (1 - botBias));
      botVotes += newBotVotes;
      humanVotes += newHumanVotes;
      setLiveVotes({ bot: botVotes, human: humanVotes });
      setTimeLeft(t);
      if (t <= 0) {
        clearInterval(timerRef.current);
        setTimerActive(false);
        // Auto-reveal if not voted
        setVoted(v => {
          if (!v) {
            setShowResult(true);
          }
          return v || true;
        });
      }
    }, 1000);

    setRound(r => r + 1);
  };

  const handleVote = async (isBot) => {
    if (voted || !image) return;
    clearInterval(timerRef.current);
    setTimerActive(false);
    setGuess(isBot);
    setVoted(true);

    const isCorrect = isBot === image.is_bot;
    setCorrect(isCorrect);
    setShowResult(true);

    // Score: faster = more points. Shield protects against loss.
    const speedBonus = Math.max(1, timeLeft);
    let points = 0;
    if (isCorrect) {
      points = 10 + speedBonus * 3;
      if (powerUp === 'double') points *= 2;
      setStreak(s => s + 1);
    } else {
      points = powerUp === 'shield' ? 0 : -5;
      setStreak(0);
    }
    setPowerUp(null);
    setRoundScore(points);
    setSessionScore(s => s + points);

    // Fetch real crowd votes for this image
    const realVotes = await base44.entities.Vote.filter({ image_id: image.id });
    const botReal = realVotes.filter(v => v.guessed_bot).length;
    const humanReal = realVotes.length - botReal;
    setCrowdVotes({ bot: botReal, human: humanReal });

    // Save vote
    if (user) {
      await base44.entities.Vote.create({
        image_id: image.id,
        guess: isBot ? 'bot' : 'human',
        guessed_bot: isBot,
        was_correct: isCorrect,
        user_email: user.email,
        reaction_time: (ROUND_SECONDS - timeLeft) * 1000
      });
    }
  };

  const usePowerUp = (type) => {
    if (voted) return;
    setPowerUp(p => p === type ? null : type);
  };

  const totalLive = liveVotes.bot + liveVotes.human || 1;
  const botPct = (liveVotes.bot / totalLive) * 100;
  const humanPct = (liveVotes.human / totalLive) * 100;
  const totalCrowd = crowdVotes.bot + crowdVotes.human || 1;
  const crowdBotPct = (crowdVotes.bot / totalCrowd) * 100;
  const crowdHumanPct = (crowdVotes.human / totalCrowd) * 100;

  const timerColor = timeLeft > 6 ? '#22c55e' : timeLeft > 3 ? '#f59e0b' : '#ef4444';

  if (loading) return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-28">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-cyan-950/20 pointer-events-none" />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-black flex items-center justify-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />Prediction Arena
          </h1>
          <p className="text-zinc-500 text-xs mt-1">Vote before the timer runs out — earn speed bonuses</p>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Score', value: sessionScore, color: sessionScore >= 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: 'Streak', value: `${streak}🔥`, color: 'text-orange-400' },
            { label: 'Round', value: round, color: 'text-violet-400' },
            { label: 'Tokens', value: tokens, color: 'text-amber-400' },
          ].map((s, i) => (
            <div key={i} className="bg-zinc-900 rounded-xl p-2 border border-zinc-800">
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-zinc-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center gap-3">
          <Timer className="w-4 h-4" style={{ color: timerColor }} />
          <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: timerColor }}
              animate={{ width: `${(timeLeft / ROUND_SECONDS) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="font-black tabular-nums w-6 text-center" style={{ color: timerColor }}>{timeLeft}</span>
        </div>

        {/* Image */}
        {image && (
          <div className="relative rounded-2xl overflow-hidden border border-zinc-800">
            <img src={image.url} alt="Predict" className="w-full object-cover" style={{ maxHeight: 380 }} />
            {/* Live vote overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
              <div className="flex gap-3">
                <ConfidenceMeter pct={botPct} label={`🤖 ${liveVotes.bot} votes`} color="#a855f7" />
                <ConfidenceMeter pct={humanPct} label={`👤 ${liveVotes.human} votes`} color="#22c55e" />
              </div>
            </div>
            {/* Result overlay */}
            <AnimatePresence>
              {showResult && correct !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`absolute inset-0 flex flex-col items-center justify-center ${correct ? 'bg-emerald-950/80' : 'bg-red-950/80'}`}
                >
                  <p className="text-4xl mb-2">{correct ? '✅' : '❌'}</p>
                  <p className="text-xl font-black text-white">{image.is_bot ? 'AI Generated' : 'Real Human'}</p>
                  <p className={`text-2xl font-black mt-1 ${roundScore >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {roundScore >= 0 ? '+' : ''}{roundScore} pts
                  </p>
                  {streak > 1 && <p className="text-sm text-orange-400 mt-1">🔥 {streak} streak!</p>}
                  <p className="text-xs text-zinc-400 mt-2">Crowd: {crowdBotPct.toFixed(0)}% said AI · {crowdHumanPct.toFixed(0)}% said Human</p>
                </motion.div>
              )}
              {showResult && correct === null && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
                  <p className="text-xl font-black text-zinc-400">⏰ Time's up! It was {image.is_bot ? 'AI' : 'Human'}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Power-ups */}
        {!voted && (
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => usePowerUp('double')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                powerUp === 'double' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-amber-600'
              }`}
            >
              <Star className="w-3 h-3" />2x Points
            </button>
            <button
              onClick={() => usePowerUp('shield')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                powerUp === 'shield' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-blue-600'
              }`}
            >
              <Shield className="w-3 h-3" />Shield
            </button>
            {powerUp && <span className="text-[10px] text-zinc-500 self-center">Power-up active!</span>}
          </div>
        )}

        {/* Vote Buttons */}
        {!voted ? (
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote(true)}
              className="py-5 rounded-2xl font-black text-lg bg-gradient-to-br from-violet-700 to-violet-900 border border-violet-600/50 hover:from-violet-600 hover:to-violet-800 transition-all shadow-lg shadow-violet-900/40"
            >
              🤖 AI Bot
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote(false)}
              className="py-5 rounded-2xl font-black text-lg bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-600/50 hover:from-emerald-600 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-900/40"
            >
              👤 Human
            </motion.button>
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => startRound()}
            className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-violet-600 to-cyan-600 hover:opacity-90 transition-opacity"
          >
            ⚡ Next Round
          </motion.button>
        )}

        {/* Real-time crowd stats after vote */}
        <AnimatePresence>
          {showResult && crowdVotes.bot + crowdVotes.human > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Real Community Votes ({crowdVotes.bot + crowdVotes.human} total)
                  </p>
                  <div className="flex gap-3">
                    <ConfidenceMeter pct={crowdBotPct} label="Said AI" color="#a855f7" />
                    <ConfidenceMeter pct={crowdHumanPct} label="Said Human" color="#22c55e" />
                  </div>
                  <p className="text-[10px] text-zinc-600 text-center">
                    Crowd was {crowdBotPct > 50 ? (image?.is_bot ? '✅ correct' : '❌ wrong') : (image?.is_bot ? '❌ wrong' : '✅ correct')} as a hive
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}