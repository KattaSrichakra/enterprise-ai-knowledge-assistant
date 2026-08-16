"use client";

import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";
import {
  deleteDocument,
  getDocuments,
  uploadDocuments,
  uploadUrl,
} from "@/lib/api/documents";
import {
  getWorkspaces,
  type Workspace,
} from "@/lib/api/workspaces";
import type { Document } from "@/types/document";

export default function DocumentsPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  const [selectedWorkspaceId, setSelectedWorkspaceId] =
    useState<number | null>(null);

  const [isLoadingWorkspaces, setIsLoadingWorkspaces] =
    useState(true);

  const [isLoadingDocuments, setIsLoadingDocuments] =
    useState(false);

  const [isUploadingFiles, setIsUploadingFiles] =
  useState(false);

  const [isIndexingUrl, setIsIndexingUrl] =
  useState(false);

  const [error, setError] = useState<string | null>(
    null,
  );

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [url, setUrl] = useState("");

  // ------------------------------------------------------
  // Load workspaces
  // ------------------------------------------------------

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkspaces();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  async function loadWorkspaces() {
    setIsLoadingWorkspaces(true);
    setError(null);

    try {
      const result = await getWorkspaces();

      setWorkspaces(result);

      if (result.length > 0) {
        setSelectedWorkspaceId((current) => {
          if (
            current !== null &&
            result.some(
              (workspace) => workspace.id === current,
            )
          ) {
            return current;
          }

          return result[0].id;
        });
      } else {
        setSelectedWorkspaceId(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load workspaces.",
      );
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }

  // ------------------------------------------------------
  // Load documents
  // ------------------------------------------------------
  useEffect(() => {
    if (selectedWorkspaceId === null) {
    return;
  }

    const timer = window.setTimeout(() => {
    void loadDocuments(selectedWorkspaceId);
  }, 0);

    return () => {
        window.clearTimeout(timer);
  };
}, [selectedWorkspaceId]);

  async function loadDocuments(workspaceId: number) {
    setIsLoadingDocuments(true);
    setError(null);

    try {
      const result = await getDocuments(workspaceId);

      setDocuments(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load documents.",
      );
      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  }

  // ------------------------------------------------------
  // Workspace change
  // ------------------------------------------------------

  function handleWorkspaceChange(
    event: ChangeEvent<HTMLSelectElement>,
  ) {
    const workspaceId = Number(event.target.value);

    setSelectedWorkspaceId(workspaceId);
    setSuccessMessage(null);
    setError(null);
  }

  // ------------------------------------------------------
  // File upload
  // ------------------------------------------------------

  async function handleFileUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    if (selectedWorkspaceId === null) {
      setError("Please select a workspace first.");
      return;
    }

    setIsUploadingFiles(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const fileList = Array.from(files);

      const result = await uploadDocuments(
        selectedWorkspaceId,
        fileList,
      );

      setSuccessMessage(result.message);

      await loadDocuments(selectedWorkspaceId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload documents.",
      );
    } finally {
      setIsUploadingFiles(false);

      event.target.value = "";
    }
  }

  // ------------------------------------------------------
  // URL upload
  // ------------------------------------------------------

  async function handleUrlUpload() {
    if (selectedWorkspaceId === null) {
      setError("Please select a workspace first.");
      return;
    }

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError("Please enter a URL.");
      return;
    }

    setIsIndexingUrl(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await uploadUrl(
        selectedWorkspaceId,
        trimmedUrl,
      );

      setSuccessMessage(result.message);
      setUrl("");

      await loadDocuments(selectedWorkspaceId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to index the URL.",
      );
    } finally {
      setIsIndexingUrl(false);
    }
  }

  // ------------------------------------------------------
  // Delete document
  // ------------------------------------------------------

  async function handleDeleteDocument(
    documentId: number,
  ) {
    if (selectedWorkspaceId === null) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this document?",
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      await deleteDocument(
        selectedWorkspaceId,
        documentId,
      );

      setSuccessMessage(
        "Document deleted successfully.",
      );

      await loadDocuments(selectedWorkspaceId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete the document.",
      );
    }
  }

  // ------------------------------------------------------
  // Helpers
  // ------------------------------------------------------

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  function getSourceLabel(document: Document) {
    if (document.original_filename) {
      return document.original_filename;
    }

    if (document.source_url) {
      return document.source_url;
    }

    return document.name;
  }
 
  function handleAskQuestions(document: Document) {
  if (selectedWorkspaceId === null) {
    setError("Please select a workspace first.");
    return;
  }

  router.push(
    `/chat?workspace_id=${selectedWorkspaceId}&document_id=${document.id}`,
  );
}

  // ------------------------------------------------------
  // Render
  // ------------------------------------------------------

  return (
    <div className="min-h-full bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}

        <section>
          <p className="text-sm font-medium text-slate-500">
            Knowledge sources
          </p>

          <div className="mt-1 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Documents
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Upload documents and web sources to build
                the knowledge base for your workspace.
              </p>
            </div>
          </div>
        </section>

        {/* Workspace selector */}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Select workspace
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Documents are isolated by workspace.
              </p>
            </div>

            <div className="w-full md:w-80">
              {isLoadingWorkspaces ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Loading workspaces...
                </div>
              ) : workspaces.length === 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  No workspaces available.
                </div>
              ) : (
                <select
                  value={
                    selectedWorkspaceId ?? ""
                  }
                  onChange={handleWorkspaceChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  {workspaces.map((workspace) => (
                    <option
                      key={workspace.id}
                      value={workspace.id}
                    >
                      {workspace.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </section>

        {/* Messages */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* Upload section */}

        <section className="grid gap-5 lg:grid-cols-2">
          {/* File upload */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Upload documents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add one or more supported files to the
                selected workspace.
              </p>
            </div>

            <label
              htmlFor="document-upload"
              className={[
                "mt-5 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center transition",
                isUploadingFiles
                  ? "cursor-not-allowed opacity-60"
                  : "hover:border-slate-400 hover:bg-slate-100",
              ].join(" ")}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg shadow-sm">
                ↑
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-800">
                {isUploadingFiles
                  ? "Uploading..."
                  : "Choose files"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                PDF, DOCX, PPTX, XLSX, CSV, TXT, MD and
                supported image files
              </p>

              <input
                id="document-upload"
                type="file"
                multiple
                disabled={
                  isUploadingFiles ||
                  selectedWorkspaceId === null
                }
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* URL upload */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Add a website URL or YouTube link
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add a website URL or YouTube link to make its content searchable.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <input
                type="url"
                value={url}
                onChange={(event) =>
                  setUrl(event.target.value)
                }
                placeholder="https://example.com"
                disabled={
                  isIndexingUrl ||
                  selectedWorkspaceId === null
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50"
              />

              <button
                type="button"
                onClick={handleUrlUpload}
                disabled={
                  isIndexingUrl ||
                  selectedWorkspaceId === null ||
                  !url.trim()
                }
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isIndexingUrl
                  ? "Indexing..."
                  : "Add web source"}
              </button>
            </div>
          </div>
        </section>

        {/* Documents list */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Your documents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {documents.length}{" "}
                {documents.length === 1
                  ? "document"
                  : "documents"}{" "}
                in this workspace
              </p>
            </div>
          </div>

          {isLoadingDocuments ? (
            <div className="flex min-h-48 items-center justify-center px-6">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

                <p className="text-sm text-slate-500">
                  Loading documents...
                </p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                □
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                No documents yet
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Upload a document or add a web source to
                start building your workspace knowledge base.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
                      {document.source_type
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-slate-900">
                        {document.name}
                      </h3>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {getSourceLabel(document)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>
                          {document.source_type}
                        </span>

                        <span>•</span>

                        <span>
                          Added{" "}
                          {formatDate(
                            document.created_at,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() =>
                        handleAskQuestions(document)
                      }
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Ask Questions
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                          handleDeleteDocument(
                            document.id,
                        )
                      }
                      className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}