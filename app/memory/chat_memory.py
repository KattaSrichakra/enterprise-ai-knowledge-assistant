from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.chat import ChatMessage, ChatSession


class ChatMemory:
    """
    Persistent conversation memory backed by PostgreSQL.

    Chat history is isolated by both user and workspace.
    A chat session can optionally be associated with
    a specific document.
    """

    def create_session(
        self,
        db: Session,
        user_id: int,
        workspace_id: int,
        document_id: int | None = None,
        title: str = "New Conversation",
    ) -> ChatSession:
        """
        Create a new chat session for a user and workspace.

        The session may optionally be associated with
        a specific document.
        """

        normalized_title = title.strip() or "New Conversation"

        session = ChatSession(
            user_id=user_id,
            workspace_id=workspace_id,
            document_id=document_id,
            title=normalized_title[:255],
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return session

    def get_session(
        self,
        db: Session,
        user_id: int,
        workspace_id: int,
        session_id: int,
        document_id: int | None = None,
    ) -> ChatSession | None:
        """
        Return a session only when it belongs to the
        authenticated user and requested workspace.
        """

        statement = select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
            ChatSession.workspace_id == workspace_id,
        )

        if document_id is not None:
            statement = statement.where(
                ChatSession.document_id == document_id
            )

        return db.scalar(statement)

    def get_user_sessions(
        self,
        db: Session,
        user_id: int,
        workspace_id: int,
        document_id: int | None = None,
    ) -> list[ChatSession]:
        """
        Return all chat sessions belonging to the
        authenticated user and workspace.
        """

        statement = select(ChatSession).where(
            ChatSession.user_id == user_id,
            ChatSession.workspace_id == workspace_id,
        )

        if document_id is not None:
            statement = statement.where(
                ChatSession.document_id == document_id
            )

        statement = statement.order_by(
            ChatSession.updated_at.desc(),
            ChatSession.id.desc(),
        )

        return list(db.scalars(statement).all())

    def update_session_title(
        self,
        db: Session,
        user_id: int,
        workspace_id: int,
        session_id: int,
        title: str,
    ) -> ChatSession | None:
        """
        Rename an existing chat session after validating
        user and workspace ownership.
        """

        session = self.get_session(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            session_id=session_id,
        )

        if session is None:
            return None

        normalized_title = title.strip()

        if not normalized_title:
            raise ValueError(
                "Conversation title cannot be empty."
            )

        session.title = normalized_title[:255]

        db.commit()
        db.refresh(session)

        return session

    def delete_session(
        self,
        db: Session,
        user_id: int,
        workspace_id: int,
        session_id: int,
    ) -> bool:
        """
        Delete a chat session after validating
        user and workspace ownership.

        Related chat messages are deleted automatically
        through the database relationship cascade.
        """

        session = self.get_session(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            session_id=session_id,
        )

        if session is None:
            return False

        db.delete(session)
        db.commit()

        return True

    def add_message(
        self,
        db: Session,
        session_id: int,
        role: str,
        content: str,
    ) -> ChatMessage:
        """
        Store a message in an existing chat session.
        """

        normalized_role = role.strip().lower()

        if normalized_role not in {
            "user",
            "assistant",
        }:
            raise ValueError(
                "Message role must be 'user' or 'assistant'."
            )

        if not content.strip():
            raise ValueError(
                "Message content cannot be empty."
            )

        message = ChatMessage(
            session_id=session_id,
            role=normalized_role,
            content=content,
        )

        db.add(message)
        db.commit()
        db.refresh(message)

        return message

    def get_messages(
        self,
        db: Session,
        user_id: int,
        workspace_id: int,
        session_id: int,
    ) -> list[ChatMessage]:
        """
        Return messages only from a session belonging to
        the authenticated user and workspace.
        """

        session = self.get_session(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            session_id=session_id,
        )

        if session is None:
            raise ValueError(
                "Chat session not found."
            )

        statement = (
            select(ChatMessage)
            .where(
                ChatMessage.session_id == session_id,
            )
            .order_by(
                ChatMessage.created_at,
                ChatMessage.id,
            )
        )

        return list(db.scalars(statement).all())

    def get_session_messages(
        self,
        db: Session,
        user_id: int,
        workspace_id: int,
        session_id: int,
    ) -> list[ChatMessage]:
        """
        Return messages for a chat session after
        validating user and workspace ownership.
        """

        session = self.get_session(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            session_id=session_id,
        )

        if session is None:
            raise ValueError(
                "Chat session not found."
            )

        statement = (
            select(ChatMessage)
            .where(
                ChatMessage.session_id == session_id,
            )
            .order_by(
                ChatMessage.created_at,
                ChatMessage.id,
            )
        )

        return list(db.scalars(statement).all())

    def build_history(
        self,
        db: Session,
        user_id: int,
        workspace_id: int,
        session_id: int,
    ) -> list[dict[str, str]]:
        """
        Convert persisted messages into the format required
        when constructing conversation context.
        """

        messages = self.get_messages(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            session_id=session_id,
        )

        return [
            {
                "role": message.role,
                "content": message.content,
            }
            for message in messages
        ]