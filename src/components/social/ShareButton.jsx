import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Share2, X, Instagram, Twitter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

export default function ShareButton({ contentUrl, contentType, isBot, wasCorrect, userStats = null }) {
  const [showShare, setShowShare] = useState(false);
  const [shareMode, setShareMode] = useState('result');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const appUrl = window.location.origin;
  const shareText = wasCorrect 
    ? `I correctly guessed this ${isBot ? 'AI bot' : 'human'} on Bot or Not! Can you?` 
    : `This ${isBot ? 'AI bot' : 'human'} tricked me on Bot or Not! Think you can spot it?`;
  
  const statsText = userStats 
    ? `🏆 Check out my Bot or Not stats: ${userStats.totalVotes} votes, ${userStats.accuracy?.toFixed(0)}% accuracy, ${userStats.streak} streak! Can you beat my score?`
    : `🏆 Join me on Bot or Not! Test your AI detection skills!`;
  
  const challengeText = `🎯 I CHALLENGE YOU! Can you spot if this is a bot or human? Test your skills on Bot or Not!`;
  
  const shareUrl = `${appUrl}?challenge=${encodeURIComponent(contentUrl)}`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Bot or Not Challenge',
          text: shareText,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      setShowShare(true);
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
  };

  const statsLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(statsText)}&url=${encodeURIComponent(appUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(statsText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(appUrl)}&title=${encodeURIComponent(statsText)}`
  };
  
  const challengeLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(challengeText)}&url=${encodeURIComponent(appUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(challengeText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(appUrl)}&title=${encodeURIComponent(challengeText)}`
  };

  const copyToClipboard = () => {
   navigator.clipboard.writeText(shareUrl);
  };

  const generateBrandedImage = async (platform) => {
    setIsGenerating(true);
    try {
      // Create temporary canvas element
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      // Platform-specific dimensions
      const dimensions = {
        instagram: { width: 1080, height: 1080 },
        tiktok: { width: 1080, height: 1920 },
        twitter: { width: 1200, height: 675 }
      };

      const { width, height } = dimensions[platform];
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;

      // Create branded content
      container.innerHTML = `
        <div style="width: ${width}px; height: ${height}px; background: linear-gradient(135deg, #1a1a1a 0%, #2d1b4e 50%, #1a3a2e 100%); position: relative; font-family: system-ui, -apple-system, sans-serif; overflow: hidden;">
          <!-- Cyberpunk grid background -->
          <div style="position: absolute; inset: 0; background-image: linear-gradient(rgba(147, 51, 234, 0.1) 2px, transparent 2px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 2px, transparent 2px); background-size: 40px 40px;"></div>
          
          <!-- Content Image/Video -->
          <div style="position: absolute; top: ${platform === 'tiktok' ? '15%' : '50%'}; left: 50%; transform: translate(-50%, -50%); width: ${platform === 'tiktok' ? '80%' : '70%'}; aspect-ratio: ${contentType === 'video' ? '9/16' : '1/1'}; border-radius: 24px; overflow: hidden; border: 4px solid rgba(147, 51, 234, 0.5); box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
            <img src="${contentUrl}" style="width: 100%; height: 100%; object-fit: cover;" crossorigin="anonymous" />
            <div style="position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);"></div>
            <div style="position: absolute; top: 20px; right: 20px; background: ${isBot ? '#9333ea' : '#22c55e'}; color: white; padding: 12px 24px; border-radius: 999px; font-weight: 900; font-size: ${platform === 'tiktok' ? '28px' : '24px'}; text-transform: uppercase;">
              ${isBot ? '🤖 BOT' : '👤 HUMAN'}
            </div>
          </div>
          
          <!-- Result Badge -->
          <div style="position: absolute; ${platform === 'tiktok' ? 'top: 55%' : 'bottom: 25%'}; left: 50%; transform: translateX(-50%); background: ${wasCorrect ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)'}; color: white; padding: 20px 40px; border-radius: 20px; font-weight: 900; font-size: ${platform === 'tiktok' ? '48px' : '36px'}; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
            ${wasCorrect ? '✓ CORRECT!' : '✗ WRONG!'}
          </div>
          
          <!-- Call to Action -->
          <div style="position: absolute; bottom: ${platform === 'tiktok' ? '12%' : '10%'}; left: 50%; transform: translateX(-50%); text-align: center; width: 90%;">
            <div style="color: white; font-size: ${platform === 'tiktok' ? '36px' : '28px'}; font-weight: 700; text-shadow: 0 2px 20px rgba(0,0,0,0.8); margin-bottom: 16px;">
              Can you spot the AI?
            </div>
            <div style="color: #22c55e; font-size: ${platform === 'tiktok' ? '32px' : '24px'}; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; text-shadow: 0 0 20px rgba(34, 197, 94, 0.8);">
              BOT OR NOT
            </div>
          </div>
          
          <!-- Decorative elements -->
          <div style="position: absolute; top: 20px; left: 20px; width: 60px; height: 60px; border: 3px solid #9333ea; border-radius: 12px; transform: rotate(12deg);"></div>
          <div style="position: absolute; bottom: 20px; right: 20px; width: 60px; height: 60px; border: 3px solid #22c55e; border-radius: 12px; transform: rotate(-12deg);"></div>
        </div>
      `;

      // Wait for image to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Generate canvas
      const canvas = await html2canvas(container, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      document.body.removeChild(container);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bot-or-not-${platform}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      });
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Failed to generate image. Please try again.');
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleNativeShare}
        variant="outline"
        className="border-purple-500/50 text-purple-400 hover:bg-purple-900/30 hover:text-white"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share Result
      </Button>

      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowShare(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Share</h3>
                <button onClick={() => setShowShare(false)} className="text-zinc-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Share Mode Toggle */}
              {userStats && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setShareMode('result')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      shareMode === 'result'
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    This Result
                  </button>
                  <button
                    onClick={() => setShareMode('stats')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      shareMode === 'stats'
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    Your Stats
                  </button>
                </div>
              )}

              <p className="text-zinc-400 text-sm mb-6">{shareMode === 'result' ? shareText : statsText}</p>

              {/* Challenge Friends Section */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-green-900/30 border border-purple-500/30 rounded-lg">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                  🎯 Challenge Your Friends
                </h4>
                <p className="text-zinc-400 text-xs mb-3">Dare them to beat your score!</p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={challengeLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter
                  </a>
                  <a
                    href={challengeLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                </div>
              </div>

              {/* One-tap branded downloads */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3 text-sm">Download Branded Content</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => generateBrandedImage('instagram')}
                    disabled={isGenerating}
                    className="flex flex-col items-center gap-2 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white py-3 px-3 rounded-lg font-medium transition-all"
                  >
                    <Instagram className="w-5 h-5" />
                    <span className="text-xs">Instagram</span>
                  </button>
                  
                  <button
                    onClick={() => generateBrandedImage('tiktok')}
                    disabled={isGenerating}
                    className="flex flex-col items-center gap-2 bg-black hover:bg-zinc-900 disabled:opacity-50 text-white py-3 px-3 rounded-lg font-medium transition-all border border-white/20"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                    <span className="text-xs">TikTok</span>
                  </button>
                  
                  <button
                    onClick={() => generateBrandedImage('twitter')}
                    disabled={isGenerating}
                    className="flex flex-col items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white py-3 px-3 rounded-lg font-medium transition-all"
                  >
                    <Twitter className="w-5 h-5" />
                    <span className="text-xs">X/Twitter</span>
                  </button>
                </div>
                {isGenerating && (
                  <p className="text-center text-purple-400 text-xs mt-2">Generating image...</p>
                )}
              </div>

              <div className="border-t border-zinc-800 pt-4 mb-4">
               <h4 className="text-white font-semibold mb-3 text-sm">Share Your {shareMode === 'result' ? 'Result' : 'Stats'}</h4>
               <div className="grid grid-cols-2 gap-3">
               <a
                 href={shareMode === 'result' ? shareLinks.twitter : statsLinks.twitter}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
               >
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                   <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                 </svg>
                 Twitter
               </a>

               <a
                 href={shareMode === 'result' ? shareLinks.facebook : statsLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </a>

                <a
                   href={shareMode === 'result' ? shareLinks.linkedin : statsLinks.linkedin}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                 >
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                   </svg>
                   LinkedIn
                 </a>

                 <a
                   href={shareMode === 'result' ? shareLinks.reddit : statsLinks.reddit}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                  Reddit
                </a>
                </div>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Copy Link
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}