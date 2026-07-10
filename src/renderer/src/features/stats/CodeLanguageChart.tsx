import type { JSX } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CodeStatsEntry } from '@shared/types'
import { CHART_PALETTE } from './palette'
import { getLanguageIcon } from './languageIcons'
import type { ChartView } from './StatsChart'
import './StatsChart.css'

type CodeLanguageChartProps = {
  entries: CodeStatsEntry[]
  view: ChartView
}

type TickProps = {
  x?: number
  y?: number
  payload?: { value: string }
}

function LanguageTick({ x = 0, y = 0, payload }: TickProps): JSX.Element {
  const value = payload?.value ?? ''
  const Icon = getLanguageIcon(value)
  return (
    <foreignObject x={x - 36} y={y} width={72} height={46}>
      <div className="stats-chart__tick">
        <Icon size={16} />
        <span className="stats-chart__tick-label">{value}</span>
      </div>
    </foreignObject>
  )
}

type LegendPayloadEntry = { value: string; color: string }

function LanguageLegend({ payload }: { payload?: LegendPayloadEntry[] }): JSX.Element {
  return (
    <ul className="stats-chart__legend">
      {(payload ?? []).map((entry) => {
        const Icon = getLanguageIcon(entry.value)
        return (
          <li key={entry.value} className="stats-chart__legend-item">
            <span className="stats-chart__legend-swatch" style={{ background: entry.color }} />
            <Icon size={14} />
            <span className="stats-chart__legend-label">{entry.value}</span>
          </li>
        )
      })}
    </ul>
  )
}

export default function CodeLanguageChart({ entries, view }: CodeLanguageChartProps): JSX.Element {
  const shown = entries.slice(0, 8)
  const data = shown.map((entry) => ({ name: entry.label, minutes: Math.round(entry.ms / 60000) }))

  if (data.length === 0) {
    return <div className="stats-chart stats-chart--empty">No data in this range yet.</div>
  }

  if (view === 'pie') {
    return (
      <div className="stats-chart">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="minutes" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
              {data.map((_, index) => (
                <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}m`, 'Time']} />
            <Legend content={<LanguageLegend />} />
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
          <XAxis dataKey="name" interval={0} height={50} tick={<LanguageTick />} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`${value}m`, 'Time']} />
          <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
