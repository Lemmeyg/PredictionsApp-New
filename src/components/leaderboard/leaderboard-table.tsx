'use client'

import { Fragment, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from '@/lib/utils'

export interface WeeklyScore {
  round: number
  points: number
}

export interface LeaderboardEntry {
  rank: string;
  profileId: string;
  player: string;
  total: string | number;
  gameweekTotal: string | number;
  // Most recent round first -- the dropdown shows the last 5 without
  // scrolling, older rounds are reachable by scrolling further down.
  weeklyScores: WeeklyScore[];
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
  // The round the "Gameweek" column is totalling, for the header label.
  // Null before the season's first fixture kicks off.
  gameweekRound: number | null
}

export function LeaderboardTable({ data, gameweekRound }: LeaderboardTableProps) {
  const [expandedProfileId, setExpandedProfileId] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary">Rank</TableHead>
            <TableHead className="text-primary">Player</TableHead>
            <TableHead className="text-primary">
              {gameweekRound === null ? 'Gameweek' : `Gameweek ${gameweekRound}`}
            </TableHead>
            <TableHead className="text-primary">Total</TableHead>
            <TableHead className="text-primary w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((entry) => {
            const isExpanded = expandedProfileId === entry.profileId

            return (
              <Fragment key={entry.profileId}>
                <TableRow>
                  <TableCell>{entry.rank}</TableCell>
                  <TableCell>{entry.player}</TableCell>
                  <TableCell>{entry.gameweekTotal}</TableCell>
                  <TableCell>{entry.total}</TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedProfileId((current) =>
                          current === entry.profileId ? null : entry.profileId
                        )
                      }
                      aria-expanded={isExpanded}
                      aria-label={
                        isExpanded ? 'Collapse weekly scores' : 'Expand weekly scores'
                      }
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>
                  </TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <div className="max-h-40 overflow-y-auto px-4 py-2 space-y-1">
                        {entry.weeklyScores.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No completed rounds yet.
                          </p>
                        ) : (
                          entry.weeklyScores.map((score) => (
                            <div
                              key={score.round}
                              className="flex justify-between text-sm text-white"
                            >
                              <span className="text-muted-foreground">
                                Round {score.round}
                              </span>
                              <span>{score.points} pts</span>
                            </div>
                          ))
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
