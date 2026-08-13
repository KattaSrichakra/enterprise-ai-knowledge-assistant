from pydantic import BaseModel, EmailStr, Field, HttpUrl

class ChatRequest(BaseModel):
    """
    Chat request model.
    """

    question: str = Field(
        ...,
        min_length=1,
        description="User question.",
        examples=[
            "What is FastAPI?",
        ],
    )

    session_id: int | None = Field(
        default=None,
        gt=0,
        description="Existing chat session ID. "
        "If omitted, a new session is created.",
    )

class URLRequest(BaseModel):
    """
    Request model for indexing a web page.
    """

    url: HttpUrl = Field(
        ...,
        description="HTTP or HTTPS URL to index.",
        examples=[
            "https://example.com",
        ],
    )


class RegisterRequest(BaseModel):
    """
    Request model for user registration.
    """

    email: EmailStr = Field(
        ...,
        description="User email address.",
        examples=[
            "user@example.com",
        ],
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="User password.",
    )

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=255,
        description="User full name.",
        examples=[
            "John Doe",
        ],
    )


class LoginRequest(BaseModel):
    """
    Request model for user login.
    """

    email: EmailStr = Field(
        ...,
        description="Registered user email address.",
        examples=[
            "user@example.com",
        ],
    )

    password: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="User password.",
    )


class WorkspaceCreateRequest(BaseModel):
    """
    Request model for creating a workspace.
    """

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Workspace name.",
        examples=[
            "My Research Workspace",
        ],
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
        description="Optional workspace description.",
        examples=[
            "Workspace for storing research documents.",
        ],
    )


class WorkspaceUpdateRequest(BaseModel):
    """
    Request model for updating a workspace.
    """

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
        description="Updated workspace name.",
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
        description="Updated workspace description.",
    )