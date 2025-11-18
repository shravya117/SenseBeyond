from __future__ import annotations

from typing import Iterable, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.prediction import PredictionORM
from ..schemas.prediction import PredictionRecord


class PredictionRepository:
    """Persistence layer for historical predictions."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def add_many(self, records: Iterable[PredictionRecord]) -> None:
        for record in records:
            self._session.add(PredictionORM.from_schema(record))
        await self._session.commit()

    async def latest(self, mac_address: Optional[str] = None, limit: int = 50) -> list[PredictionRecord]:
        query = select(PredictionORM).order_by(PredictionORM.timestamp.desc()).limit(limit)
        if mac_address:
            query = query.where(PredictionORM.mac_address == mac_address)
        result = await self._session.execute(query)
        return [row[0].to_schema() for row in result]

    async def history(
        self,
        mac_address: Optional[str] = None,
        page: int = 1,
        page_size: int = 100,
    ) -> list[PredictionRecord]:
        query = select(PredictionORM).order_by(PredictionORM.timestamp.desc())
        if mac_address:
            query = query.where(PredictionORM.mac_address == mac_address)
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self._session.execute(query)
        return [row[0].to_schema() for row in result]
