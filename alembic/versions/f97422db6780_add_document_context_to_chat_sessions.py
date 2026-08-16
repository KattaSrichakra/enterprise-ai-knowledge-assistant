"""add document context to chat sessions

Revision ID: f97422db6780
Revises: 97371fd2999e
Create Date: 2026-08-15 15:09:20.277830

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f97422db6780"
down_revision: Union[str, Sequence[str], None] = "97371fd2999e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add optional document context to chat sessions."""

    op.add_column(
        "chat_sessions",
        sa.Column(
            "document_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        op.f("ix_chat_sessions_document_id"),
        "chat_sessions",
        ["document_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_chat_sessions_document_id_documents",
        "chat_sessions",
        "documents",
        ["document_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Remove document context from chat sessions."""

    op.drop_constraint(
        "fk_chat_sessions_document_id_documents",
        "chat_sessions",
        type_="foreignkey",
    )

    op.drop_index(
        op.f("ix_chat_sessions_document_id"),
        table_name="chat_sessions",
    )

    op.drop_column(
        "chat_sessions",
        "document_id",
    )