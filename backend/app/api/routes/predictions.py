from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request

from ...schemas.prediction import (
    LatestPredictionsResponse,
    PaginatedPredictionsResponse,
    PredictionRecord,
)
from ..deps import get_prediction_cache

router = APIRouter(prefix="/predictions", tags=["predictions"])


@router.get("/latest", response_model=LatestPredictionsResponse)
async def latest_predictions(cache=Depends(get_prediction_cache)) -> LatestPredictionsResponse:
    predictions = cache.latest()
    return LatestPredictionsResponse(predictions=predictions)


@router.get("/history", response_model=PaginatedPredictionsResponse)
async def history(
    request: Request,
    page: int = 1,
    page_size: int = 100,
    mac_address: str | None = None,
) -> PaginatedPredictionsResponse:
    repository = getattr(request.app.state, "prediction_repository", None)
    if repository is None:
        cache = request.app.state.prediction_cache  # type: ignore[attr-defined]
        items = cache.history(mac_address)
        total = len(items)
    else:
        items = await repository.history(mac_address=mac_address, page=page, page_size=page_size)
        total = len(items)
    return PaginatedPredictionsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )
