// Shared progression system — single source of truth

export const LEVEL_THRESHOLDS = [
  { level: 1, min: 0,       max: 500,    label: 'Rookie' },
  { level: 2, min: 501,     max: 1500,   label: 'Apprentice' },
  { level: 3, min: 1501,    max: 5000,   label: 'Challenger' },
  { level: 4, min: 5001,    max: 15000,  label: 'Expert' },
  { level: 5, min: 15001,   max: 40000,  label: 'Master' },
  { level: 6, min: 40001,   max: 100000, label: 'Grand Master' },
  { level: 7, min: 100001,  max: Infinity, label: 'Legend' },
];

export function getLevel(points) {
  const p = points || 0;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (p >= LEVEL_THRESHOLDS[i].min) return LEVEL_THRESHOLDS[i].level;
  }
  return 1;
}

export function getTier(level) {
  if (level >= 7) return 'platinum';
  if (level >= 5) return 'gold';
  if (level >= 3) return 'silver';
  return 'bronze';
}

export function getLevelInfo(level) {
  return LEVEL_THRESHOLDS.find(t => t.level === level) || LEVEL_THRESHOLDS[0];
}

export function getProgressToNextLevel(points) {
  const p = points || 0;
  const currentLevel = getLevel(p);
  const current = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
  const next = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  if (!next) return { progress: 100, pointsInLevel: 0, pointsNeeded: 0 };
  const pointsInLevel = p - current.min;
  const pointsNeeded = next.min - current.min;
  return {
    progress: Math.min(100, Math.round((pointsInLevel / pointsNeeded) * 100)),
    pointsInLevel,
    pointsNeeded,
    nextLevel: next.level,
  };
}