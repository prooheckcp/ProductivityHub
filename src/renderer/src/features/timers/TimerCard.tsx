import type { JSX } from 'react'
import { PinIcon, SettingsIcon } from '../../components/icons'
import defaultCover from '../../assets/shiba-clock.png'
import { toFileUrl } from '../../utils/fileUrl'
import { formatClock } from '../../utils/format'
import { currentElapsedMs } from '@shared/timeMath'
import type { Timer } from '@shared/types'
import { useOverlayPins } from '../overlay/useOverlayPins'
import './TimerCard.css'

type TimerCardProps = {
  timer: Timer
  now: number
  onOpen: () => void
  onEdit: () => void
}

export default function TimerCard({ timer, now, onOpen, onEdit }: TimerCardProps): JSX.Element {
  const clock = formatClock(currentElapsedMs(timer, now))
  const isRunning = timer.runningSince !== null
  const { isPinned, toggle } = useOverlayPins()
  const pinned = isPinned(`t:${timer.id}`)

  return (
    <div className="timer-card">
      <button
        type="button"
        className={'timer-card__pin' + (pinned ? ' timer-card__pin--active' : '')}
        onClick={(event) => {
          event.stopPropagation()
          toggle(`t:${timer.id}`)
        }}
        aria-label={pinned ? 'Unpin from overlay' : 'Pin to overlay'}
        aria-pressed={pinned}
        title={pinned ? 'Unpin from overlay' : 'Pin to overlay'}
      >
        <PinIcon size={14} />
      </button>
      <button type="button" className="timer-card__body" onClick={onOpen}>
        <div className="timer-card__cover">
          <img
            src={timer.imagePath ? toFileUrl(timer.imagePath) : defaultCover}
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = defaultCover
            }}
            alt=""
          />
          <div className="timer-card__cover-fade" />
          <p className={'timer-card__clock' + (isRunning ? ' timer-card__clock--running' : '')}>
            {isRunning && <span className="timer-card__clock-dot" />}
            {clock.hh}:{clock.mm}:{clock.ss}
          </p>
        </div>
        <div className="timer-card__info">
          <p className="timer-card__name">{timer.name}</p>
          {timer.description && <p className="timer-card__description">{timer.description}</p>}
        </div>
      </button>
      <button
        type="button"
        className="timer-card__edit"
        onClick={(event) => {
          event.stopPropagation()
          onEdit()
        }}
        aria-label="Edit timer"
      >
        <SettingsIcon size={14} />
      </button>
    </div>
  )
}
