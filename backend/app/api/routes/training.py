from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Request

from ...schemas.training import TrainingAnnotation, TrainingAnnotationRequest, TrainingExport

router = APIRouter(prefix="/training", tags=["training"])


@router.get("/annotations", response_model=list[TrainingAnnotation])
async def list_annotations(request: Request) -> list[TrainingAnnotation]:
    return request.app.state.training_annotations  # type: ignore[attr-defined]


@router.post("/annotations", response_model=TrainingAnnotation)
async def create_annotation(
    payload: TrainingAnnotationRequest,
    request: Request,
) -> TrainingAnnotation:
    annotation = TrainingAnnotation(
        prediction_id=payload.prediction_id,
        mac_address="unknown",
        label=payload.label,
        timestamp=datetime.now(tz=timezone.utc),
        notes=payload.notes,
    )
    request.app.state.training_annotations.append(annotation)  # type: ignore[attr-defined]
    return annotation


@router.get("/export", response_model=TrainingExport)
async def export_training(request: Request) -> TrainingExport:
    samples = request.app.state.training_annotations  # type: ignore[attr-defined]
    return TrainingExport(generated_at=datetime.now(tz=timezone.utc), samples=samples)
