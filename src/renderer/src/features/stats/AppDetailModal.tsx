import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import Modal from '../../components/Modal'
import Card from '../../components/Card'
import AppIcon from './AppIcon'
import StatsChart from './StatsChart'
import { formatDuration } from '../../utils/format'
import type { AppDetailRange, AppDetailResult } from '@shared/types'
import './AppDetailModal.css'

type AppDetailModalProps = {
  appName: string
  onClose: () => void
}

const RANGES: { key: AppDetailRange; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  { key: 'all', label: 'All time' }
]

const RANGE_WINDOW_LABEL: Record<AppDetailRange, string> = {
  today: 'today',
  week: 'this week',
  month: 'this month',
  year: 'this year',
  all: 'all time'
}

export default function AppDetailModal({ appName, onClose }: AppDetailModalProps): JSX.Element {
  const [range, setRange] = useState<AppDetailRange>('week')
  const [detail, setDetail] = useState<AppDetailResult | null>(null)

  useEffect(() => {
    let cancelled = false
    window.api.stats.getAppDetail(appName, range).then((result) => {
      if (!cancelled) setDetail(result)
    })
    return () => {
      cancelled = true
    }
  }, [appName, range])

  return (
    <Modal title={appName} onClose={onClose} width={680}>
      <div className="app-detail">
        <div className="app-detail__top">
          <AppIcon path={detail?.appPath} label={appName} size={32} />
          <div className="app-detail__ranges" role="tablist">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={range === r.key}
                className={'app-detail__range' + (range === r.key ? ' app-detail__range--active' : '')}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="app-detail__tiles">
          <div className="app-detail__tile">
            <p className="app-detail__tile-value">{formatDuration(detail?.windowMs ?? 0)}</p>
            <p className="app-detail__tile-label">Tracked {RANGE_WINDOW_LABEL[range]}</p>
          </div>
          <div className="app-detail__tile">
            <p className="app-detail__tile-value">{formatDuration(Math.round(detail?.averageMs ?? 0))}</p>
            <p className="app-detail__tile-label">Average per {detail?.averageUnit ?? 'day'}</p>
          </div>
          <div className="app-detail__tile">
            <p className="app-detail__tile-value">{formatDuration(detail?.totalMs ?? 0)}</p>
            <p className="app-detail__tile-label">Total (all time)</p>
          </div>
        </div>

        <div className="app-detail__section">
          <h3 className="app-detail__section-title">{detail?.breakdownTitle ?? 'Breakdown'}</h3>
          <Card>
            <StatsChart entries={detail?.breakdown ?? []} view="bar" limit={40} showTickIcons={false} />
          </Card>
        </div>
      </div>
    </Modal>
  )
}
