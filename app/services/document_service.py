import hashlib
import shutil
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document, DocumentVersion


class DocumentService:
    """
    Handles document and document-version operations.

    All operations are workspace-aware and require the
    authenticated user's ID for ownership verification.
    """

    # ==========================================================
    # Workspace ownership
    # ==========================================================

    @staticmethod
    def _get_document(
        db: Session,
        user_id: int,
        workspace_id: int,
        document_id: int,
    ) -> Document | None:
        """
        Return a document only when it belongs to the
        authenticated user's workspace.
        """

        statement = (
            select(Document)
            .join(
                Document.workspace,
            )
            .where(
                Document.id == document_id,
                Document.workspace_id == workspace_id,
                Document.workspace.has(
                    user_id=user_id,
                ),
            )
        )

        return db.scalar(statement)

    # ==========================================================
    # SHA-256
    # ==========================================================

    @staticmethod
    def calculate_checksum(
        file_path: Path,
    ) -> str:
        """
        Calculate the SHA-256 checksum of a file.
        """

        sha256 = hashlib.sha256()

        with file_path.open("rb") as file:
            for chunk in iter(
                lambda: file.read(1024 * 1024),
                b"",
            ):
                sha256.update(chunk)

        return sha256.hexdigest()

    # ==========================================================
    # Persistent storage
    # ==========================================================

    @staticmethod
    def _get_version_storage_path(
        workspace_id: int,
        document_id: int,
        version_number: int,
        filename: str,
    ) -> Path:
        """
        Return the persistent storage location for a document version.
        """

        storage_directory = (
            settings.DATA_DIR
            / "documents"
            / f"workspace_{workspace_id}"
            / f"document_{document_id}"
            / f"version_{version_number}"
        )

        storage_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        return storage_directory / filename

    @staticmethod
    def _copy_to_storage(
        source_path: Path,
        destination_path: Path,
    ) -> None:
        """
        Copy the original uploaded file into persistent storage.
        """

        try:
            shutil.copy2(
                source_path,
                destination_path,
            )

        except Exception as exc:
            raise RuntimeError(
                "Failed to store the document."
            ) from exc

        # ==========================================================
    # Find document by name
    # ==========================================================

    @staticmethod
    def get_workspace_document_by_name(
        db: Session,
        user_id: int,
        workspace_id: int,
        name: str,
    ) -> Document | None:
        """
        Return a document by name only when it belongs to
        the authenticated user's workspace.
        """

        normalized_name = name.strip()

        if not normalized_name:
            return None

        statement = (
            select(Document)
            .where(
                Document.workspace_id == workspace_id,
                Document.name == normalized_name,
                Document.workspace.has(
                    user_id=user_id,
                ),
            )
        )

        return db.scalar(statement)
    
    # ==========================================================
    # Create document
    # ==========================================================

    @staticmethod
    def create_document(
        db: Session,
        user_id: int,
        workspace_id: int,
        name: str,
        source_type: str,
        original_filename: str | None = None,
        source_url: str | None = None,
    ) -> Document:
        """
        Create a logical document inside a user's workspace.
        """

        from app.models.workspace import Workspace

        workspace = db.scalar(
            select(Workspace).where(
                Workspace.id == workspace_id,
                Workspace.user_id == user_id,
            )
        )

        if workspace is None:
            raise ValueError(
                "Workspace not found."
            )

        normalized_name = name.strip()

        if not normalized_name:
            raise ValueError(
                "Document name cannot be empty."
            )

        document = Document(
            workspace_id=workspace_id,
            name=normalized_name,
            source_type=source_type,
            original_filename=original_filename,
            source_url=source_url,
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        return document

    # ==========================================================
    # Create document version
    # ==========================================================

    @staticmethod
    def create_version(
        db: Session,
        user_id: int,
        workspace_id: int,
        document_id: int,
        source_path: Path | None = None,
        content_type: str | None = None,
    ) -> DocumentVersion:
        """
        Create a new version for an existing document.
        """

        document = DocumentService._get_document(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            document_id=document_id,
        )

        if document is None:
            raise ValueError(
                "Document not found."
            )

        # Find the latest version.
        latest_version = db.scalar(
            select(DocumentVersion)
            .where(
                DocumentVersion.document_id == document_id,
            )
            .order_by(
                DocumentVersion.version_number.desc()
            )
        )

        next_version_number = (
            latest_version.version_number + 1
            if latest_version is not None
            else 1
        )

        checksum = None
        file_size = None
        storage_path = None

        if source_path is not None:

            if not source_path.exists():
                raise ValueError(
                    "Source document does not exist."
                )

            checksum = DocumentService.calculate_checksum(
                source_path
            )

            file_size = source_path.stat().st_size

            # Check whether the exact same file is already
            # present as the latest version.
            if (
                latest_version is not None
                and latest_version.checksum_sha256 == checksum
            ):
                return latest_version

            filename = (
                document.original_filename
                or source_path.name
            )

            destination = (
                DocumentService._get_version_storage_path(
                    workspace_id=workspace_id,
                    document_id=document_id,
                    version_number=next_version_number,
                    filename=filename,
                )
            )

            DocumentService._copy_to_storage(
                source_path=source_path,
                destination_path=destination,
            )

            storage_path = str(destination)

        version = DocumentVersion(
            document_id=document_id,
            version_number=next_version_number,
            storage_path=storage_path,
            checksum_sha256=checksum,
            file_size=file_size,
            content_type=content_type,
            status="stored",
        )

        db.add(version)
        db.commit()
        db.refresh(version)

        return version

    # ==========================================================
    # Update version status
    # ==========================================================

    @staticmethod
    def mark_version_indexed(
        db: Session,
        user_id: int,
        workspace_id: int,
        document_id: int,
        version_id: int,
    ) -> DocumentVersion:
        """
        Mark a document version as successfully indexed.
        """

        document = DocumentService._get_document(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            document_id=document_id,
        )

        if document is None:
            raise ValueError(
                "Document not found."
            )

        version = db.scalar(
            select(DocumentVersion).where(
                DocumentVersion.id == version_id,
                DocumentVersion.document_id == document_id,
            )
        )

        if version is None:
            raise ValueError(
                "Document version not found."
            )

        version.status = "indexed"

        db.commit()
        db.refresh(version)

        return version

    @staticmethod
    def mark_version_failed(
        db: Session,
        user_id: int,
        workspace_id: int,
        document_id: int,
        version_id: int,
    ) -> DocumentVersion:
        """
        Mark a document version as failed during indexing.
        """

        document = DocumentService._get_document(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            document_id=document_id,
        )

        if document is None:
            raise ValueError(
                "Document not found."
            )

        version = db.scalar(
            select(DocumentVersion).where(
                DocumentVersion.id == version_id,
                DocumentVersion.document_id == document_id,
            )
        )

        if version is None:
            raise ValueError(
                "Document version not found."
            )

        version.status = "failed"

        db.commit()
        db.refresh(version)

        return version

    # ==========================================================
    # List documents
    # ==========================================================

    @staticmethod
    def get_workspace_documents(
        db: Session,
        user_id: int,
        workspace_id: int,
    ) -> list[Document]:
        """
        Return all documents belonging to the authenticated
        user's workspace.
        """

        from app.models.workspace import Workspace

        workspace = db.scalar(
            select(Workspace).where(
                Workspace.id == workspace_id,
                Workspace.user_id == user_id,
            )
        )

        if workspace is None:
            raise ValueError(
                "Workspace not found."
            )

        statement = (
            select(Document)
            .where(
                Document.workspace_id == workspace_id,
            )
            .order_by(
                Document.created_at.desc()
            )
        )

        return list(
            db.scalars(statement).all()
        )

    # ==========================================================
    # Get document
    # ==========================================================

    @staticmethod
    def get_document(
        db: Session,
        user_id: int,
        workspace_id: int,
        document_id: int,
    ) -> Document | None:
        """
        Return a document only if it belongs to the
        authenticated user's workspace.
        """

        return DocumentService._get_document(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            document_id=document_id,
        )

    # ==========================================================
    # Get document versions
    # ==========================================================

    @staticmethod
    def get_document_versions(
        db: Session,
        user_id: int,
        workspace_id: int,
        document_id: int,
    ) -> list[DocumentVersion]:
        """
        Return all versions of a document after verifying
        workspace ownership.
        """

        document = DocumentService._get_document(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            document_id=document_id,
        )

        if document is None:
            raise ValueError(
                "Document not found."
            )

        statement = (
            select(DocumentVersion)
            .where(
                DocumentVersion.document_id == document_id,
            )
            .order_by(
                DocumentVersion.version_number.desc()
            )
        )

        return list(
            db.scalars(statement).all()
        )

    # ==========================================================
    # Delete document
    # ==========================================================

    @staticmethod
    def delete_document(
        db: Session,
        user_id: int,
        workspace_id: int,
        document_id: int,
    ) -> bool:
        """
        Delete a document only if it belongs to the
        authenticated user's workspace.
        """

        document = DocumentService._get_document(
            db=db,
            user_id=user_id,
            workspace_id=workspace_id,
            document_id=document_id,
        )

        if document is None:
            return False

        db.delete(document)
        db.commit()

        return True