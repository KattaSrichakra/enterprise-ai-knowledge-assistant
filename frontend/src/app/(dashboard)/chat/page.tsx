"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Suspense } from "react";

import { ChatInterface } from "@/components/chat/chat-interface";
import { NewChatStarter } from "@/components/chat/new-chat-starter";
import { getDocument } from "@/lib/api/documents";
import {
  createWorkspace,
  getWorkspaces,
  type Workspace,
} from "@/lib/api/workspaces";
import { ApiError } from "@/lib/api/client";

function getNextWorkspaceName(
  workspaces: Workspace[],
): string {
  const usedNumbers = new Set<number>();

  for (const workspace of workspaces) {
    const match = workspace.name.match(
      /^Untitled Workspace (\d+)$/,
    );

    if (match) {
      usedNumbers.add(Number(match[1]));
    }
  }

  let number = 1;

  while (usedNumbers.has(number)) {
    number += 1;
  }

  return `Untitled Workspace ${number}`;
}

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const workspaceIdParam =
    searchParams.get("workspace_id");

  const documentIdParam =
    searchParams.get("document_id");

  const sessionIdParam =
    searchParams.get("session_id");

  const isNewConversation =
    searchParams.get("new") === "1";

  const workspaceId = workspaceIdParam
    ? Number(workspaceIdParam)
    : null;

  const documentId = documentIdParam
    ? Number(documentIdParam)
    : null;

  const sessionId = sessionIdParam
    ? Number(sessionIdParam)
    : null;

  const [workspaces, setWorkspaces] = useState<
    Workspace[]
  >([]);

  const [documentName, setDocumentName] =
    useState<string | null>(null);

  const [isLoadingWorkspaces, setIsLoadingWorkspaces] =
    useState(true);

  const [isLoadingDocument, setIsLoadingDocument] =
    useState(false);

  const [workspaceError, setWorkspaceError] =
    useState<string | null>(null);

  const [isCreatingWorkspace, setIsCreatingWorkspace] =
    useState(false);

  const creationStartedRef = useRef(false);

  /*
   * NEW CONVERSATION FLOW
   *
   * When Dashboard sends:
   *
   * /chat?new=1
   *
   * there is no workspace_id yet.
   *
   * Create an Untitled Workspace automatically,
   * then put its ID into the URL.
   *
   * This allows NewChatStarter to handle the
   * document / website / YouTube upload.
   */
  useEffect(() => {
  if (
    !isNewConversation ||
    workspaceId !== null ||
    creationStartedRef.current
  ) {
    return;
  }

  creationStartedRef.current = true;

  async function createNewWorkspace() {
    setIsCreatingWorkspace(true);
    setWorkspaceError(null);

    try {
      const existingWorkspaces = await getWorkspaces();

      const workspaceName =
        getNextWorkspaceName(existingWorkspaces);

      const workspace = await createWorkspace({
        name: workspaceName,
        description:
          "Workspace created for a new conversation.",
      });

      router.replace(
        `/chat?workspace_id=${workspace.id}&new=1`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setWorkspaceError(err.message);
      } else {
        setWorkspaceError(
          "Unable to create a new workspace. Please try again.",
        );
      }

      setIsCreatingWorkspace(false);
      creationStartedRef.current = false;
    }
  }

  void createNewWorkspace();
}, [
  isNewConversation,
  workspaceId,
  router,
]);
  /*
   * EXISTING WORKSPACE FLOW
   *
   * This is used when the user intentionally opens
   * Chat from the left sidebar and chooses a workspace.
   *
   * It is NOT used for the new-conversation flow.
   */
  useEffect(() => {
    if (isNewConversation) {
      return;
    }

    let cancelled = false;

    async function loadWorkspaces() {
      try {
        const data = await getWorkspaces();

        if (!cancelled) {
          setWorkspaces(data);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setWorkspaceError(err.message);
          } else {
            setWorkspaceError(
              "Unable to load your workspaces. Please try again.",
            );
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoadingWorkspaces(false);
        }
      }
    }

    void loadWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [isNewConversation]);

  /*
   * LOAD DOCUMENT NAME
   *
   * Used when opening an existing document conversation.
   */
  useEffect(() => {
    if (
      workspaceId === null ||
      documentId === null ||
      !Number.isInteger(workspaceId) ||
      !Number.isInteger(documentId) ||
      workspaceId <= 0 ||
      documentId <= 0
    ) {
      return;
    }

    const validWorkspaceId = workspaceId;
    const validDocumentId = documentId;

    let cancelled = false;

    async function loadDocument() {
      setIsLoadingDocument(true);

      try {
        const document = await getDocument(
          validWorkspaceId,
          validDocumentId,
        );

        if (!cancelled) {
          setDocumentName(document.name);
        }
      } catch {
        if (!cancelled) {
          setDocumentName(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDocument(false);
        }
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, documentId]);

  function handleWorkspaceChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const selectedWorkspaceId = Number(
      event.target.value,
    );

    if (
      !Number.isInteger(selectedWorkspaceId) ||
      selectedWorkspaceId <= 0
    ) {
      return;
    }

    router.push(
      `/chat?workspace_id=${selectedWorkspaceId}`,
    );
  }

  /*
   * NEW CONVERSATION:
   *
   * If there is no workspace ID yet, show a short
   * loading screen while the automatic workspace
   * is being created.
   */
  if (
    isNewConversation &&
    (
      workspaceId === null ||
      !Number.isInteger(workspaceId) ||
      workspaceId <= 0
    )
  ) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
        <div className="text-center">
          {isCreatingWorkspace ? (
            <>
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

              <p className="mt-4 text-sm font-medium text-slate-700">
                Preparing your new workspace...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Just a moment.
              </p>
            </>
          ) : workspaceError ? (
            <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6">
              <h1 className="text-lg font-semibold text-red-900">
                Unable to start a new conversation
              </h1>

              <p className="mt-2 text-sm leading-6 text-red-700">
                {workspaceError}
              </p>

              <button
                type="button"
                onClick={() => {
                  creationStartedRef.current = false;
                  setWorkspaceError(null);
                  setIsCreatingWorkspace(true);
                }}
                className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

              <p className="mt-4 text-sm font-medium text-slate-700">
                Starting a new conversation...
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  /*
   * NEW CONVERSATION:
   *
   * Once the automatic workspace has been created,
   * show the upload / URL / YouTube starter screen.
   */
  if (isNewConversation) {
    return (
      <NewChatStarter
        workspaceId={workspaceId as number}
      />
    );
  }

  /*
   * NORMAL CHAT FLOW:
   *
   * If the user enters Chat from the sidebar without
   * selecting a workspace, show the workspace selector.
   */
  if (
    workspaceId === null ||
    !Number.isInteger(workspaceId) ||
    workspaceId <= 0
  ) {
    return (
      <div className="min-h-full bg-slate-50 p-6 sm:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-indigo-600">
              Knowledge Assistant
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              Select a workspace
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choose a workspace before starting a
              conversation.
            </p>

            {isLoadingWorkspaces ? (
              <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                Loading workspaces...
              </div>
            ) : workspaceError ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {workspaceError}
              </div>
            ) : workspaces.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6">
                <h2 className="font-semibold text-slate-900">
                  No workspaces found
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Create a workspace first, then come back
                  here to start chatting.
                </p>
              </div>
            ) : (
              <div className="mt-6">
                <label
                  htmlFor="chat-workspace"
                  className="text-sm font-semibold text-slate-800"
                >
                  Workspace
                </label>

                <select
                  id="chat-workspace"
                  defaultValue=""
                  onChange={handleWorkspaceChange}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="" disabled>
                    Select a workspace
                  </option>

                  {workspaces.map((workspace) => (
                    <option
                      key={workspace.id}
                      value={workspace.id}
                    >
                      {workspace.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /*
   * INVALID DOCUMENT
   */
  if (
    documentIdParam !== null &&
    (
      documentId === null ||
      !Number.isInteger(documentId) ||
      documentId <= 0
    )
  ) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-red-900">
            Invalid document
          </h1>

          <p className="mt-2 text-sm leading-6 text-red-700">
            The selected document could not be identified.
          </p>
        </div>
      </div>
    );
  }

  /*
   * INVALID CONVERSATION
   */
  if (
    sessionIdParam !== null &&
    (
      sessionId === null ||
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    )
  ) {
    return (
      <div className="flex min-h-full items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-lg font-semibold text-red-900">
            Invalid conversation
          </h1>

          <p className="mt-2 text-sm leading-6 text-red-700">
            The selected conversation could not be identified.
          </p>
        </div>
      </div>
    );
  }

  /*
   * EXISTING CONVERSATION
   */
  return (
    <ChatInterface
      workspaceId={workspaceId}
      documentId={documentId}
      documentName={
        isLoadingDocument
          ? "Loading document..."
          : documentName
      }
      initialSessionId={sessionId}
    />
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-slate-50">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
            Loading chat...
          </div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}