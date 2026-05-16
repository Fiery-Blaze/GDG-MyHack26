from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.agents.registry import register_all_agents
from app.api.routes.agents import router as agents_router
from app.core.database import close_connections


@asynccontextmanager
async def lifespan(app: FastAPI):
    register_all_agents()
    yield
    await close_connections()


app = FastAPI(
    title="ArkFlow Connect API",
    description="AI-powered animal health & transfer platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "ArkFlow Connect"}
