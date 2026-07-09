import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import Modal from '../../components/Modal'
import Card from '../../components/Card'
import AppIcon from './AppIcon'
import StatsChart from './StatsChart'
import { formatDuration } from '../../utils/format'
import type { AppDetailResult } from '@shared/types'
import './AppDetailModal.css'

type AppDetailModalProps = {
  appName: string
  onClose: () => void
}

export default function AppDetailModal({ appName, onClose }: AppDetailModalProps): JSX.Element {
  const [detail, setDetail] = useState<AppDetailResult | null>(null)

  useEffect(() => {
    let cancelled = false
    window.api.stats.getAppDetail(appName).then((result) => {
      if (!cancelled) setDetail(result)
    })
    return () => {
      cancelled = true
    }
  }, [appName])

  return (
    <Modal title={appName} onClose={onClose} width={680}>
      <div className="app-detail">
        <div className="app-detail__header">
          <AppIcon path={detail?.appPath} label={appName} size={32} />
          <div>
            <p className="app-detail__total">{formatDuration(detail?.totalMs ?? 0)}</p>
            <p className="app-detail__total-label">Total time tracked</p>
          </div>
          <div>
            <p className="app-detail__total">{formatDuration(Math.round(detail?.averagePerDayMs ?? 0))}</p>
            <p className="app-detail__total-label">Average per day since first use</p>
          </div>
        </div>

        <div className="app-detail__section">
          <h3 className="app-detail__section-title">By day of week</h3>
          <Card>
            <StatsChart entries={detail?.byWeekday ?? []} view="bar" />
          </Card>
        </div>

        <div className="app-detail__section">
          <h3 className="app-detail__section-title">By month</h3>
          <Card>
            <StatsChart entries={detail?.byMonth ?? []} view="bar" />
          </Card>
        </div>
      </div>
    </Modal>
  )
}
