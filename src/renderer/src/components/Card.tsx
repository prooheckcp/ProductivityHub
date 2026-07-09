import type { JSX, ReactNode } from 'react'
import './Card.css'

type CardProps = {
  children: ReactNode
  className?: string
}

export default function Card({ children, className }: CardProps): JSX.Element {
  return <div className={`card ${className ?? ''}`}>{children}</div>
}
