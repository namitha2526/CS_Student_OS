# Database migrations

This project uses **Alembic** for schema migrations (see `alembic/` at the backend root).

## Commands

```bash
cd backend
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

For local development, tables are also created automatically on startup if missing (`init_db`).
