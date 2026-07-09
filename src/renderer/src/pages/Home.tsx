import type { JSX } from 'react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import './Home.css'

const STATS = [
  { label: 'Tracked today', value: '0h 0m' },
  { label: 'Open tasks', value: '0' },
  { label: 'Active projects', value: '0' }
]

export default function Home(): JSX.Element {
  return (
    <>
      <PageHeader title="Home" subtitle="A quick overview of your day." />

      <div className="home__stats">
        {STATS.map((stat) => (
          <Card key={stat.label} className="home__stat">
            <p className="home__stat-value">{stat.value}</p>
            <p className="home__stat-label">{stat.label}</p>
          </Card>
        ))}
      </div>

      <EmptyState
        title="No recent activity yet"
        description="Start a timer or add a to-do to see your activity show up here."
      />
    </>
  )
}
