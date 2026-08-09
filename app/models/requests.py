from pydantic import BaseModel, Field, HttpUrl


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