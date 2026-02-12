import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Flame, Upload } from 'lucide-react';

export default function TopShowcase() {
  const [streaks, setStreaks] = useState([]);
  const [uploads, setUploads] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load top 10 streaks
    const votes = await base44.entities.Vote.list('-created_date', 100);
    const videoVotes = await base44.entities.VideoVote.list('-created_date', 100);
    
    const allVotes = [...votes, ...videoVotes];
    const userStreaks = {};
    
    allVotes.forEach(vote => {
      if (!vote.user_email) return;
      
      if (!userStreaks[vote.user_email]) {
        userStreaks[vote.user_email] = {
          email: vote.user_email,
          currentStreak: 0,
          bestStreak: 0
        };
      }
      
      const user = userStreaks[vote.user_email];
      
      if (vote.was_correct) {
        user.currentStreak++;
        if (user.currentStreak > user.bestStreak) {
          user.bestStreak = user.currentStreak;
        }
      } else {
        user.currentStreak = 0;
      }
    });
    
    const topStreaks = Object.values(userStreaks)
      .filter(u => u.bestStreak > 0)
      .sort((a, b) => b.bestStreak - a.bestStreak)
      .slice(0, 10);
    
    setStreaks(topStreaks);

    // Load user uploaded content
    const images = await base44.entities.Image.filter({ user_uploaded: true }, '-created_date', 20);
    const videos = await base44.entities.Video.filter({ user_uploaded: true }, '-created_date', 20);
    
    const combined = [...images.map(i => ({...i, type: 'image'})), ...videos.map(v => ({...v, type: 'video'}))]
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
    
    setUploads(combined);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/20 via-black/40 to-green-900/20 border-b border-purple-500/30 backdrop-blur-sm">
      <div className="flex animate-scroll">
        {/* Streaks Section */}
        {streaks.map((user, idx) => (
          <div key={`streak-${idx}`} className="flex-shrink-0 px-3 py-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-green-400 font-bold">{user.bestStreak}</span>
            <span className="text-purple-300 text-sm">{user.email.split('@')[0]}</span>
          </div>
        ))}
        
        {/* Uploads Section */}
        {uploads.map((item, idx) => (
          <div key={`upload-${idx}`} className="flex-shrink-0 px-3 py-2 flex items-center gap-2">
            <Upload className="w-4 h-4 text-purple-400" />
            <div className="w-8 h-8 rounded overflow-hidden border border-green-500/50">
              {item.type === 'image' ? (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={item.url} className="w-full h-full object-cover" muted />
              )}
            </div>
            <span className="text-green-300 text-sm">{item.uploader_name}</span>
          </div>
        ))}
        
        {/* Duplicate for seamless scroll */}
        {streaks.map((user, idx) => (
          <div key={`streak-dup-${idx}`} className="flex-shrink-0 px-3 py-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="text-green-400 font-bold">{user.bestStreak}</span>
            <span className="text-purple-300 text-sm">{user.email.split('@')[0]}</span>
          </div>
        ))}
        
        {uploads.map((item, idx) => (
          <div key={`upload-dup-${idx}`} className="flex-shrink-0 px-3 py-2 flex items-center gap-2">
            <Upload className="w-4 h-4 text-purple-400" />
            <div className="w-8 h-8 rounded overflow-hidden border border-green-500/50">
              {item.type === 'image' ? (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <video src={item.url} className="w-full h-full object-cover" muted />
              )}
            </div>
            <span className="text-green-300 text-sm">{item.uploader_name}</span>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          display: flex;
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </div>
  );
}