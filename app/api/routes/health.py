from fastapi import APIRouter

from app.models.responses import HealthResponse


router = APIRouter(
    prefix="/health",
    tags=["Health"],
)


@router.get(
    "",
    response_model=HealthResponse,
    summary="Health Check",
)
def health_check() -> HealthResponse:
    """
    Check whether the application is running.
    """

    return HealthResponse(
        status="healthy",
    )