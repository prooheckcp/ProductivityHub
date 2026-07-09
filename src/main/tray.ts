import { app, Menu, nativeImage, Tray } from 'electron'

let tray: Tray | null = null

export function createTray(iconPath: string, onOpen: () => void): Tray {
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setToolTip('Shiba Track')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Shiba Track', click: onOpen },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit()
        }
      }
    ])
  )
  tray.on('click', onOpen)
  return tray
}
