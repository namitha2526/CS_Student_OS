from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.session import Base, engine
from app.routers import (
    analytics,
    auth,
    dsa,
    habits,
    integrations,
    jobs,
    pomodoro,
    projects,
    resources,
    reviews,
    settings_data,
    tasks,
    users,
)
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_if_empty()
    yield


app = FastAPI(title="CS Student OS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://cs-student-os.onrender.com",
        
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = settings.API_V1_PREFIX
app.include_router(auth.router, prefix=api)
app.include_router(users.router, prefix=api)
app.include_router(tasks.router, prefix=api)
app.include_router(dsa.router, prefix=api)
app.include_router(jobs.router, prefix=api)
app.include_router(projects.router, prefix=api)
app.include_router(pomodoro.router, prefix=api)
app.include_router(habits.router, prefix=api)
app.include_router(resources.router, prefix=api)
app.include_router(reviews.router, prefix=api)
app.include_router(analytics.router, prefix=api)
app.include_router(settings_data.router, prefix=api)
app.include_router(integrations.router, prefix=api)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
