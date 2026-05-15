# CS Student OS

A **desktop-first**, **dark-mode** productivity platform for Computer Science students: placement prep, DSA tracking, projects, habits, learning resources, weekly reviews, analytics, and a Pomodoro focus system.

This repository is a **full-stack local app**:

- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4 + Framer Motion + React Router + Axios + React Hook Form + Recharts + `@dnd-kit` + Lucide + Sonner + `react-markdown`
- **Backend**: FastAPI + SQLAlchemy + SQLite + JWT + Pydantic
- **Database**: SQLite file created automatically beside the backend process (configurable via `DATABASE_URL`)

## Features (high level)

- **Authentication**: register/login, JWT bearer auth, protected routes, password change, profile updates
- **Dashboard**: draggable/reorderable widgets, weekly consistency, streaks, quotes, summaries from analytics service
- **Tasks**: priorities, deadlines, tags, recurrence fields, statuses, list + Kanban drag/drop + calendar month view
- **DSA tracker**: topic/difficulty/status, bookmarks, notes, charts
- **Applications CRM**: pipeline stages, notes, resume version, follow-ups
- **Projects**: tech stack tags, progress, links, attachment metadata placeholder
- **Pomodoro**: focus/break modes with auto session logging to the API
- **Habits**: streak + 30-day completion rate + heatmap grid
- **Learning hub**: categorized resources + markdown notes
- **Weekly review**: wins/losses/reflection + auto-summary placeholder
- **Analytics**: tasks/focus/DSA topic charts
- **Settings**: export/import JSON backup, preferences JSON, local DB backup notes
- **Labs**: roadmap endpoint for AI + GitHub + LeetCode integrations (placeholders)

## Prerequisites

- Node.js 20+ recommended
- Python 3.11+ recommended

## Backend setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

On first boot, the API creates tables and seeds a **demo** account if the database is empty:

- **username**: `demo`
- **password**: `Password123!`

The SQLite database file defaults to `backend/student_os.db` (relative to your current working directory).

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

By default the Vite dev server proxies `/api` to `http://127.0.0.1:8000` (see `frontend/vite.config.ts`).  
If you prefer an explicit API origin, set `VITE_API_URL` (see `frontend/.env.example`).

## Useful API paths

- `GET /health`
- `GET /api/integrations/roadmap`
- `GET /docs` (Swagger UI)

## Screenshots

Screenshots are intentionally omitted from the repo to keep the tree lightweight. Recommended captures for a portfolio README:

1. Dashboard (glass cards + charts + drag handles)
2. Tasks Kanban board
3. DSA tracker + pie chart
4. Analytics page
5. Focus/Pomodoro screen

## Architecture notes

- **Backend** is organized by routers/schemas/services/models under `backend/app/`.
- **Frontend** is organized by layouts/pages/components/services/context/hooks/types.
- **Migrations**: Alembic-friendly structure is documented in `backend/app/database/migrations/README.md` (dev uses `create_all` + optional manual Alembic workflow).

## Security notes (local portfolio usage)

- Change `SECRET_KEY` for anything beyond local demos.
- JWT is stored in `localStorage` (`csos_token`) for simplicity; for production hardening, prefer HttpOnly cookies + CSRF strategy.

## Future improvements

- Alembic autogenerate migrations checked into the repo
- Code-splitting heavy chart/markdown routes in the frontend bundle
- Web Push notifications + service worker caching
- Real GitHub + LeetCode integrations behind user-supplied tokens
- Optional cloud sync with encrypted backups


