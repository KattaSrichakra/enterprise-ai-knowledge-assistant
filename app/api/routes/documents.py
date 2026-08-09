import shutil
import tempfile
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from app.core.dependencies import get_pipeline
from app.models.requests import URLRequest
from app.models.responses import UploadResponse
from app.rag.pipeline import RAGPipeline


router = APIRouter(
    prefix="/documents",
    tags=["Documents"],
)


@router.post(
    "/upload",
    response_model=UploadResponse,
    summary="Upload Documents",
)
async def upload_documents(
    files: Annotated[
        list[UploadFile],
        File(
            description="One or more documents to upload."
        ),
    ],
    pipeline: RAGPipeline = Depends(get_pipeline),
) -> UploadResponse:
    """
    Upload one or more documents and
    index them into the knowledge base.
    """

    temp_paths: list[Path] = []

    try:
        for file in files:

            suffix = ""

            if file.filename:
                suffix = Path(file.filename).suffix

            with tempfile.NamedTemporaryFile(
                delete=False,
                suffix=suffix,
            ) as temp_file:

                shutil.copyfileobj(
                    file.file,
                    temp_file,
                )

                temp_paths.append(
                    Path(temp_file.name)
                )

        chunks_indexed = pipeline.ingest(
            sources=[
                str(path)
                for path in temp_paths
            ],
        )

        return UploadResponse(
            message="Documents uploaded successfully.",
            documents_indexed=len(files),
            chunks_indexed=chunks_indexed,
        )

    finally:
        for file in files:
            await file.close()

        for path in temp_paths:
            if path.exists():
                path.unlink()


@router.post(
    "/url",
    response_model=UploadResponse,
    summary="Add Web Page",
)
def upload_url(
    request: URLRequest,
    pipeline: RAGPipeline = Depends(get_pipeline),
) -> UploadResponse:
    """
    Load a web page and index its content
    into the knowledge base.
    """

    chunks_indexed = pipeline.ingest(
        sources=[
            str(request.url),
        ],
    )

    return UploadResponse(
        message="Web page indexed successfully.",
        documents_indexed=1,
        chunks_indexed=chunks_indexed,
    )