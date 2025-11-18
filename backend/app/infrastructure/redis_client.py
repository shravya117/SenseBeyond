from __future__ import annotations

from typing import Optional

from redis.asyncio import Redis


async def create_redis(url: str) -> Redis:
    return Redis.from_url(url, decode_responses=True)


async def close_redis(client: Optional[Redis]) -> None:
    if client is not None:
        await client.close()
