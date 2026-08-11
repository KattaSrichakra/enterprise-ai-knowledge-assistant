from datetime import datetime

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """
    Health check response.
    """

    status: str = Field(
        description="Application status.",
        examples=["healthy"],
    )


class ChatResponse(BaseModel):
    """
    Chat response model.
    """

    answer: str = Field(
        description="Generated answer.",
    )


class UploadResponse(BaseModel):
    """
    Document upload response.
    """

    message: str = Field(
        description="Upload result message.",
    )

    documents_indexed: int = Field(
        ge=0,
        description="Number of indexed documents.",
    )

    chunks_indexed: int = Field(
        ge=0,
        description="Number of indexed document chunks.",
    )


class UserResponse(BaseModel):
    """
    Response model for an authenticated user.
    """

    id: int = Field(
        description="Unique user ID.",
    )

    email: str = Field(
        description="User email address.",
    )

    full_name: str = Field(
        description="User full name.",
    )

    is_active: bool = Field(
        description="Whether the user account is active.",
    )


class TokenResponse(BaseModel):
    """
    Response model returned after successful login.
    """

    access_token: str = Field(
        description="JWT access token.",
    )

    token_type: str = Field(
        default="bearer",
        description="Authentication token type.",
    )


class WorkspaceResponse(BaseModel):
    """
    Response model for a workspace.
    """

    id: int = Field(
        description="Unique workspace ID.",
    )

    user_id: int = Field(
        description="ID of the workspace owner.",
    )

    name: str = Field(
        description="Workspace name.",
    )

    description: str | None = Field(
        default=None,
        description="Workspace description.",
    )

    created_at: datetime = Field(
        description="Workspace creation timestamp.",
    )

    updated_at: datetime = Field(
        description="Workspace last update timestamp.",
    )