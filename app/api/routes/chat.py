from fastapi import APIRouter, Depends

from app.core.dependencies import get_pipeline
from app.models.requests import ChatRequest
from app.models.responses import ChatResponse
from app.rag.pipeline import RAGPipeline


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
    pipeline: RAGPipeline = Depends(get_pipeline),
) -> ChatResponse:
    """
    Answer a user question using the RAG pipeline.
    """

    answer = pipeline.query(request.question)

    return ChatResponse(
        answer=answer,
    )