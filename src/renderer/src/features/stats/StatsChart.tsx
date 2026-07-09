import type { JSX } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import type { StatsEntry } from '@shared/types'
import { CHART_PALETTE } from './palette'
import './StatsChart.css'

export type ChartView = 'bar' | 'pie' | 'line'

type StatsChartProps = {
  entries: StatsEntry[]
  view: ChartView
}

export default function StatsChart({ entries, view }: StatsChartProps): JSX.Element {
  const data = entries.slice(0, 8).map((entry) => ({ name: entry.label, minutes: Math.round(entry.ms / 60000) }))

  if (data.length === 0) {
    return <div className="stats-chart stats-chart--empty">No data in this range yet.</div>
  }

  if (view === 'pie') {
    return (
      <div className="stats-chart">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="minutes" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
              {data.map((_, index) => (
                <Cell key={index} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value}m`, "Time"]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  if (view === 'line') {
    return (
      <div className="stats-chart">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [`${value}m`, "Time"]} />
            <Line type="monotone" dataKey="minutes" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="stats-chart">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(value) => [`${value}m`, "Time"]} />
          <Bar dataKey="minutes" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
