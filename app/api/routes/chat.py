from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_database,
    get_pipeline,
)
from app.memory.chat_memory import ChatMemory
from app.models.requests import ChatRequest
from app.models.responses import ChatResponse
from app.models.user import User
from app.rag.pipeline import RAGPipeline
from app.services.workspace_service import WorkspaceService
from app.services.document_service import DocumentService

router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)

chat_memory = ChatMemory()


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

    A new chat session is created when session_id
    is not provided. Existing sessions are validated
    against the authenticated user and workspace.
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

    # ------------------------------------------------------
    # Chat session
    # ------------------------------------------------------

    if request.session_id is None:
        session = chat_memory.create_session(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
        )

    else:
        session = chat_memory.get_session(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            session_id=request.session_id,
        )

        if session is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found.",
            )

    # ------------------------------------------------------
    # Conversation history
    # ------------------------------------------------------

    messages = chat_memory.get_messages(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
        session_id=session.id,
    )

    history = "\n".join(
        f"{message.role.capitalize()}: {message.content}"
        for message in messages
    )
    document_id = None

    workspace_documents = (
        DocumentService.get_workspace_documents(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
        )
    )

    question_lower = request.question.lower()

    for document in workspace_documents:
        candidates = [
            document.name,
            document.original_filename,
        ]

        for candidate in candidates:
            if candidate and candidate.lower() in question_lower:
                document_id = document.id
                break

        if document_id is not None:
            break
    # ------------------------------------------------------
    # RAG answer
    # ------------------------------------------------------

    try:
        answer = pipeline.query(
            question=request.question,
            workspace_id=workspace_id,
            document_id=document_id,
            history=history,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    # ------------------------------------------------------
    # Persist conversation
    # ------------------------------------------------------

    chat_memory.add_message(
        db=db,
        session_id=session.id,
        role="user",
        content=request.question,
    )

    chat_memory.add_message(
        db=db,
        session_id=session.id,
        role="assistant",
        content=answer,
    )

    return ChatResponse(
        answer=answer,
        session_id=session.id,
    )