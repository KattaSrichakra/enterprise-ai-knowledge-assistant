from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.workspace import Workspace


class WorkspaceService:
    """
    Handles workspace database operations.
    """

    @staticmethod
    def create_workspace(
        db: Session,
        user_id: int,
        name: str,
        description: str | None = None,
    ) -> Workspace:
        """
        Create a workspace for a specific user.
        """

        normalized_name = name.strip()

        if not normalized_name:
            raise ValueError(
                "Workspace name cannot be empty."
            )

        existing_workspace = db.scalar(
            select(Workspace).where(
                Workspace.user_id == user_id,
                Workspace.name == normalized_name,
            )
        )

        if existing_workspace is not None:
            raise ValueError(
                "A workspace with this name already exists."
            )

        workspace = Workspace(
            user_id=user_id,
            name=normalized_name,
            description=(
                description.strip()
                if description is not None
                else None
            ),
        )

        db.add(workspace)
        db.commit()
        db.refresh(workspace)

        return workspace

    @staticmethod
    def get_user_workspaces(
        db: Session,
        user_id: int,
    ) -> list[Workspace]:
        """
        Return all workspaces belonging to a specific user.
        """

        statement = (
            select(Workspace)
            .where(Workspace.user_id == user_id)
            .order_by(Workspace.created_at.desc())
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_workspace(
        db: Session,
        user_id: int,
        workspace_id: int,
    ) -> Workspace | None:
        """
        Return a workspace only if it belongs to the given user.
        """

        statement = select(Workspace).where(
            Workspace.id == workspace_id,
            Workspace.user_id == user_id,
        )

        return db.scalar(statement)

    @staticmethod
    def update_workspace(
        db: Session,
        user_id: int,
        workspace_id: int,
        name: str | None = None,
        description: str | None = None,
    ) -> Workspace | None:
        """
        Update a workspace only if it belongs to the given user.
        """

        workspace = WorkspaceService.get_workspace(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
        )

        if workspace is None:
            return None

        if name is not None:
            normalized_name = name.strip()

            if not normalized_name:
                raise ValueError(
                    "Workspace name cannot be empty."
                )

            duplicate_workspace = db.scalar(
                select(Workspace).where(
                    Workspace.user_id == user_id,
                    Workspace.name == normalized_name,
                    Workspace.id != workspace_id,
                )
            )

            if duplicate_workspace is not None:
                raise ValueError(
                    "A workspace with this name already exists."
                )

            workspace.name = normalized_name

        if description is not None:
            workspace.description = description.strip()

        db.commit()
        db.refresh(workspace)

        return workspace

    @staticmethod
    def delete_workspace(
        db: Session,
        user_id: int,
        workspace_id: int,
    ) -> bool:
        """
        Delete a workspace only if it belongs to the given user.

        Returns:
            True if deleted, otherwise False.
        """

        workspace = WorkspaceService.get_workspace(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
        )

        if workspace is None:
            return False

        db.delete(workspace)
        db.commit()

        return True