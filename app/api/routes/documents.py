import shutil
import tempfile
from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.config import settings
from app.rag.loaders.loader_factory import LoaderFactory
from app.core.dependencies import (
    get_current_user,
    get_database,
    get_pipeline,
)
from app.models.requests import URLRequest
from app.models.responses import UploadResponse
from app.models.user import User
from app.rag.pipeline import RAGPipeline
from app.services.document_service import DocumentService
from app.services.workspace_service import WorkspaceService


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


# ==========================================================
# List Documents
# ==========================================================

@router.get(
    "",
    summary="List Documents",
)
def list_documents(
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace whose documents should be listed.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
):
    """
    Return all documents belonging to the selected workspace.
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

    documents = DocumentService.get_workspace_documents(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
    )

    return documents


# ==========================================================
# Upload Documents
# ==========================================================

@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload Documents",
)
async def upload_documents(
    files: Annotated[
        list[UploadFile],
        File(
            description="One or more documents to upload."
        ),
    ],
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace where the documents will be stored.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
    pipeline: RAGPipeline = Depends(get_pipeline),
) -> UploadResponse:
    """
    Upload one or more documents into a user's workspace.
    """

    # ==========================================================
    # Verify workspace ownership
    # ==========================================================

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

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one file must be provided.",
        )

    temporary_paths: list[Path] = []

    documents_indexed = 0
    chunks_indexed = 0

    try:
        for upload in files:

            # ==================================================
            # Validate filename
            # ==================================================

            if not upload.filename:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Uploaded file must have a filename.",
                )

            original_filename = Path(
                upload.filename
            ).name

            if not original_filename:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid filename.",
                )

            extension = Path(
                             original_filename
                            ).suffix.lower()

            if not LoaderFactory.is_supported_file(
                  original_filename
            ):
                 raise HTTPException(
                     status_code=status.HTTP_400_BAD_REQUEST,
                     detail=(
                         f"Unsupported file type '{extension}'."
               ),
            )

            # ==================================================
            # Create temporary file
            # ==================================================

            suffix = Path(
                original_filename
            ).suffix

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=suffix,
            ) as temp_file:

                shutil.copyfileobj(
                    upload.file,
                    temp_file,
                )

                temporary_path = Path(
                    temp_file.name
                )

            temporary_paths.append(
                temporary_path
            )

            # ==================================================
            # Validate file size
            # ==================================================

            file_size = temporary_path.stat().st_size

            max_size = (
                settings.MAX_UPLOAD_SIZE_MB
                * 1024
                * 1024
            )

            if file_size > max_size:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=(
                        f"File '{original_filename}' exceeds "
                        f"the maximum allowed size of "
                        f"{settings.MAX_UPLOAD_SIZE_MB} MB."
                    ),
                )

            if file_size == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"File '{original_filename}' is empty."
                    ),
                )

            # ==================================================
            # Determine logical document
            # ==================================================

            document_name = Path(
                original_filename
            ).stem

            document = (
                DocumentService.get_workspace_document_by_name(
                    db=db,
                    user_id=current_user.id,
                    workspace_id=workspace_id,
                    name=document_name,
                )
            )

            try:

                # ==================================================
                # Create logical document if it doesn't exist
                # ==================================================

                if document is None:

                    document = DocumentService.create_document(
                        db=db,
                        user_id=current_user.id,
                        workspace_id=workspace_id,
                        name=document_name,
                        source_type="file",
                        original_filename=original_filename,
                    )

                # ==================================================
                # Create document version
                # ==================================================

                latest_versions = (
                    DocumentService.get_document_versions(
                        db=db,
                        user_id=current_user.id,
                        workspace_id=workspace_id,
                        document_id=document.id,
                    )
                )

                latest_version_before_upload = (
                    latest_versions[0]
                    if latest_versions
                    else None
                )

                version = DocumentService.create_version(
                    db=db,
                    user_id=current_user.id,
                    workspace_id=workspace_id,
                    document_id=document.id,
                    source_path=temporary_path,
                    content_type=upload.content_type,
                )

                # ==================================================
                # Detect duplicate upload
                # ==================================================

                is_duplicate = (
                    latest_version_before_upload is not None
                    and version.id
                    == latest_version_before_upload.id
                )

                if is_duplicate:
                    continue

                # ==================================================
                # RAG ingestion
                # ==================================================

                source_type = (
                     "image"
                     if Path(original_filename).suffix.lower()
                     in LoaderFactory.IMAGE_EXTENSIONS
                     else "file"
      )

                indexed_chunks = pipeline.ingest(
                     sources=[
                          str(temporary_path),
              ],
              metadata={
                  "user_id": current_user.id,
                  "workspace_id": workspace_id,
                  "document_id": document.id,
                  "document_version_id": version.id,
                  "source_type": source_type,
                  "document_name": document.name, },
                  )
                # ==================================================
                # Mark version as indexed
                # ==================================================

                DocumentService.mark_version_indexed(
                    db=db,
                    user_id=current_user.id,
                    workspace_id=workspace_id,
                    document_id=document.id,
                    version_id=version.id,
                )

                documents_indexed += 1
                chunks_indexed += indexed_chunks

            except Exception as exc:

                # ==================================================
                # Mark version as failed when possible
                # ==================================================

                if (
                    "version" in locals()
                    and "document" in locals()
                    and version is not None
                    and document is not None
                ):

                    try:
                        DocumentService.mark_version_failed(
                            db=db,
                            user_id=current_user.id,
                            workspace_id=workspace_id,
                            document_id=document.id,
                            version_id=version.id,
                        )

                    except Exception:
                        pass

                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=(
                        f"Failed to index '{original_filename}'."
                    ),
                ) from exc

        return UploadResponse(
            message="Documents uploaded successfully.",
            documents_indexed=documents_indexed,
            chunks_indexed=chunks_indexed,
        )

    finally:

        for upload in files:
            await upload.close()

        for temporary_path in temporary_paths:

            if temporary_path.exists():
                temporary_path.unlink()


# ==========================================================
# Upload URL
# ==========================================================

@router.post(
    "/url",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload URL",
)
def upload_url(
    request: URLRequest,
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace where the web page will be stored.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
    pipeline: RAGPipeline = Depends(get_pipeline),
) -> UploadResponse:
    """
    Load a web page and index it into the selected workspace.
    """

    # ==========================================================
    # Verify workspace ownership
    # ==========================================================

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

    url = str(request.url)

    # ==========================================================
    # Create logical document
    # ==========================================================

    document = DocumentService.create_document(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
        name=url,
        source_type="url",
        source_url=url,
    )

    # ==========================================================
    # Create document version
    # ==========================================================

    version = DocumentService.create_version(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
        document_id=document.id,
        source_path=None,
        content_type="text/html",
    )

    try:

        # ======================================================
        # RAG ingestion
        # ======================================================

        chunks_indexed = pipeline.ingest(
            sources=[url],
            metadata={
                "user_id": current_user.id,
                "workspace_id": workspace_id,
                "document_id": document.id,
                "document_version_id": version.id,
                "source_type": "url",
                "document_name": document.name,
                "source_url": url,
            },
        )

        # ======================================================
        # Mark version as indexed
        # ======================================================

        DocumentService.mark_version_indexed(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            document_id=document.id,
            version_id=version.id,
        )

    except Exception as exc:

        try:
            DocumentService.mark_version_failed(
                db=db,
                user_id=current_user.id,
                workspace_id=workspace_id,
                document_id=document.id,
                version_id=version.id,
            )

        except Exception:
            pass

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to index the web page.",
        ) from exc

    return UploadResponse(
        message="Web page indexed successfully.",
        documents_indexed=1,
        chunks_indexed=chunks_indexed,
    )


# ==========================================================
# Get Document Versions
# ==========================================================

@router.get(
    "/{document_id}/versions",
    summary="Get Document Versions",
)
def get_document_versions(
    document_id: int,
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace containing the document.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
):
    """
    Return all versions of a specific document.
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

    try:
        versions = DocumentService.get_document_versions(
            db=db,
            user_id=current_user.id,
            workspace_id=workspace_id,
            document_id=document_id,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return versions


# ==========================================================
# Get Document Details
# ==========================================================

@router.get(
    "/{document_id}",
    summary="Get Document Details",
)
def get_document(
    document_id: int,
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace containing the document.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
):
    """
    Return details of a specific document.
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

    return document


# ==========================================================
# Delete Document
# ==========================================================

@router.delete(
    "/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Document",
)
def delete_document(
    document_id: int,
    workspace_id: int = Query(
        ...,
        gt=0,
        description="Workspace containing the document.",
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_database),
    pipeline: RAGPipeline = Depends(get_pipeline),
) -> None:
    """
    Delete a document and its associated versions,
    stored files, and vector-store chunks.
    """

    # ==========================================================
    # Verify workspace ownership
    # ==========================================================

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

    # ==========================================================
    # Verify document ownership
    # ==========================================================

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

    # ==========================================================
    # Collect stored files before database deletion
    # ==========================================================

    versions = DocumentService.get_document_versions(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
        document_id=document_id,
    )

    storage_paths = [
        Path(version.storage_path)
        for version in versions
        if version.storage_path
    ]

    # ==========================================================
    # Delete vector-store chunks first
    # ==========================================================

    try:
        pipeline.delete_document(
            workspace_id=workspace_id,
            document_id=document_id,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document from the vector store.",
        ) from exc

    # ==========================================================
    # Delete database records
    # ==========================================================

    deleted = DocumentService.delete_document(
        db=db,
        user_id=current_user.id,
        workspace_id=workspace_id,
        document_id=document_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # ==========================================================
    # Delete physical stored files
    # ==========================================================

    for storage_path in storage_paths:

        try:
            if storage_path.exists():
                storage_path.unlink()

        except Exception:
            # Database and vector-store deletion have already
            # succeeded. Do not report the entire request as
            # failed because of filesystem cleanup.
            pass

    # ==========================================================
    # Remove empty document directory when possible
    # ==========================================================

    document_directory = (
        settings.DATA_DIR
        / "documents"
        / f"workspace_{workspace_id}"
        / f"document_{document_id}"
    )

    try:
        if document_directory.exists():
            shutil.rmtree(
                document_directory,
                ignore_errors=True,
            )

    except Exception:
        pass

    return None
