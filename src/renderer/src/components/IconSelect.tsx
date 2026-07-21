import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'
import { ChevronDownIcon } from './icons'
import './IconSelect.css'

export type IconOption = {
  value: string
  label: string
  /** Bundled image URL (e.g. a language icon). Takes precedence over emoji. */
  iconUrl?: string | null
  /** Emoji glyph (e.g. a country flag) used when there's no iconUrl. */
  emoji?: string | null
}

type IconSelectProps = {
  value: string
  options: IconOption[]
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  ariaLabel?: string
}

function OptionGlyph({ option }: { option: IconOption }): JSX.Element | null {
  if (option.iconUrl) return <img className="icon-select__icon" src={option.iconUrl} alt="" />
  if (option.emoji) return <span className="icon-select__emoji">{option.emoji}</span>
  return null
}

// A native <select> can't render images in its options, so this is a custom
// dropdown that shows a per-option icon (bundled image or emoji) both on the
// trigger and in the list.
export default function IconSelect({
  value,
  options,
  onChange,
  disabled,
  placeholder,
  ariaLabel
}: IconSelectProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const selected = options.find((o) => o.value === value) ?? null

  useEffect(() => {
    if (!open) return
    function handleClickOutside(event: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className="icon-select" ref={rootRef}>
      <button
        type="button"
        className="icon-select__trigger"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        {selected && <OptionGlyph option={selected} />}
        <span className="icon-select__label">{selected ? selected.label : placeholder ?? 'Select…'}</span>
        <ChevronDownIcon size={14} />
      </button>

      {open && (
        <ul className="icon-select__menu" role="listbox">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={'icon-select__option' + (option.value === value ? ' icon-select__option--active' : '')}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <OptionGlyph option={option} />
                <span className="icon-select__label">{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
