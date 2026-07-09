import type { JSX } from 'react'

export type IconProps = {
  size?: number
}

export function HomeIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M3 11.5 12 4l9 7.5M5.5 10v9a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1v-9"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TimerIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="13" r="8" strokeWidth="1.8" />
      <path d="M12 9v4l3 2M10 2h4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChecklistIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M4 6.5 5.5 8 8 5M4 12.5 5.5 14 8 11M4 18.5 5.5 20 8 17M12 6.5h8M12 12.5h8M12 18.5h8"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PlusIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M12 5v14M5 12h14" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function SettingsIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61
        l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41
        h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87
        C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58
        c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54
        c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96
        c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6
        s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"
      />
    </svg>
  )
}

export function CheckIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M5 12.5 9.5 17 19 7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlayIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M6 4.5v15l14-7.5-14-7.5Z" />
    </svg>
  )
}

export function PauseIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <rect x="6" y="4.5" width="4.5" height="15" rx="1" />
      <rect x="13.5" y="4.5" width="4.5" height="15" rx="1" />
    </svg>
  )
}

export function CloseIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M6 6l12 12M18 6 6 18" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function ImageIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.6" strokeWidth="1.8" />
      <path d="M4.5 16.5 9 12l3 3 4-4.5 3.5 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChartIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M4.5 19.5h15M8 19.5v-6M12.5 19.5v-10M17 19.5v-4"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TrophyIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M7 4.5h10v4a5 5 0 0 1-10 0v-4Z M7 5.5H4.5v2a2.5 2.5 0 0 0 2.5 2.4 M17 5.5h2.5v2a2.5 2.5 0 0 1-2.5 2.4 M10 15.3v2.2h4v-2.2 M8.5 20.5h7"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PawIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <ellipse cx="12" cy="16" rx="5.2" ry="4.2" />
      <ellipse cx="5.2" cy="10.5" rx="2.1" ry="2.6" transform="rotate(-20 5.2 10.5)" />
      <ellipse cx="9.6" cy="6.6" rx="2.1" ry="2.6" transform="rotate(-8 9.6 6.6)" />
      <ellipse cx="14.4" cy="6.6" rx="2.1" ry="2.6" transform="rotate(8 14.4 6.6)" />
      <ellipse cx="18.8" cy="10.5" rx="2.1" ry="2.6" transform="rotate(20 18.8 10.5)" />
    </svg>
  )
}

export function SakuraFlowerIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cx="12" cy="7.2" rx="2.6" ry="3.6" transform={`rotate(${angle} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="1.8" opacity="0.6" />
    </svg>
  )
}

export function CodeIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M9 8 4.5 12 9 16M15 8l4.5 4-4.5 4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function GlobeIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="8" strokeWidth="1.7" />
      <path d="M4 12h16M12 4a11 11 0 0 1 0 16M12 4a11 11 0 0 0 0 16" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function ChatIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M4 5.5h16v10H9l-4 3.5v-3.5H4v-10Z"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PaletteIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M12 4.5c-4.4 0-8 3.4-8 7.5s3.4 7.5 8 7.5c1 0 1.6-.7 1.6-1.5 0-.4-.2-.8-.4-1.1-.2-.3-.4-.6-.4-1 0-.7.6-1.2 1.3-1.2h1.5c2.5 0 4.4-2 4.4-4.5 0-3.1-3.5-5.7-8-5.7Z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15.2" cy="9.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function WrenchIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M14.5 6.5a3.5 3.5 0 0 0-4.6 4.6L4.5 16.5v3h3l5.4-5.4a3.5 3.5 0 0 0 4.6-4.6l-2 2-2-2 2-2Z"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function TagIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M11.5 4.5H6a1.5 1.5 0 0 0-1.5 1.5v5.5a1.5 1.5 0 0 0 .44 1.06l7 7a1.5 1.5 0 0 0 2.12 0l5.5-5.5a1.5 1.5 0 0 0 0-2.12l-7-7a1.5 1.5 0 0 0-1.06-.44Z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="8.2" cy="8.2" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ChevronDownIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M6 9.5 12 15.5 18 9.5" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LockIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="5.5" y="11" width="13" height="9.5" rx="2" strokeWidth="1.7" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function CalendarIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" strokeWidth="1.7" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M8 13.5h2M14 13.5h2M8 17h2M14 17h2" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export function FilterIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M4 5.5h16L14 13v6l-4 2v-8L4 5.5Z" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function BeachBallIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9.5" fill="#ffffff" />
      <path d="M12 2.5A9.5 9.5 0 0 1 21.5 12h-9.5Z" fill="#ef4444" />
      <path d="M12 12h9.5A9.5 9.5 0 0 1 12 21.5Z" fill="#f59e0b" />
      <path d="M12 21.5A9.5 9.5 0 0 1 2.5 12H12Z" fill="#3b82f6" />
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="#00000022" strokeWidth="0.6" />
    </svg>
  )
}

export function BubbleIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="8" strokeWidth="1.6" />
      <path d="M9 8.5c-1 1-1.5 2.2-1.4 3.4" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}

export function SnowflakeIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      {[0, 60, 120].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 12 12)`}>
          <path d="M12 3v18" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M12 6 9.5 8M12 6l2.5 2M12 18l-2.5-2M12 18l2.5-2" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  )
}

export function SunIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="4.5" strokeWidth="1.6" />
      <path
        d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TreeIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2 6.5 10h2.2L4.5 16h4.7v6h5.6v-6h4.7l-4.2-6h2.2Z" />
    </svg>
  )
}

export function LeafIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M20 4C10 4 4 10 4 18c0 1 .8 2 2 2 8 0 14-6 14-16 0-.2 0-.2 0 0Z" />
      <path d="M6.5 19 18 6" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function GiftIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="4" y="9.5" width="16" height="10.5" rx="1.5" strokeWidth="1.7" />
      <path d="M4 13h16M12 9.5v10.5" strokeWidth="1.7" />
      <path
        d="M12 9.5c0-2.5-1.8-4-3.5-4S6 6.7 6 8s1.3 1.5 3 1.5h3ZM12 9.5c0-2.5 1.8-4 3.5-4S18 6.7 18 8s-1.3 1.5-3 1.5h-3Z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WaveIcon({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path
        d="M2 14c2 0 2-3 4-3s2 3 4 3 2-3 4-3 2 3 4 3 2-3 4-3"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
