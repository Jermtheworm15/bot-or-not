import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Gauge, AlertCircle } from 'lucide-react';

const getSessionId = () => {
  let sid = localStorage.getItem('bot_difficulty_session');
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('bot_difficulty_session', sid);
  }
  return sid;
};

const difficultyLabel = (r) => {
  if (r >= 9) return { text: 'Impossible', color: 'text-red-400' };
  if (r >= 7) return { text: 'Very Hard', color: 'text-orange-400' };
  if (r >= 5) return { text: 'Tricky', color: 'text-yellow-400' };
  if (r >= 3) return { text: 'Moderate', color: 'text-lime-400' };
  return { text: 'Easy', color: 'text-green-400' };
};

export default function DifficultyRating({ imageId, onRated, onSkip }) {
  const [rating, setRating] = useState(5.0);
  const [hasRated, setHasRated] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [avgRating, setAvgRating] = useState(null);
  const [voteCount, setVoteCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  // Track auto-advance timer so it can be cleared on unmount / imageId change
  const autoAdvanceTimer = useRef(null);
  // Prevent onRated from firing more than once per image
  const onRatedFired = useRef(false);

  // Reset per-image state when imageId changes
  useEffect(() => {
    onRatedFired.current = false;
    setSubmitError(null);
    setIsSubmitting(false);
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [imageId]);

  useEffect(() => {
    base44.auth.me().then(u => setUserEmail(u?.email || null)).catch(() => setUserEmail(null));
  }, []);

  useEffect(() => {
    if (!imageId) return;
    loadVoteData();
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [imageId, userEmail]);

  const fireOnRated = () => {
    if (onRatedFired.current) return;
    onRatedFired.current = true;
    console.log('[DifficultyRating] navigation started');
    if (onRated) onRated();
    console.log('[DifficultyRating] navigation completed');
  };

  const loadVoteData = async () => {
    setIsLoading(true);
    try {
      const votes = await base44.entities.ImageDifficultyVote.filter({ image_id: imageId });
      setVoteCount(votes.length);

      if (votes.length > 0) {
        const avg = votes.reduce((sum, v) => sum + (v.difficulty_rating || 0), 0) / votes.length;
        setAvgRating(Math.round(avg * 10) / 10);
      } else {
        setAvgRating(null);
      }

      const sessionId = getSessionId();
      const myVote = votes.find(v =>
        (userEmail && v.user_id === userEmail) ||
        v.session_id === sessionId
      );

      if (myVote) {
        setHasRated(true);
        setMyRating(myVote.difficulty_rating);
        setRating(myVote.difficulty_rating);
        // Already rated — auto-advance after brief display
        autoAdvanceTimer.current = setTimeout(fireOnRated, 1500);
      } else {
        setHasRated(false);
      }
    } catch (err) {
      console.log('[DifficultyRating] load error:', err);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return; // prevent double-tap
    setIsSubmitting(true);
    setSubmitError(null);
    console.log('[DifficultyRating] submit started, imageId:', imageId, 'rating:', rating);

    try {
      console.log('[DifficultyRating] save started');
      const sessionId = getSessionId();
      await base44.entities.ImageDifficultyVote.create({
        image_id: imageId,
        user_id: userEmail || null,
        session_id: sessionId,
        difficulty_rating: rating
      });
      console.log('[DifficultyRating] save succeeded');

      // Update state locally — no re-fetch needed, avoids double-fire of onRated
      const newCount = voteCount + 1;
      const newAvg = avgRating !== null
        ? Math.round(((avgRating * voteCount) + rating) / newCount * 10) / 10
        : rating;
      setVoteCount(newCount);
      setAvgRating(newAvg);
      setMyRating(rating);
      setHasRated(true);

      fireOnRated();
    } catch (err) {
      console.error('[DifficultyRating] save failed:', err);
      setSubmitError('Could not save rating. Tap "Retry" or skip.');
      setIsSubmitting(false); // unstick so user can retry
    }
  };

  if (isLoading) return null;

  const label = difficultyLabel(hasRated ? (myRating || rating) : rating);

  return (
    <div className="mt-2 p-3 bg-black/50 border border-purple-500/20 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <Gauge className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-green-400 text-xs uppercase tracking-wider font-bold">Difficulty Rating</span>
      </div>

      {!hasRated ? (
        <>
          <p className="text-green-400/60 text-xs mb-3">How hard was it to tell bot from human?</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-500/50 text-xs shrink-0">Easy</span>
            <Slider
              value={[rating]}
              onValueChange={([val]) => setRating(Math.round(val * 10) / 10)}
              min={1}
              max={10}
              step={0.1}
              className="flex-1"
            />
            <span className="text-green-500/50 text-xs shrink-0">Hard</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-bold ${label.color}`}>{rating.toFixed(1)}</span>
              <span className="text-green-500/40 text-xs">/ 10</span>
              <span className={`text-xs ml-1 ${label.color}`}>· {label.text}</span>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              size="sm"
              className="bg-purple-700 hover:bg-purple-600 text-white text-xs h-7 px-3"
            >
              {isSubmitting ? 'Saving…' : 'Rate'}
            </Button>
          </div>
          {submitError && (
            <div className="flex items-center justify-between mt-2 p-2 bg-red-900/30 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-red-400 text-xs">{submitError}</span>
              </div>
              <button
                onClick={handleSubmit}
                className="text-red-400 hover:text-red-300 text-xs underline ml-2 shrink-0"
              >
                Retry
              </button>
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            {voteCount > 0 && avgRating !== null ? (
              <p className="text-green-500/30 text-xs">{voteCount} rating{voteCount !== 1 ? 's' : ''} · avg {avgRating.toFixed(1)}</p>
            ) : <span />}
            {onSkip && !submitError && (
              <button onClick={() => { fireOnRated(); }} className="text-green-500/30 hover:text-green-400/60 text-xs transition-colors underline">
                Skip rating
              </button>
            )}
            {submitError && onSkip && (
              <button onClick={() => { fireOnRated(); }} className="text-green-500/30 hover:text-green-400/60 text-xs transition-colors underline ml-auto">
                Skip
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="flex justify-between items-start">
          <div>
            <p className="text-green-400/50 text-xs mb-0.5">Community average</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-bold ${avgRating !== null ? difficultyLabel(avgRating).color : 'text-green-400'}`}>
                {avgRating !== null ? avgRating.toFixed(1) : '—'}
              </span>
              <span className="text-green-500/40 text-xs">/ 10</span>
            </div>
            <p className="text-green-500/40 text-xs mt-0.5">{voteCount} vote{voteCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="text-right">
            <p className="text-green-400/50 text-xs mb-0.5">Your rating</p>
            <div className="flex items-baseline gap-1 justify-end">
              <span className={`text-2xl font-bold ${label.color}`}>{(myRating || rating).toFixed(1)}</span>
            </div>
            <p className={`text-xs ${label.color}`}>{label.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}