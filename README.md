<p align="center">
  <img src="Logos/LogoText.png" alt="Shiba Track" width="360" />
</p>

<p align="center">
  <b>🐕 Your productivity, tracked, timed, and gently supervised by a Shiba Inu.</b>
</p>

---

## 🌸 What is this?

**Shiba Track** is a desktop app (built with Electron + React) that keeps all your productivity tools in one place:

- ⏱️ **Time Tracker** — create timers, run them, and see where your time actually goes
- ✅ **To-Do** — projects, categories, sprints, priorities, subtasks, and task states (to-do → in progress → under review → finished)
- 📊 **Stats** — breakdowns for timers, tracked apps, and completed to-dos, with custom date ranges
- 🏆 **Achievements** — small rewards for building good habits
- 🎨 **Themes** — pick the look that fits your mood

No cloud, no accounts — everything is stored locally on your machine. 🔒

## 🚀 Getting started

```bash
npm install
npm run dev
```

This launches the app in development mode with hot reload.

## 📦 Bundling the app

```bash
npm run build
npx electron-builder
```

- `npm run build` compiles the main, preload, and renderer code into `out/`
- `npx electron-builder` packages that build into an installer for your platform (`.dmg` on macOS, `.exe`/NSIS on Windows, `AppImage` on Linux), dropped into `release/`

Other useful commands:

```bash
npm run typecheck   # type-check the whole project
npm run preview     # preview the production build without packaging it
```

## 🛠️ Tech stack

Electron · React · TypeScript · Vite (via `electron-vite`) · React Router

---

<p align="center">
  Made with ❤️ by <b>Prooheckcp</b> 🐶
</p>
