import type { JSX } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { StatsEntry } from '@shared/types'
import { CHART_PALETTE } from './palette'
import { useAppIcons } from './useAppIcons'
import './StatsChart.css'

export type ChartView = 'bar' | 'pie'

type StatsChartProps = {
  entries: StatsEntry[]
  view: ChartView
  onSelect?: (label: string) => void
  /** Max bars/slices to show (default 8 — good for app rankings). */
  limit?: number
  /** Show the per-tick app icon (default true). Off for time-series breakdowns. */
  showTickIcons?: boolean
}

type TickProps = {
  x?: number
  y?: number
  payload?: { value: string }
  icons: Record<string, string | null>
  showIcons: boolean
}

function AppTick({ x = 0, y = 0, payload, icons, showIcons }: TickProps): JSX.Element {
  const value = payload?.value ?? ''
  const iconUrl = showIcons ? icons[value] : null
  // Long labels overlap when laid out horizontally, so the label is tilted
  // (-32°, right-anchored to the tick) and truncated — the icon stays upright.
  const label = value.length > 16 ? value.slice(0, 15) + '…' : value
  return (
    <g transform={`translate(${x},${y})`}>
      {showIcons &&
        (iconUrl ? (
          <image href={iconUrl} x={-9} y={2} width={18} height={18} preserveAspectRatio="xMidYMid meet" />
        ) : (
          <circle cx={0} cy={11} r={4} fill="var(--text-tertiary)" />
        ))}
      <text
        transform="rotate(-32)"
        x={-8}
        y={showIcons ? 34 : 14}
        textAnchor="end"
        fontSize={11}
        fill="var(--text-secondary)"
      >
        {label}
      </text>
    </g>
  )
}

type LegendPayloadEntry = { value: string; color: string }

function AppLegend({
  payload,
  icons
}: {
  payload?: LegendPayloadEntry[]
  icons: Record<string, string | null>
}): JSX.Element {
  return (
    <ul className="stats-chart__legend">
      {(payload ?? []).map((entry) => {
        const iconUrl = icons[entry.value]
        return (
          <li key={entry.value} className="stats-chart__legend-item">
            <span className="stats-chart__legend-swatch" style={{ background: entry.color }} />
            {iconUrl && <img src={iconUrl} alt="" />}
            <span className="stats-chart__legend-label">{entry.value}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default function StatsChart({
  entries,
  view,
  onSelect,
  limit = 8,
  showTickIcons = true
}: StatsChartProps): JSX.Element {
  const shown = entries.slice(0, limit)
  const icons = useAppIcons(showTickIcons ? shown : [])
  const data = shown.map((entry) => ({ name: entry.label, minutes: Math.round(entry.ms / 60000) }))

  if (data.length === 0) {
    return <div className="stats-chart stats-chart--empty">No data in this range yet.</div>
  }

  const cursor = onSelect ? 'pointer' : undefined
  function handleClick(payload: { name?: string } | undefined): void {
    if (payload?.name) onSelect?.(payload.name)
  }

  if (view === 'pie') {
    return (
      <div className="stats-chart">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="minutes"
              nameKey="name"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
              onClick={handleClick}
              cursor={cursor}
            >
              {data.map((_, index) => (
                <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}m`, 'Time']} />
            <Legend content={<AppLegend icons={icons} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="stats-chart">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ bottom: 48 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" interval={0} height={92} tick={<AppTick icons={icons} showIcons={showTickIcons} />} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`${value}m`, 'Time']} />
          <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} onClick={handleClick} cursor={cursor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
