import React from 'react';

export default function AppFooter({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-600 py-4 px-4 ${className}`}>
      <a
        href="https://www.privacypolicies.com/live/bot-or-not"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-zinc-400 transition-colors underline underline-offset-2 min-h-[44px] flex items-center"
      >
        Privacy Policy
      </a>
      <span>·</span>
      <a
        href="https://www.privacypolicies.com/live/bot-or-not-tos"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-zinc-400 transition-colors underline underline-offset-2 min-h-[44px] flex items-center"
      >
        Terms of Service
      </a>
      <span>·</span>
      <span className="text-zinc-500">Rated 13+</span>
      <span>·</span>
      <span className="text-zinc-600">© {new Date().getFullYear()} Bot or Not</span>
    </div>
  );
}