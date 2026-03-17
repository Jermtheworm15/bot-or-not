import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Check, Copy, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InviteFriends from './InviteFriends';

const APP_URL = 'https://bot-not-now.base44.app';

export default function ProfileReferralSection({ userEmail, isOwnProfile }) {
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!userEmail) return;
    setReferralCode(userEmail);
    Promise.all([
      base44.entities.Referral.filter({ referrer_email: userEmail }),
      base44.entities.UserProfile.filter({ user_email: userEmail }),
    ]).then(([refs, profiles]) => {
      setReferrals(refs);
      setProfile(profiles[0] || null);
    }).catch(() => {});
  }, [userEmail]);

  const inviteLink = `${APP_URL}?ref=${encodeURIComponent(referralCode)}`;
  const inviteText = `Can you spot AI? Use my code ${referralCode} to get 100 bonus tokens: ${inviteLink}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  const completed = referrals.filter(r => r.status === 'completed' || r.rewarded_signup).length;
  const pending = referrals.filter(r => !r.rewarded_signup && r.referred_email).length;

  return (
    <Card className="bg-zinc-900 border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-green-400" />
          Referrals
          {completed > 0 && (
            <span className="ml-auto text-xs bg-green-900/50 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full">
              {completed} completed
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-zinc-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-green-400">{referrals.length}</p>
            <p className="text-xs text-zinc-500">Total Invited</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-yellow-400">{completed}</p>
            <p className="text-xs text-zinc-500">Completed</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-purple-400">{completed * 100}</p>
            <p className="text-xs text-zinc-500">Tokens Earned</p>
          </div>
        </div>

        {isOwnProfile && (
          <>
            {/* Referral code display */}
            <div>
              <p className="text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Your invite message</p>
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3 relative">
                <p className="text-xs text-green-400 leading-relaxed pr-8">{inviteText}</p>
                <button
                  onClick={copyCode}
                  className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Share button */}
            <InviteFriends compact={false} />

            {/* How it works */}
            <div className="bg-zinc-800/50 rounded-xl p-3 space-y-1.5">
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2">How it works</p>
              {[
                ['1️⃣', 'Share your invite link with friends'],
                ['2️⃣', 'Friend signs up using your link'],
                ['3️⃣', 'Friend casts their first vote'],
                ['4️⃣', 'You both instantly get 100 tokens 🪙'],
              ].map(([emoji, text]) => (
                <div key={emoji} className="flex items-center gap-2 text-xs text-zinc-400">
                  <span>{emoji}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}