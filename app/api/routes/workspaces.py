from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_database
from app.models.requests import (
    WorkspaceCreateRequest,
    WorkspaceUpdateRequest,
)
from app.models.responses import WorkspaceResponse
from app.models.user import User
from app.services.workspace_service import WorkspaceService


router = APIRouter(
    prefix="/workspaces",
    tags=["Workspaces"],
)


def _to_response(workspace) -> WorkspaceResponse:
    """
    Convert a Workspace ORM object into an API response.
    """

    return WorkspaceResponse(
        id=workspace.id,
        user_id=workspace.user_id,
        name=workspace.name,
        description=workspace.description,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
    )


@router.post(
    "",
    response_model=WorkspaceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_workspace(
    request: WorkspaceCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> WorkspaceResponse:
    """
    Create a new workspace for the authenticated user.
    """

    try:
        workspace = WorkspaceService.create_workspace(
            db=db,
            user_id=current_user.id,
            name=request.name,
            description=request.description,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    return _to_response(workspace)


@router.get(
    "",
    response_model=list[WorkspaceResponse],
)
def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> list[WorkspaceResponse]:
    """
    Return all workspaces belonging to the authenticated user.
    """

    workspaces = WorkspaceService.get_user_workspaces(
        db=db,
        user_id=current_user.id,
    )

    return [
        _to_response(workspace)
        for workspace in workspaces
    ]


@router.get(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
)
def get_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> WorkspaceResponse:
    """
    Return a workspace belonging to the authenticated user.
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

    return _to_response(workspace)


@router.put(
    "/{workspace_id}",
    response_model=WorkspaceResponse,
)
def update_workspace(
    workspace_id: int,
    request: WorkspaceUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> WorkspaceResponse:
    """
    Update a workspace belonging to the authenticated user.
    """

    try:
        workspace = WorkspaceService.update_workspace(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            name=request.name,
            description=request.description,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc

    if workspace is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )

    return _to_response(workspace)


@router.delete(
    "/{workspace_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_workspace(
    workspace_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> None:
    """
    Delete a workspace belonging to the authenticated user.
    """

    deleted = WorkspaceService.delete_workspace(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found.",
        )