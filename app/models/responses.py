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