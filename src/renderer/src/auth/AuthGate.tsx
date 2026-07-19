import type { JSX } from 'react'
import { HashRouter } from 'react-router-dom'
import App from '../App'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAuth } from './AuthContext'
import LoginScreen from './LoginScreen'
import './LoginScreen.css'

// Decides what the main window renders: a brief splash while the persisted
// session/identity resolves, the login screen when sign-in is needed, or the
// full app once the user is a guest or authenticated.
export default function AuthGate(): JSX.Element {
  const { status, uploadPromptOpen, resolveUploadPrompt } = useAuth()

  // The first-login "upload local data?" prompt can appear over any state.
  const prompt = uploadPromptOpen ? (
    <ConfirmDialog
      title="Upload this device's data?"
      description="You have local data on this computer. Upload it to your new account? This becomes your account's starting data. Choose Skip to start fresh — your local data stays on this device."
      confirmLabel="Upload"
      danger={false}
      onConfirm={() => resolveUploadPrompt(true)}
      onCancel={() => resolveUploadPrompt(false)}
    />
  ) : null

  if (status === 'loading') {
    return (
      <div className="login" aria-busy="true">
        {prompt}
      </div>
    )
  }

  if (status === 'needs-auth') {
    return (
      <>
        <LoginScreen />
        {prompt}
      </>
    )
  }

  return (
    <>
      <HashRouter>
        <App />
      </HashRouter>
      {prompt}
    </>
  )
}
