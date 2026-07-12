import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from './theme/ThemeContext'
import TimerOverlay from './features/overlay/TimerOverlay'
import './styles/global.css'
import './features/overlay/overlay.css'

// The overlay is its own transparent, always-on-top window (see
// main/overlayWindow.ts). It reuses ThemeProvider so the floating cards pick up
// the same theme variables (--surface, --accent-gradient, …) the in-app corner
// cards use, but overlay.css keeps the page background transparent.
ReactDOM.createRoot(document.getElementById('overlay-root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <TimerOverlay />
    </ThemeProvider>
  </React.StrictMode>
)
