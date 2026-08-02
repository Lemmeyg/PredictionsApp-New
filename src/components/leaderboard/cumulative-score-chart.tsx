'use client'

import { useMemo, useState } from 'react'

export interface PlayerSeriesPoint {
  round: number
  cumulativeTotal: number
}

export interface PlayerSeries {
  playerId: string
  displayName: string
  initials: string | null
  points: PlayerSeriesPoint[]
}

// dataviz skill's validated dark-mode categorical palette, checked against
// this app's actual surface color:
//   node scripts/validate_palette.js "#3987e5,#d95926,#199e70,#c98500,#d55181,#008300" --mode dark --surface "#000000"
// Assigned to players in a fixed order (see leaderboard/page.tsx) so a
// player's color never changes as their rank moves -- color follows the
// entity, never its rank.
const PALETTE = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300']

const CHART_WIDTH = 800
const CHART_HEIGHT = 360
const MARGIN = { top: 16, right: 60, bottom: 32, left: 40 }
const PLOT_WIDTH = CHART_WIDTH - MARGIN.left - MARGIN.right
const PLOT_HEIGHT = CHART_HEIGHT - MARGIN.top - MARGIN.bottom

// Rounds a value up to the nearest "nice" 1/2/5/10-scaled number, for clean
// axis tick values.
function niceNumber(value: number): number {
  if (value <= 0) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  if (normalized <= 1) return magnitude
  if (normalized <= 2) return 2 * magnitude
  if (normalized <= 5) return 5 * magnitude
  return 10 * magnitude
}

