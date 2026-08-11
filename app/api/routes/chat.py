from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_database,
    get_pipeline,
)
from app.models.requests import ChatRequest
from app.models.responses import ChatResponse
from app.models.user import User
from app.rag.pipeline import RAGPipeline
from app.services.workspace_service import WorkspaceService


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


@router.post(
    "",
    response_model=ChatResponse,
    summary="Ask a Question",
)
def chat(
    request: ChatRequest,
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace in which the question should be answered.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
    pipeline: RAGPipeline = Depends(get_pipeline),
) -> ChatResponse:
    """
    Answer a user question using only the knowledge
    belonging to the selected workspace.
    """

    workspace = WorkspaceService.get_workspace(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
    )

    if workspace is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )

    try:
        answer = pipeline.query(
            question=request.question,
            workspace_id=workspace_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return ChatResponse(
        answer=answer,
    )