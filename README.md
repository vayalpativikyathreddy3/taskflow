# TaskFlow

A task management web app with Kanban boards, calendar view, analytics, Pomodoro timer, and habit-style productivity tracking — built with vanilla JavaScript (no framework, no build step).

## Features

- **Tasks** — priorities, categories, tags, notes, file attachments, recurring tasks, pinning
- **Subtasks** — checklist items per task with live progress (e.g. `2/4`)
- **Time tracking** — per-task start/pause timer with running total ("Worked: 2h 15m"), plus manual +/- 15m adjustment
- **Rich notes** — lightweight markdown-style formatting (bold, italic, lists) via a toolbar on the notes field
- **Task history** — per-task activity trail (created, edited, completed, moved) in an expandable panel
- **Projects** — custom projects with icons/colors, per-project stats and filtering
- **Kanban board** — drag-and-drop across custom columns, plus a keyboard/touch-friendly "move to column" control
- **Calendar** — month view with task counts per day; click a day to filter, Shift+click to quick-add a task due that day
- **Analytics** — Chart.js-powered charts for completion trends, categories, and workload
- **Pomodoro timer** — focus/break sessions tied to individual tasks
- **Smart reminders** — browser notifications for upcoming and overdue tasks
- **AI assistant** — free, local, rule-based assistant (prioritize tasks, summarize workload, flag risks, break down tasks, suggest a time-blocked daily schedule, weekly summaries) — runs entirely on your own task data in the browser, no account or API key
- **Gmail cloud sync** — optional sign-in with your Google/Gmail account, backing up to a private Google Drive `appDataFolder` that only this app can read
- **Mobile responsive** — slide-in drawer navigation, adaptive layouts down to phone width
- **Accessibility** — keyboard shortcuts (`/` search, `N` new task, `Esc` close, `?` shortcuts help, `1–9` jump to section), focus-visible states, ARIA labels/landmarks, skip-to-content link
- **Import/export** — JSON backups and PDF export
- **Themes** — light/dark mode

## Tech stack

- Vanilla HTML/CSS/JS — no build tooling required, just open `index.html`
- [Chart.js](https://www.chartjs.org/) for analytics
- [jsPDF](https://github.com/parallax/jsPDF) for PDF export
- [Google Identity Services](https://developers.google.com/identity/gsi/web) + [Google Drive API](https://developers.google.com/drive/api) for optional Gmail cloud sync

## Project structure

```
taskflow/
├── index.html            # Landing page — what TaskFlow is, feature overview
├── about.html             # About page — mission, principles, feature recap
├── style.css              # Landing/about page styles (shared)
├── script.js              # Landing/about page scroll-reveal + mobile nav (shared)
├── app.html               # The actual app
├── css/                   # App styles, split by feature
│   ├── base.css            # CSS variables, layout shell, sidebar, topbar, loading screen, mobile drawer
│   ├── dashboard.css       # greeting banner, stat cards
│   ├── tasks.css           # task form, task list, subtasks, timer, calendar, activity feed
│   ├── projects.css        # project cards and toolbar
│   ├── components.css      # toasts, tags, animations, empty states, shortcuts modal, responsive breakpoints
│   ├── kanban.css          # Kanban board
│   ├── analytics.css       # chart containers
│   └── settings.css        # AI assistant panel, settings panel, Pomodoro widget
└── js/                    # App logic, split by feature
    ├── state.js              # DOM references and shared app state
    ├── utils.js               # small helpers, localStorage read/write
    ├── projects.js            # project CRUD, project stats bar
    ├── activity.js            # activity log feed
    ├── rich-notes.js          # markdown-style notes toolbar + safe renderer
    ├── tasks.js                # task CRUD, filtering, inline edit, task history
    ├── subtasks.js             # subtask checklist per task
    ├── time-tracking.js        # per-task start/pause timer + manual adjustment
    ├── theme.js                # light/dark theme toggle
    ├── dashboard.js            # greeting, stat cards, streaks
    ├── calendar.js             # month calendar view, quick-add on date
    ├── ui-feedback.js          # toasts, undo toast, countdown text
    ├── import-export.js        # JSON backup import/export, PDF export
    ├── ui-interactions.js      # nav, topbar, event wiring
    ├── keyboard-shortcuts.js   # mobile nav drawer, keyboard shortcuts, shortcuts modal
    ├── effects.js              # loading screen, cursor glow, particle background
    ├── kanban.js                # drag-and-drop Kanban board + accessible move control
    ├── analytics.js            # Chart.js dashboards
    ├── pomodoro.js              # focus timer
    ├── notifications.js        # browser notification permissions/reminders
    ├── cloud-sync.js           # Gmail/Google sign-in + Drive appDataFolder sync
    ├── ai-assistant.js         # free local rule-based assistant (no external calls)
    └── init.js                  # boot sequence, runs after all modules load
```

`index.html` is the marketing/landing page — it's what a visitor lands on first, with a "Launch App" button pointing to `app.html`. `about.html` is a second front-facing page covering the project's mission and principles, linked from both the nav and footer. `app.html` is the actual task manager; its sidebar logo links back to `index.html`.

Both CSS and JS load as plain `<link>`/`<script>` tags rather than bundled modules, so there's no build step — everything shares one scope, same behavior as a single-file app, just organized by feature. Tag order in `app.html` matches the dependency/cascade order (e.g. `rich-notes.js` loads before `tasks.js`, which calls into it).

## Running locally

No build step needed:

```
git clone https://github.com/<your-username>/taskflow.git
cd taskflow
python3 -m http.server 8000
```

Then open http://localhost:8000

> Note: the `-m` flag matters — `python3 -m http.server` runs Python's built-in module server. Dropping the `-m` will not start a server correctly.

Alternatively, any static file server works (VS Code's Live Server extension, `npx serve`, etc.) as long as it's rooted at this folder, since `app.html` sits alongside `index.html`.

## Roadmap

Done: subtasks, rich text notes, per-task time tracking (with manual adjustment), task history, mobile-responsive layout, accessibility/keyboard shortcuts, Google Drive cloud sync.

Planned next: goals/habit tracking, richer Kanban touch interactions, deeper calendar previews. See open issues for details.

## License

MIT
