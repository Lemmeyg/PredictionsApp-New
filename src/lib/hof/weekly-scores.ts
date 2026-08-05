import type { RoundScore } from '@/lib/predictions/round-scores'

export interface WeeklyScoreEntry {
  season: string
  weekNumber: number
  playerName: string
  score: number
}

export function toWeeklyScoreEntries(
  roundScores: RoundScore[],
  seasonLabel: string
): WeeklyScoreEntry[] {
  return roundScores.map((score) => ({
    season: seasonLabel,
    weekNumber: score.round,
    playerName: score.displayName,
    score: score.points,
  }))
}

export function topWeeklyScores(
  historical: WeeklyScoreEntry[],
  live: WeeklyScoreEntry[],
  limit: number
): WeeklyScoreEntry[] {
  return [...historical, ...live].sort((a, b) => b.score - a.score).slice(0, limit)
}
