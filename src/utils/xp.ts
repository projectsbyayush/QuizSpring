import type { Difficulty } from '../types';

export const XP_PER_CORRECT: Record<Difficulty, number> = {
  Easy: 10,
  Medium: 20,
  Hard: 30,
};

export function levelForXp(totalXp: number): number {
  if (totalXp < 0) return 1;
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

export function xpProgress(totalXp: number): { level: number; current: number; needed: number; pct: number } {
  const level = levelForXp(totalXp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const current = totalXp - base;
  const needed = next - base;
  return { level, current, needed, pct: needed === 0 ? 100 : Math.min(100, (current / needed) * 100) };
}

export function accuracy(correct: number, answered: number): number {
  if (answered === 0) return 0;
  return Math.round((correct / answered) * 1000) / 10;
}

export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return '—';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
}
