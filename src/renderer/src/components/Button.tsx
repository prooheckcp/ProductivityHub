import type { ButtonHTMLAttributes, JSX } from 'react'
import './Button.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}

export default function Button({
  variant = 'secondary',
  className,
  ...rest
}: ButtonProps): JSX.Element {
  return <button className={`btn btn--${variant} ${className ?? ''}`} {...rest} />
}
