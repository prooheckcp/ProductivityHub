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
}

type TickProps = {
  x?: number
  y?: number
  payload?: { value: string }
  icons: Record<string, string | null>
}

function AppTick({ x = 0, y = 0, payload, icons }: TickProps): JSX.Element {
  const value = payload?.value ?? ''
  const iconUrl = icons[value]
  return (
    <foreignObject x={x - 36} y={y} width={72} height={46}>
      <div className="stats-chart__tick">
        {iconUrl ? <img src={iconUrl} alt="" /> : <span className="stats-chart__tick-dot" />}
        <span className="stats-chart__tick-label">{value}</span>
      </div>
    </foreignObject>
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

export default function StatsChart({ entries, view, onSelect }: StatsChartProps): JSX.Element {
  const shown = entries.slice(0, 8)
  const icons = useAppIcons(shown)
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
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" interval={0} height={50} tick={<AppTick icons={icons} />} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`${value}m`, 'Time']} />
          <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} onClick={handleClick} cursor={cursor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
