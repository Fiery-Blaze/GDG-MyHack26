import asyncpg
from neo4j import AsyncGraphDatabase
from app.core.config import settings

_pg_pool: asyncpg.Pool | None = None
_neo4j_driver = None


async def get_pg_pool() -> asyncpg.Pool:
    global _pg_pool
    if _pg_pool is None:
        _pg_pool = await asyncpg.create_pool(settings.DATABASE_URL, min_size=2, max_size=10)
    return _pg_pool


def get_neo4j_session():
    global _neo4j_driver
    if _neo4j_driver is None:
        _neo4j_driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USERNAME, settings.NEO4J_PASSWORD),
        )
    return _neo4j_driver.session()


async def close_connections() -> None:
    global _pg_pool, _neo4j_driver
    if _pg_pool:
        await _pg_pool.close()
        _pg_pool = None
    if _neo4j_driver:
        await _neo4j_driver.close()
        _neo4j_driver = None