export function CumulativeScoreChart({
  series,
  roundNumbers,
}: {
  series: PlayerSeries[]
  roundNumbers: number[]
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const maxValue = useMemo(
    () => Math.max(0, ...series.flatMap((s) => s.points.map((p) => p.cumulativeTotal))),
    [series]
  )
  const step = niceNumber(maxValue > 0 ? maxValue / 4 : 1)
  const yMax = step * 4
  const yTicks = [0, step, step * 2, step * 3, yMax]

  if (roundNumbers.length === 0) {
    return (
      <div className="border border-gray-700 rounded-lg p-8 text-center text-muted-foreground">
        No completed rounds yet — check back after the first round of matches finishes.
      </div>
    )
  }

  const xForRound = (round: number) => {
    if (roundNumbers.length <= 1) return MARGIN.left
    const index = roundNumbers.indexOf(round)
    return MARGIN.left + (index / (roundNumbers.length - 1)) * PLOT_WIDTH
  }
  const yForValue = (value: number) => MARGIN.top + PLOT_HEIGHT - (value / yMax) * PLOT_HEIGHT

  // Tick marks for every round, but text labels only at intervals so they
  // never collide -- always including the first and last round.
  const labelInterval = Math.max(1, Math.ceil(roundNumbers.length / 12))
  const labeledRounds = new Set(
    roundNumbers.filter(
      (_round, index) =>
        index === 0 || index === roundNumbers.length - 1 || index % labelInterval === 0
    )
  )

  const hoveredRound = hoveredIndex !== null ? roundNumbers[hoveredIndex] : null
  const crosshairX = hoveredRound !== null ? xForRound(hoveredRound) : null

  const moveToClientX = (clientX: number, svg: SVGSVGElement) => {
    const rect = svg.getBoundingClientRect()
    const scaleX = CHART_WIDTH / rect.width
    const xInViewBox = (clientX - rect.left) * scaleX
    const relative = (xInViewBox - MARGIN.left) / PLOT_WIDTH
    const index = Math.round(relative * (roundNumbers.length - 1))
    setHoveredIndex(Math.min(roundNumbers.length - 1, Math.max(0, index)))
  }

  const handlePointerMove = (event: React.PointerEvent<SVGRectElement>) => {
    const svg = event.currentTarget.ownerSVGElement
    if (svg) moveToClientX(event.clientX, svg)
  }

  const handleKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setHoveredIndex((current) => Math.min(roundNumbers.length - 1, (current ?? -1) + 1))
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setHoveredIndex((current) =>
        current === null ? roundNumbers.length - 1 : Math.max(0, current - 1)
      )
    } else if (event.key === 'Escape') {
      setHoveredIndex(null)
    }
  }

  // Tooltip rows, sorted by value descending at the hovered round. Color is
  // captured before sorting so it still matches each player's line.
  const tooltipRows =
    hoveredIndex !== null
      ? series
          .map((playerSeries, colorIndex) => ({
            displayName: playerSeries.displayName,
            value: playerSeries.points[hoveredIndex]?.cumulativeTotal ?? 0,
            color: PALETTE[colorIndex % PALETTE.length],
          }))
          .sort((a, b) => b.value - a.value)
      : []

  const tooltipWidth = 150
  const tooltipHeight = tooltipRows.length * 18 + 28
  const tooltipFlipsLeft = crosshairX !== null && crosshairX + 16 + tooltipWidth > CHART_WIDTH
  const tooltipX =
    crosshairX !== null ? (tooltipFlipsLeft ? crosshairX - 16 - tooltipWidth : crosshairX + 16) : 0

  return (
    <div className="border border-gray-700 rounded-lg p-4">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-auto"
        role="img"
        aria-label="Cumulative points by round for each player"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={CHART_WIDTH - MARGIN.right}
              y1={yForValue(tick)}
              y2={yForValue(tick)}
              stroke="#2c2c2a"
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 8}
              y={yForValue(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill="#898781"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        <line
          x1={MARGIN.left}
          x2={CHART_WIDTH - MARGIN.right}
          y1={MARGIN.top + PLOT_HEIGHT}
          y2={MARGIN.top + PLOT_HEIGHT}
          stroke="#383835"
          strokeWidth={1}
        />
        {roundNumbers.map((round) => (
          <g key={round}>
            <line
              x1={xForRound(round)}
              x2={xForRound(round)}
              y1={MARGIN.top + PLOT_HEIGHT}
              y2={MARGIN.top + PLOT_HEIGHT + 4}
              stroke="#383835"
              strokeWidth={1}
            />
            {labeledRounds.has(round) && (
              <text
                x={xForRound(round)}
                y={MARGIN.top + PLOT_HEIGHT + 18}
                textAnchor="middle"
                fontSize={10}
                fill="#898781"
              >
                {round}
              </text>
            )}
          </g>
        ))}

        {series.map((playerSeries, colorIndex) => {
          const color = PALETTE[colorIndex % PALETTE.length]
          const pathD = playerSeries.points
            .map(
              (point, i) =>
                `${i === 0 ? 'M' : 'L'} ${xForRound(point.round)} ${yForValue(point.cumulativeTotal)}`
            )
            .join(' ')
          const lastPoint = playerSeries.points[playerSeries.points.length - 1]

          return (
            <g key={playerSeries.playerId}>
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {lastPoint && (
                <>
                  <circle
                    cx={xForRound(lastPoint.round)}
                    cy={yForValue(lastPoint.cumulativeTotal)}
                    r={4}
                    fill={color}
                    stroke="#000000"
                    strokeWidth={2}
                  />
                  <text
                    x={xForRound(lastPoint.round) + 8}
                    y={yForValue(lastPoint.cumulativeTotal)}
                    dominantBaseline="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="#ffffff"
                  >
                    {playerSeries.initials ?? playerSeries.displayName.slice(0, 2).toUpperCase()}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {crosshairX !== null && (
          <line
            x1={crosshairX}
            x2={crosshairX}
            y1={MARGIN.top}
            y2={MARGIN.top + PLOT_HEIGHT}
            stroke="#898781"
            strokeWidth={1}
          />
        )}

        {/* Hover/keyboard hit area, sits above the lines but below the tooltip */}
        <rect
          x={MARGIN.left}
          y={MARGIN.top}
          width={PLOT_WIDTH}
          height={PLOT_HEIGHT}
          fill="transparent"
          onPointerMove={handlePointerMove}
        />

        {hoveredIndex !== null && crosshairX !== null && (
          <foreignObject x={tooltipX} y={MARGIN.top} width={tooltipWidth} height={tooltipHeight}>
            <div className="bg-[#1E1E1E] border border-gray-700 rounded-md p-2 text-xs">
              <div className="text-muted-foreground mb-1">Round {hoveredRound}</div>
              {tooltipRows.map((row) => (
                <div key={row.displayName} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-white">
                    <span className="inline-block w-2.5 h-0.5" style={{ backgroundColor: row.color }} />
                    {row.displayName}
                  </span>
                  <span className="text-white font-semibold">{row.value}</span>
                </div>
              ))}
            </div>
          </foreignObject>
        )}
      </svg>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 justify-center">
        {series.map((playerSeries, colorIndex) => (
          <div
            key={playerSeries.playerId}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="inline-block w-2.5 h-0.5"
              style={{ backgroundColor: PALETTE[colorIndex % PALETTE.length] }}
            />
            {playerSeries.displayName}
          </div>
        ))}
      </div>
    </div>
  )
}
