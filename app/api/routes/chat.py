from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    get_database,
    get_pipeline,
)
from app.memory.chat_memory import ChatMemory
from app.models.requests import ChatRequest
from app.models.responses import (
    ChatMessageResponse,
    ChatResponse,
    ChatSessionResponse,
)
from app.models.user import User
from app.rag.pipeline import RAGPipeline
from app.services.document_service import DocumentService
from app.services.workspace_service import WorkspaceService


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)

chat_memory = ChatMemory()


def build_conversation_title(question: str) -> str:
    """
    Build a short conversation title from the user's
    first question.

    Long questions are truncated with an ellipsis.
    """

    normalized = " ".join(question.strip().split())

    if not normalized:
        return "New Conversation"

    max_length = 70

    if len(normalized) <= max_length:
        return normalized

    return normalized[:67].rstrip() + "..."


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
    document_id: int | None = Query(
        default=None,
        gt=0,
        description=(
            "Optional document to restrict the conversation to."
        ),
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
    pipeline: RAGPipeline = Depends(get_pipeline),
) -> ChatResponse:
    """
    Answer a user question using knowledge belonging
    to the selected workspace or document.

    A new chat session is created when session_id
    is not provided.

    The first question automatically becomes the
    conversation title.

    When a document_id is provided, the session becomes
    associated with that document and RAG retrieval is
    restricted to that document.

    Existing sessions are validated against the
    authenticated user, workspace, and document context.
    """

    # ------------------------------------------------------
    # Workspace validation
    # ------------------------------------------------------

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
    # Document validation
    # ------------------------------------------------------

    if document_id is not None:
        document = DocumentService.get_document(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            document_id=document_id,
        )

        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )

    # ------------------------------------------------------
    # Chat session
    # ------------------------------------------------------

    if request.session_id is None:
        session_title = build_conversation_title(
            request.question
        )

        session = chat_memory.create_session(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            document_id=document_id,
            title=session_title,
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

        # --------------------------------------------------
        # Automatically name an untitled conversation
        # from its first user question.
        # --------------------------------------------------

        if session.title == "New Conversation":
            session.title = build_conversation_title(
                request.question
            )
            db.commit()
            db.refresh(session)

        # --------------------------------------------------
        # Preserve the document context of an existing chat
        # --------------------------------------------------

        if (
            document_id is not None
            and session.document_id != document_id
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "The selected document does not match "
                    "the document associated with this chat session."
                ),
            )

        # Use the document already associated with the session.
        document_id = session.document_id

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


@router.get(
    "/sessions",
    response_model=list[ChatSessionResponse],
    summary="List Chat Sessions",
)
def list_chat_sessions(
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace whose chat sessions should be returned.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> list[ChatSessionResponse]:
    """
    Return all chat sessions belonging to the authenticated
    user inside the selected workspace.
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

    sessions = chat_memory.get_user_sessions(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
    )

    return [
        ChatSessionResponse(
            id=session.id,
            workspace_id=session.workspace_id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
        )
        for session in sessions
    ]


@router.get(
    "/sessions/{session_id}",
    response_model=list[ChatMessageResponse],
    summary="Get Chat Messages",
)
def get_chat_messages(
    session_id: int,
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace containing the chat session.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> list[ChatMessageResponse]:
    """
    Return all messages from a chat session after
    validating user and workspace ownership.
    """

    messages = chat_memory.get_session_messages(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
        session_id=session_id,
    )

    return [
        ChatMessageResponse(
            id=message.id,
            session_id=message.session_id,
            role=message.role,
            content=message.content,
            created_at=message.created_at,
        )
        for message in messages
    ]


@router.put(
    "/sessions/{session_id}",
    response_model=ChatSessionResponse,
    summary="Rename Chat Session",
)
def rename_chat_session(
    session_id: int,
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace containing the chat session.",
    ),
    title: str = Body(
        ...,
        embed=True,
        min_length=1,
        max_length=255,
        description="New conversation title.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> ChatSessionResponse:
    """
    Rename a chat session after validating
    authenticated user and workspace ownership.
    """

    try:
        session = chat_memory.update_session_title(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            session_id=session_id,
            title=title,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found.",
        )

    return ChatSessionResponse(
        id=session.id,
        workspace_id=session.workspace_id,
        title=session.title,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Chat Session",
)
def delete_chat_session(
    session_id: int,
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace containing the chat session.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
) -> None:
    """
    Delete a chat session after validating
    authenticated user and workspace ownership.

    All messages belonging to the session are deleted
    through the database cascade relationship.
    """

    deleted = chat_memory.delete_session(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
        session_id=session_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found.",
        )

    return None