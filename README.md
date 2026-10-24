# LocalProjectsManager

**Your projects. Your machine. Nothing leaves your computer.**

A 100% local project manager by **Sylvenson Richard** / **JRiSpace** — track every project, phase and task with a live dashboard, progress reports and system health. No account, no server, no tracking.

![Privacy-first](https://img.shields.io/badge/privacy-100%25%20local-0d9488) ![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20Vite%206-blue) ![PWA](https://img.shields.io/badge/PWA-installable-brightgreen)

## 🚀 Quick start

**Use it**

1. **Download** the latest release zip from the [Releases page](https://github.com/jrispace/LocalProjectsManager/releases).
2. **Unzip** anywhere (double-click in Finder).
3. **Double-click `lpm.command`** — it serves the app on `127.0.0.1` and opens your browser. Keep the Terminal window open while you use it.

No install, no dependencies, no account. (The app itself is a web build: it needs a local server, which the launcher provides — that is also what makes the service worker and offline mode work.)

**Develop it**

```bash
npm install
npm run dev        # http://localhost:8080
npm run typecheck
npm run build      # -> dist/
npm run release    # -> release/LocalProjectsManager.zip
```

## 🔒 Privacy

- Your data **never leaves your machine**: browser storage + an optional local database file (`jrispace-pm.db`) written through the File System Access API.
- **No server, no cloud sync, no analytics, no accounts.**
- `Settings → Local Disk Database` connects a folder so changes survive clearing browser data; backup/restore and full JSON export live in the same screen.

## ✨ Features

**Projects (Asana-style)**
- **📊 Live Dashboard** — overall completion, progress per project, donut charts, KPI cards, system health
- **🗂 List ⇄ Board** — every project flips between the classic phase list and a Kanban board (To do / In progress / Done) with drag & drop
- **👤 Assignees, comments, dependencies** — team roster, `@`-free comment threads, "blocked by" links with a lock banner
- **🎯 My Tasks** — everything assigned to you across projects, grouped overdue / today / next 7 days / later / no date
- **📁 Phases & tasks** — intake → plan → design → build → verify → deploy → report template, custom phases, duplicate/rename
- **✅ Tasks** — priorities, due dates, overdue badges, notes, sub-tasks, tags, task side sheet
- **🧩 Checklist view** — tick tasks per project, undo from the toast
- **🔄 Scan folder** — pick `~/Projects`, every subfolder becomes a project, `checklist.json` files are imported
- **⟳ Profile verify** — re-sync a project to its template: missing tasks are added, nothing is ever deleted

**CRM**
- **🏢 Companies & contacts** — searchable tables, tags, owners, open value per contact/company
- **💰 Deal pipeline** — Lead → Qualified → Proposal → Negotiation → Won / Lost, drag deals between stages, per-stage totals
- **📈 Forecast** — open pipeline, weighted forecast (value × probability), won value, win rate
- **🕓 Activity timeline** — every stage move, new deal and logged call/meeting/note

**Platform**
- **💾 Disk database** — `jrispace-pm.db` in a folder you choose (projects + CRM), plus backup / restore
- **📤 Export / Import** — portable JSON backups
- **🔁 Multi-tab sync** — changes propagate across tabs via BroadcastChannel
- **📱 Installable PWA** — service worker, offline shell, mobile bottom nav + drawer
- **🌍 i18n** — English, Kreyòl, Français · dark / light / auto theme

## 🗂 Structure

```
LocalProjectsManager/
├── src/                 # React app (pages, components, lib)
├── public/              # icons, manifest, sw.js (copied to dist)
├── scripts/             # package-release.sh
├── lpm.command          # double-click launcher shipped in the release
├── dist/                # build output (what ships)
└── legacy/              # v1 single-file app (app.html + app.js) — archived, not shipped
```

## 🏷 Author

- **Sylvenson Richard** — [sylvensonrichard.com](https://sylvensonrichard.com)
- **JRiSpace** — [jrispace.com](https://jrispace.com)

License: template for Local Projects Manager projects.
