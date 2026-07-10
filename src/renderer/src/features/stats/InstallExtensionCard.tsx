import type { JSX } from 'react'
import Card from '../../components/Card'
import { CODE_TRACKER_MARKETPLACE_URL } from '@shared/codeTrackerConfig'
import extensionIcon from '../../assets/vscode-extension-icon.png'
import './InstallExtensionCard.css'

export default function InstallExtensionCard(): JSX.Element {
  return (
    <Card className="install-extension-card">
      <div className="install-extension">
        <img src={extensionIcon} alt="" className="install-extension__icon" />
        <div>
          <h2 className="stats-section-title">Connect your editor to track coding time</h2>
          <p className="stats-note">
            Install the Shiba Track VS Code extension to start tracking how long you spend coding, per
            project, file, and language.
          </p>
          <a
            href={CODE_TRACKER_MARKETPLACE_URL}
            target="_blank"
            rel="noreferrer"
            className="install-extension__button"
          >
            Get the extension
          </a>
        </div>
      </div>
    </Card>
  )
}
