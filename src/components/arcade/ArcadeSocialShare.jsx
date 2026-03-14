import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ArcadeSocialShare({ score, gameName, level }) {
  const shareText = `🎮 I just scored ${score} points on ${gameName} (Level ${level})! Can you beat that? Play now on Bot or Not!`;
  const shareUrl = window.location.origin;

  const handleShare = (platform) => {
    let url;
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      default:
        // Native share
        if (navigator.share) {
          navigator.share({
            title: 'Bot or Not - Arcade',
            text: shareText,
            url: shareUrl
          }).catch(() => {});
        } else {
          navigator.clipboard.writeText(shareText + ' ' + shareUrl);
          toast.success('Copied to clipboard!');
        }
        return;
    }

    window.open(url, '_blank', 'width=600,height=400');
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        onClick={() => handleShare('native')}
        variant="outline"
        className="border-green-500/30 text-green-400 hover:bg-green-900/30 cursor-pointer"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>
      <Button
        onClick={() => handleShare('twitter')}
        variant="outline"
        className="border-blue-500/30 text-blue-400 hover:bg-blue-900/30 cursor-pointer"
      >
        <Twitter className="w-4 h-4 mr-2" />
        Tweet
      </Button>
      <Button
        onClick={() => handleShare('facebook')}
        variant="outline"
        className="border-blue-600/30 text-blue-600 hover:bg-blue-900/30 cursor-pointer"
      >
        <Facebook className="w-4 h-4 mr-2" />
        Share
      </Button>
      <Button
        onClick={() => handleShare('whatsapp')}
        variant="outline"
        className="border-green-600/30 text-green-600 hover:bg-green-900/30 cursor-pointer"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        WhatsApp
      </Button>
    </div>
  );
}