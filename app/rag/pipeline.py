from langchain_core.documents import Document

from app.rag.chain import RAGChain
from app.rag.loaders.loader_factory import LoaderFactory
from app.rag.retriever import Retriever
from app.rag.splitter import DocumentSplitter
from app.rag.vector_store import VectorStore


class RAGPipeline:
    """
    Coordinates document ingestion and
    question answering.
    """

    def __init__(
        self,
        loader_factory: LoaderFactory,
        splitter: DocumentSplitter,
        vector_store: VectorStore,
        retriever: Retriever,
        chain: RAGChain,
    ) -> None:

        self._loader_factory = loader_factory
        self._splitter = splitter
        self._vector_store = vector_store
        self._retriever = retriever
        self._chain = chain

    def ingest(
        self,
        sources: list[str],
        metadata: dict[str, object] | None = None,
    ) -> int:
        """
        Load, split and index supported sources.

        Args:
            sources:
                List of supported sources.

            metadata:
                Metadata that should be attached to
                every generated document chunk.

        Returns:
            Number of indexed chunks.
        """

        if not sources:
            raise ValueError(
                "At least one source must be provided."
            )

        documents: list[Document] = []

        for source in sources:

            loader = self._loader_factory.get_loader(source)

            documents.extend(
                loader.load(source)
            )

        if not documents:
            raise ValueError(
                "No documents were loaded."
            )

        chunks = self._splitter.split(
            documents
        )

        if not chunks:
            raise ValueError(
                "No document chunks were created."
            )

        # ------------------------------------------------------
        # Attach application-level metadata
        # ------------------------------------------------------

        if metadata:
            for chunk in chunks:
                chunk.metadata.update(metadata)

        # ------------------------------------------------------
        # Store chunks in vector database
        # ------------------------------------------------------

        self._vector_store.add_documents(
            chunks
        )

        return len(chunks)

    def query(
    self,
    question: str,
    workspace_id: int | None = None,
    ) -> str:
        """
        Answer a question using the indexed
        knowledge base.
        """

        if not question.strip():
            raise ValueError(
                "Question cannot be empty."
            )

        documents = self._retriever.retrieve(
             query=question,
             workspace_id=workspace_id,
        )

        if not documents:
            return (
                "I could not find any relevant "
                "information in the knowledge base."
            )

        context = "\n\n".join(
            document.page_content
            for document in documents
        )

        return self._chain.generate(
            question=question,
            context=context,
        )