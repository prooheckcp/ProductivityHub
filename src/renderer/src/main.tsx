import React from 'react'
import ReactDOM from 'react-dom/client'
import AuthGate from './auth/AuthGate'
import { AuthProvider } from './auth/AuthContext'
import { ProfileProvider } from './auth/ProfileContext'
import { ThemeProvider } from './theme/ThemeContext'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <AuthGate />
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
)
