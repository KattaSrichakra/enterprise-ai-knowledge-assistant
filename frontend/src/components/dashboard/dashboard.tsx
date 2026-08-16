"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  getDocuments,
  type Document,
} from "@/lib/api/documents";
import {
  getChatSessions,
  renameChatSession,
  type ChatSession,
} from "@/lib/api/chat";
import {
  getWorkspaces,
  type Workspace,
} from "@/lib/api/workspaces";
import { ApiError } from "@/lib/api/client";

function SparkleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M12 2.8l1.65 5.55L19.2 10l-5.55 1.65L12 17.2l-1.65-5.55L4.8 10l5.55-1.65L12 2.8Z"
        fill="currentColor"
      />
      <path
        d="M19.2 15.2l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        d="M4 10h11M11 6l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M7 3.5h7l4 4v13H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M14 3.5v4h4M8.5 12h7M8.5 15.5h7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M3.8 12h16.4M12 3.5c2.3 2.35 3.4 5.2 3.4 8.5S14.3 18.15 12 20.5C9.7 18.15 8.6 15.3 8.6 12S9.7 5.85 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="3"
        fill="currentColor"
      />
      <path
        d="m10 9 5 3-5 3V9Z"
        fill="white"
      />
    </svg>
  );
}

function ConversationIcon() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
      <SparkleIcon />
    </div>
  );
}

