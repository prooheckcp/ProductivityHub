import { useEffect } from 'react'
import type { JSX, MouseEvent, ReactNode } from 'react'
import './Modal.css'

type ModalProps = {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: number
  titleClassName?: string
}

export default function Modal({
  title,
  onClose,
  children,
  footer,
  width = 480,
  titleClassName
}: ModalProps): JSX.Element {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className="modal-overlay" onMouseDown={handleBackdropClick}>
      <div
        className="modal-panel"
        style={{ width }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-panel__header">
          <h2 className={'modal-panel__title' + (titleClassName ? ` ${titleClassName}` : '')}>{title}</h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-panel__body">{children}</div>
        {footer && <div className="modal-panel__footer">{footer}</div>}
      </div>
    </div>
  )
}
