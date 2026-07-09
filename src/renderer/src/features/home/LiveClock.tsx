import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import './LiveClock.css'

export default function LiveClock(): JSX.Element {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const date = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="live-clock">
      <p className="live-clock__time">{time}</p>
      <p className="live-clock__date">{date}</p>
    </div>
  )
}
