"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import {
  getDocuments,
  uploadDocuments,
  uploadUrl,
  type Document,
} from "@/lib/api/documents";

interface NewChatStarterProps {
  workspaceId: number;
}

export function NewChatStarter({
  workspaceId,
}: NewChatStarterProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function openFilePicker() {
    if (isUploading) {
      return;
    }

    fileInputRef.current?.click();
  }

  async function findUploadedDocument(
    matcher: (document: Document) => boolean,
  ): Promise<Document | null> {
    const documents = await getDocuments(workspaceId);

    const matches = documents
      .filter(matcher)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      );

    return matches[0] ?? null;
  }

  async function processFile(file: File) {
    if (isUploading) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadDocuments(workspaceId, [file]);

      const document = await findUploadedDocument(
        (item) =>
          item.original_filename === file.name ||
          item.name === file.name,
      );

      if (!document) {
        throw new Error(
          "The document was uploaded, but it could not be opened.",
        );
      }

      router.replace(
        `/chat?workspace_id=${workspaceId}&document_id=${document.id}`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to add the document. Please try again.",
        );
      }

      setIsUploading(false);
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (file) {
      void processFile(file);
    }

    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (!isUploading) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (isUploading) {
      return;
    }

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void processFile(file);
    }
  }

  async function handleUrlSubmit() {
    const trimmedUrl = url.trim();

    if (!trimmedUrl || isUploading) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await uploadUrl(workspaceId, trimmedUrl);

      const document = await findUploadedDocument(
        (item) => item.source_url === trimmedUrl,
      );

      if (!document) {
        throw new Error(
          "The link was added, but it could not be opened.",
        );
      }

      router.replace(
        `/chat?workspace_id=${workspaceId}&document_id=${document.id}`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unable to add the link. Please try again.",
        );
      }

      setIsUploading(false);
    }
  }

  function handleUrlKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleUrlSubmit();
    }
  }

  return (
    <section className="flex h-full min-h-0 items-center justify-center overflow-hidden bg-slate-50 px-5 py-6">
      <div className="w-full max-w-3xl">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.04] sm:p-10">
          {/* Heading */}

          <div className="mx-auto max-w-xl text-center">

            <h1 className="mt-0 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Start a new conversation
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Add a file, website, or YouTube video and
              start asking questions.
            </p>
          </div>

          {/* File area */}

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={[
              "mt-8 rounded-2xl border-2 border-dashed p-8 text-center transition-all sm:p-10",
              isDragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 bg-slate-50/80 hover:border-indigo-300 hover:bg-indigo-50/40",
              isUploading
                ? "pointer-events-none opacity-60"
                : "",
            ].join(" ")}
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16V4m0 0L8 8m4-4 4 4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
                />
              </svg>
            </div>

            <h2 className="mt-4 text-sm font-semibold text-slate-900 sm:text-base">
              {isUploading
                ? "Adding your content..."
                : "Drag & drop a file here"}
            </h2>

            {!isUploading && (
              <>
                <p className="mt-1 text-sm text-slate-500">
                  or
                </p>

                <button
                  type="button"
                  onClick={openFilePicker}
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  Choose file
                </button>

                <p className="mt-4 text-xs text-slate-400">
                  PDF · DOCX · PPTX · CSV · TXT · MD ·
                  Images and more
                </p>
              </>
            )}

            {isUploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-indigo-600">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                Processing...
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
          </div>

          {/* Divider */}

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />

            <span className="text-xs font-medium text-slate-400">
              or
            </span>

            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* URL */}

          <div>
            <label
              htmlFor="new-chat-url"
              className="sr-only"
            >
              Website or YouTube link
            </label>

            <div
  className={[
    "flex items-center gap-3 rounded-2xl border-2 bg-white p-2.5 shadow-md transition-all",
    url
      ? "border-indigo-400 ring-4 ring-indigo-50"
      : "border-slate-300 hover:border-indigo-300 hover:shadow-lg",
  ].join(" ")}
>
  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 11a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 7 20l1.15-1.15"
      />
    </svg>
  </div>

  <input
    id="new-chat-url"
    type="url"
    value={url}
    onChange={(event) =>
      setUrl(event.target.value)
    }
    onKeyDown={handleUrlKeyDown}
    disabled={isUploading}
    placeholder="Paste a website or YouTube link here..."
    className="min-w-0 flex-1 bg-transparent px-1 py-3 text-[15px] font-medium text-slate-900 outline-none placeholder:text-slate-500"
  />

  <button
    type="button"
    onClick={() => void handleUrlSubmit()}
    disabled={
      isUploading || !url.trim()
    }
    aria-label="Add link"
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-lg font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
  >
    →
  </button>
</div>

            <p className="mt-2 px-1 text-xs font-medium text-slate-500">
              Website pages and YouTube videos are supported.
            </p>
          </div>

          {/* Error */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
              {error}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Your content will be added to this new workspace.
        </p>
      </div>
    </section>
  );
}