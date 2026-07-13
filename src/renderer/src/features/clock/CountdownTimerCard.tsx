import type { JSX } from 'react'
import { PauseIcon, PinIcon, PlayIcon, RestartIcon } from '../../components/icons'
import ProgressBar from '../../components/ProgressBar'
import type { CountdownTimer } from '@shared/types'
import { currentRemainingMs } from '@shared/timeMath'
import { formatClock } from '../../utils/format'
import { useOverlayPins } from '../overlay/useOverlayPins'
import './CountdownTimerCard.css'

type CountdownTimerCardProps = {
  timer: CountdownTimer
  now: number
  onPlay: () => void
  onPause: () => void
  onRestart: () => void
  onDelete: () => void
  /** Briefly emphasised when opened from the overlay (deep link). */
  highlight?: boolean
}

export default function CountdownTimerCard({
  timer,
  now,
  onPlay,
  onPause,
  onRestart,
  onDelete,
  highlight = false
}: CountdownTimerCardProps): JSX.Element {
  const remaining = currentRemainingMs(timer, now)
  const clock = formatClock(remaining)
  const percent = timer.durationMs > 0 ? ((timer.durationMs - remaining) / timer.durationMs) * 100 : 0
  const isRunning = timer.status === 'running'
  const isFinished = timer.status === 'finished'
  const { isPinned, toggle } = useOverlayPins()
  const pinned = isPinned(`c:${timer.id}`)

  return (
    <div
      id={`countdown-${timer.id}`}
      className={
        'countdown-card' +
        (isFinished ? ' countdown-card--finished' : '') +
        (highlight ? ' countdown-card--highlight' : '')
      }
    >
      <div className="countdown-card__top">
        <p className="countdown-card__name">{timer.name}</p>
        <button
          type="button"
          className={'countdown-card__pin' + (pinned ? ' countdown-card__pin--active' : '')}
          onClick={() => toggle(`c:${timer.id}`)}
          aria-label={pinned ? 'Unpin from overlay' : 'Pin to overlay'}
          aria-pressed={pinned}
          title={pinned ? 'Unpin from overlay' : 'Pin to overlay'}
        >
          <PinIcon size={14} />
        </button>
        <button type="button" className="countdown-card__delete" onClick={onDelete} aria-label="Delete timer">
          ×
        </button>
      </div>

      <p className="countdown-card__clock">
        {clock.hh}:{clock.mm}:{clock.ss}
      </p>

      <ProgressBar percent={percent} label={isFinished ? "Time's up" : undefined} />

      <div className="countdown-card__controls">
        <button type="button" className="countdown-card__btn" onClick={onRestart} aria-label="Restart timer">
          <RestartIcon size={16} />
        </button>
        <button
          type="button"
          className="countdown-card__btn countdown-card__btn--primary"
          onClick={isRunning ? onPause : onPlay}
          aria-label={isRunning ? 'Pause timer' : 'Play timer'}
        >
          {isRunning ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
        </button>
      </div>
    </div>
  )
}
