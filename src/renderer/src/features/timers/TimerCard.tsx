import type { JSX } from 'react'
import { SettingsIcon, TimerIcon } from '../../components/icons'
import { toFileUrl } from '../../utils/fileUrl'
import { formatClock } from '../../utils/format'
import { currentElapsedMs } from '@shared/timeMath'
import type { Timer } from '@shared/types'
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

  return (
    <div className="timer-card">
      <button type="button" className="timer-card__body" onClick={onOpen}>
        <div className="timer-card__thumb">
          {timer.imagePath ? <img src={toFileUrl(timer.imagePath)} alt="" /> : <TimerIcon size={20} />}
        </div>
        <div className="timer-card__info">
          <p className="timer-card__name">{timer.name}</p>
          {timer.description && <p className="timer-card__description">{timer.description}</p>}
          <p className={'timer-card__clock' + (isRunning ? ' timer-card__clock--running' : '')}>
            {clock.hh}:{clock.mm}:{clock.ss}
          </p>
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