function DocumentBadge({
  sourceType,
}: {
  sourceType: string;
}) {
  const type = sourceType.toLowerCase();

  if (type === "youtube") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
        <YoutubeIcon />
      </div>
    );
  }

  if (type === "url") {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
        <GlobeIcon />
      </div>
    );
  }

  if (type.includes("image")) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
        <FileIcon />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
      <FileIcon />
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function Dashboard() {
  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [renamingSessionId, setRenamingSessionId] =
    useState<number | null>(null);

  const [renameValue, setRenameValue] =
    useState("");

  const [isSavingRename, setIsSavingRename] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const workspaceData = await getWorkspaces();

        if (cancelled) {
          return;
        }

        setWorkspaces(workspaceData);

        if (workspaceData.length === 0) {
          setDocuments([]);
          setSessions([]);
          return;
        }

        const results = await Promise.all(
          workspaceData.map(async (workspace) => {
            const [
              workspaceDocuments,
              workspaceSessions,
            ] = await Promise.all([
              getDocuments(workspace.id),
              getChatSessions(workspace.id),
            ]);

            return {
              documents: workspaceDocuments,
              sessions: workspaceSessions,
            };
          }),
        );

        if (cancelled) {
          return;
        }

        setDocuments(
          results
            .flatMap(
              (result) => result.documents,
            )
            .sort(
              (a, b) =>
                new Date(
                  b.updated_at,
                ).getTime() -
                new Date(
                  a.updated_at,
                ).getTime(),
            ),
        );

        setSessions(
          results
            .flatMap(
              (result) => result.sessions,
            )
            .sort(
              (a, b) =>
                new Date(
                  b.updated_at,
                ).getTime() -
                new Date(
                  a.updated_at,
                ).getTime(),
            ),
        );
      } catch (error) {
        if (
          !cancelled &&
          error instanceof ApiError
        ) {
          setDocuments([]);
          setSessions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const workspaceNames = useMemo(() => {
    return new Map(
      workspaces.map((workspace) => [
        workspace.id,
        workspace.name,
      ]),
    );
  }, [workspaces]);

  const recentDocuments = documents.slice(0, 8);
  const recentSessions = sessions.slice(0, 8);

  function startRenamingSession(
    session: ChatSession,
  ) {
    setRenamingSessionId(session.id);
    setRenameValue(session.title);
  }

  function cancelRenamingSession() {
    setRenamingSessionId(null);
    setRenameValue("");
  }

  async function handleRenameSession(
    session: ChatSession,
  ) {
    const trimmedTitle =
      renameValue.trim();

    if (!trimmedTitle || isSavingRename) {
      return;
    }

    try {
      setIsSavingRename(true);

      const updatedSession =
        await renameChatSession(
          session.workspace_id,
          session.id,
          trimmedTitle,
        );

      setSessions(
        (currentSessions) =>
          currentSessions.map(
            (currentSession) =>
              currentSession.id ===
              updatedSession.id
                ? updatedSession
                : currentSession,
          ),
      );

      cancelRenamingSession();
    } catch (error) {
      console.error(
        "Unable to rename conversation:",
        error,
      );
    } finally {
      setIsSavingRename(false);
    }
  }

  return (
    <div className="h-full overflow-hidden bg-[#f8f9fd]">
      <div className="mx-auto flex h-full w-full max-w-[1440px] flex-col px-6 py-6 sm:px-8 lg:px-9">

        {/* Main hero */}

        <section className="relative h-[270px] shrink-0 overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-white via-[#fbfaff] to-[#f8f0ff] px-9 py-8 shadow-[0_18px_50px_rgba(79,70,229,0.08)] sm:px-10 sm:py-9">

          {/* Decorative background */}

          <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-indigo-100 bg-indigo-50/30" />

          <div className="pointer-events-none absolute right-28 top-16 h-2 w-2 rounded-full bg-violet-200" />

          <div className="pointer-events-none absolute right-44 top-28 h-1.5 w-1.5 rounded-full bg-indigo-200" />

          <div className="pointer-events-none absolute bottom-12 right-20 h-3 w-3 rounded-full bg-violet-100" />

          <div className="pointer-events-none absolute right-[31%] top-14 h-1.5 w-1.5 rounded-full bg-slate-200" />

          <div className="relative max-w-2xl">
            <h2 className="text-[42px] font-bold leading-[1.05] tracking-[-0.045em] text-slate-950 sm:text-[46px]">
              Ask{" "}
              <span className="text-indigo-600">
                anything.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-[17px] leading-7 text-slate-600">
              Add a file, website, or YouTube video and
              start asking questions.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/chat?new=1"
                className="inline-flex h-12 items-center gap-3 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-900"
              >
                Start a conversation
                <ArrowIcon />
              </Link>

              <Link
                href="/documents"
                className="inline-flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-600"
              >
                Add to an existing workspace
                <ArrowIcon />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] font-medium text-slate-500">
              <span className="flex items-center gap-2">
                <span className="font-bold text-red-500">
                  PDF
                </span>
              </span>

              <span className="flex items-center gap-2">
                <span className="font-bold text-blue-600">
                  DOCX
                </span>
              </span>

              <span className="flex items-center gap-2">
                <span className="font-bold text-orange-500">
                  PPTX
                </span>
              </span>

              <span className="flex items-center gap-2">
                <span className="font-bold text-emerald-600">
                  CSV
                </span>
              </span>

              <span>TXT</span>

              <span className="flex items-center gap-2">
                <span className="font-bold text-sky-500">
                  Images
                </span>
              </span>

              <span className="flex items-center gap-2">
                <GlobeIcon />
                Websites
              </span>

              <span className="flex items-center gap-2">
                <YoutubeIcon />
                YouTube
              </span>
            </div>
          </div>
        </section>

        {/* Recent */}

        <section className="mt-5 flex min-h-0 flex-1 flex-col">
          <div className="mb-3">
            <h2 className="text-xl font-bold tracking-tight text-slate-950">
              Recent
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pick up where you left off.
            </p>
          </div>

          <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-2">

            {/* Recent documents */}

            <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">

              <div className="relative flex h-[66px] items-center border-b border-slate-100 px-5">
                <div className="w-full text-center">
                  <h3 className="text-base font-bold tracking-tight text-slate-950">
                    Recent documents
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Your latest additions
                  </p>
                </div>

                <Link
                  href="/documents"
                  className="absolute right-5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  View all →
                </Link>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-3 p-5">
                    {[1, 2, 3].map(
                      (item) => (
                        <div
                          key={item}
                          className="h-12 animate-pulse rounded-xl bg-slate-50"
                        />
                      ),
                    )}
                  </div>
                ) : recentDocuments.length === 0 ? (
                  <div className="flex min-h-[170px] items-center justify-center px-6 text-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        No documents yet
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Start a conversation to add your
                        first source.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentDocuments.map(
                      (document) => (
                        <Link
                          key={document.id}
                          href={`/chat?workspace_id=${document.workspace_id}&document_id=${document.id}`}
                          className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
                        >
                          <DocumentBadge
                            sourceType={
                              document.source_type
                            }
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {document.name}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              {workspaceNames.get(
                                document.workspace_id,
                              ) ??
                                "Workspace"}
                            </p>
                          </div>

                          <span className="shrink-0 text-xs text-slate-400">
                            {formatDate(
                              document.updated_at,
                            )}
                          </span>

                          <span className="text-slate-300">
                            →
                          </span>
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Recent conversations */}

            <section className="flex min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">

              <div className="relative flex h-[66px] items-center border-b border-slate-100 px-5">
                <div className="w-full text-center">
                  <h3 className="text-base font-bold tracking-tight text-slate-950">
                    Recent conversations
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Continue where you left off
                  </p>
                </div>

                <Link
                  href="/chat"
                  className="absolute right-5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
                >
                  View all →
                </Link>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {isLoading ? (
                  <div className="space-y-3 p-5">
                    {[1, 2, 3].map(
                      (item) => (
                        <div
                          key={item}
                          className="h-12 animate-pulse rounded-xl bg-slate-50"
                        />
                      ),
                    )}
                  </div>
                ) : recentSessions.length === 0 ? (
                  <div className="flex min-h-[170px] items-center justify-center px-6 text-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        No conversations yet
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Start a conversation to see it here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentSessions.map(
                      (session) => {
                        const isEditing =
                          renamingSessionId ===
                          session.id;

                        return (
                          <div
                            key={session.id}
                            className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                if (!isEditing) {
                                  router.push(
                                    `/chat?workspace_id=${session.workspace_id}&session_id=${session.id}`,
                                  );
                                }
                              }}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <ConversationIcon />

                              <div className="min-w-0 flex-1">
                                {isEditing ? (
                                  <input
                                    value={
                                      renameValue
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setRenameValue(
                                        event
                                          .target
                                          .value,
                                      )
                                    }
                                    onClick={(
                                      event,
                                    ) =>
                                      event.stopPropagation()
                                    }
                                    onKeyDown={(
                                      event,
                                    ) => {
                                      if (
                                        event.key ===
                                        "Enter"
                                      ) {
                                        event.preventDefault();

                                        void handleRenameSession(
                                          session,
                                        );
                                      }

                                      if (
                                        event.key ===
                                        "Escape"
                                      ) {
                                        cancelRenamingSession();
                                      }
                                    }}
                                    autoFocus
                                    maxLength={255}
                                    className="h-8 w-full rounded-lg border border-indigo-200 bg-white px-2.5 text-sm font-semibold text-slate-900 outline-none ring-2 ring-indigo-50 focus:border-indigo-400"
                                  />
                                ) : (
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {session.title ||
                                      "New Conversation"}
                                  </p>
                                )}

                                <p className="mt-0.5 truncate text-xs text-slate-400">
                                  {workspaceNames.get(
                                    session.workspace_id,
                                  ) ??
                                    "Workspace"}
                                </p>
                              </div>
                            </button>

                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className="text-xs text-slate-400">
                                {formatDate(
                                  session.updated_at,
                                )}
                              </span>

                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void handleRenameSession(
                                        session,
                                      );
                                    }}
                                    disabled={
                                      isSavingRename ||
                                      !renameValue.trim()
                                    }
                                    className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {isSavingRename
                                      ? "Saving..."
                                      : "Save"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      cancelRenamingSession
                                    }
                                    disabled={
                                      isSavingRename
                                    }
                                    className="text-xs font-medium text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    startRenamingSession(
                                      session,
                                    )
                                  }
                                  className="text-xs font-medium text-slate-400 transition hover:text-indigo-600"
                                >
                                  Rename
                                </button>
                              )}
                            </div>

                            {!isEditing && (
                              <span className="text-slate-300">
                                →
                              </span>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}