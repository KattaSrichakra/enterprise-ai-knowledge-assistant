"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import {
  deleteChatSession,
  getChatMessages,
  getChatSessions,
  renameChatSession,
  sendMessage,
  type ChatMessage,
} from "@/lib/api/chat";

interface ChatInterfaceProps {
  workspaceId: number;
  documentId?: number | null;
  documentName?: string | null;
  initialSessionId?: number | null;
}

function buildConversationTitle(
  question: string,
): string {
  const normalized = question
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "New Conversation";
  }

  if (normalized.length <= 70) {
    return normalized;
  }

  return `${normalized.slice(0, 67).trim()}...`;
}

export function ChatInterface({
  workspaceId,
  documentId = null,
  documentName = null,
  initialSessionId = null,
}: ChatInterfaceProps) {
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>(
    [],
  );

  const [sessionId, setSessionId] =
    useState<number | null>(initialSessionId);

  const [conversationTitle, setConversationTitle] =
    useState("New Conversation");

  const [question, setQuestion] = useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [isLoadingHistory, setIsLoadingHistory] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const loadConversation = useCallback(
    async (existingSessionId: number) => {
      setIsLoadingHistory(true);
      setError(null);

      try {
        const [messageResult, sessionResult] =
          await Promise.all([
            getChatMessages(
              workspaceId,
              existingSessionId,
            ),
            getChatSessions(workspaceId),
          ]);

        setMessages(messageResult);

        const currentSession =
          sessionResult.find(
            (session) =>
              session.id === existingSessionId,
          );

        if (currentSession) {
          let title =
            currentSession.title ||
            "New Conversation";

          /*
           * Older conversations may still have
           * "New Conversation" as their title.
           *
           * If messages already exist, use the
           * first user question as the title.
           */
          if (
            title === "New Conversation"
          ) {
            const firstUserMessage =
              messageResult.find(
                (message) =>
                  message.role === "user",
              );

            if (firstUserMessage) {
              const generatedTitle =
                buildConversationTitle(
                  firstUserMessage.content,
                );

              title = generatedTitle;

              try {
                await renameChatSession(
                  workspaceId,
                  existingSessionId,
                  generatedTitle,
                );
              } catch {
                // Keep the local title even if
                // persistence fails.
              }
            }
          }

          setConversationTitle(title);
        }
      } catch {
        setError(
          "Unable to load this conversation. Please try again.",
        );
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [workspaceId],
  );

  useEffect(() => {
    if (initialSessionId === null) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadConversation(
        initialSessionId,
      );
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    initialSessionId,
    loadConversation,
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedQuestion =
      question.trim();

    if (
      !trimmedQuestion ||
      isLoading
    ) {
      return;
    }

    setError(null);
    setIsLoading(true);

    /*
     * Remember whether this was the first
     * question before sendMessage changes
     * the session ID.
     */
    const isFirstQuestion =
      sessionId === null;

    const generatedTitle =
      buildConversationTitle(
        trimmedQuestion,
      );

    const temporaryUserMessage: ChatMessage = {
      id: Date.now(),
      session_id: sessionId ?? 0,
      role: "user",
      content: trimmedQuestion,
      created_at: new Date().toISOString(),
    };

    setMessages((current) => [
      ...current,
      temporaryUserMessage,
    ]);

    setQuestion("");

    /*
     * Show the title immediately while the
     * backend is processing the question.
     */
    if (isFirstQuestion) {
      setConversationTitle(
        generatedTitle,
      );
    }

    try {
      const response =
        await sendMessage(
          workspaceId,
          trimmedQuestion,
          sessionId,
          documentId,
        );

      /*
       * The backend returns the real session ID.
       */
      setSessionId(
        response.session_id,
      );

      /*
       * IMPORTANT:
       * Persist the first question as the
       * conversation title.
       *
       * This uses the same rename API that
       * already works from the dashboard.
       */
      if (isFirstQuestion) {
        try {
          await renameChatSession(
            workspaceId,
            response.session_id,
            generatedTitle,
          );
        } catch {
          /*
           * The title is already visible locally.
           * If persistence fails, don't break the
           * successful chat response.
           */
        }

        setConversationTitle(
          generatedTitle,
        );
      }

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        session_id:
          response.session_id,
        role: "assistant",
        content: response.answer,
        created_at:
          new Date().toISOString(),
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (err) {
      setMessages((current) =>
        current.filter(
          (message) =>
            message.id !==
            temporaryUserMessage.id,
        ),
      );

      setQuestion(trimmedQuestion);

      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof err.message === "string"
      ) {
        setError(err.message);
      } else {
        setError(
          "Unable to get an answer. Please try again.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeleteConversation() {
    if (
      sessionId === null ||
      isDeleting
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete this conversation? This action cannot be undone.",
      );

    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);

      await deleteChatSession(
        workspaceId,
        sessionId,
      );

      router.push("/chat");
    } catch (err) {
      if (
        err &&
        typeof err === "object" &&
        "message" in err &&
        typeof err.message === "string"
      ) {
        setError(err.message);
      } else {
        setError(
          "Unable to delete this conversation. Please try again.",
        );
      }

      setIsDeleting(false);
    }
  }

  const hasMessages =
    messages.length > 0;

  return (
    <div className="flex h-full min-h-0 flex-col bg-slate-50">

      {/* Header */}

      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-5 sm:px-6">

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
              Conversation
            </p>

            <h1 className="truncate text-base font-semibold text-slate-950">
              {conversationTitle}
            </h1>
          </div>

          {sessionId !== null && (
            <button
              type="button"
              onClick={() =>
                void handleDeleteConversation()
              }
              disabled={isDeleting}
              className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting
                ? "Deleting..."
                : "Delete"}
            </button>
          )}

        </div>
      </header>

      {/* Messages */}

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col px-5 py-6 sm:px-6">

          {!hasMessages &&
          !isLoadingHistory ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-2xl text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-700 text-lg font-bold text-white shadow-lg shadow-indigo-950/10">
                  AI
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
                  Start asking questions
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                  Ask anything about your selected
                  document and get answers based on
                  its contents.
                </p>

                {documentName && (
                  <div className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 shadow-sm">

                    <span className="text-indigo-600">
                      ◆
                    </span>

                    <span className="truncate font-medium">
                      {documentName}
                    </span>

                  </div>
                )}

              </div>
            </div>
          ) : isLoadingHistory ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">

                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                Loading conversation...

              </div>
            </div>
          ) : (
            <div className="space-y-5 pb-4">

              {messages.map(
                (message) => {
                  const isUser =
                    message.role ===
                    "user";

                  return (
                    <div
                      key={message.id}
                      className={[
                        "flex",
                        isUser
                          ? "justify-end"
                          : "justify-start",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[75%]",
                          isUser
                            ? "rounded-br-md bg-slate-950 text-white"
                            : "rounded-bl-md border border-slate-200 bg-white text-slate-700",
                        ].join(" ")}
                      >

                        <div
                          className={[
                            "mb-1 text-[11px] font-semibold uppercase tracking-wider",
                            isUser
                              ? "text-slate-300"
                              : "text-indigo-600",
                          ].join(" ")}
                        >
                          {isUser
                            ? "You"
                            : "AI Assistant"}
                        </div>

                        <p className="whitespace-pre-wrap">
                          {message.content}
                        </p>

                      </div>
                    </div>
                  );
                },
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm">

                    <div className="flex items-center gap-2">

                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />

                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{
                          animationDelay:
                            "120ms",
                        }}
                      />

                      <span
                        className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                        style={{
                          animationDelay:
                            "240ms",
                        }}
                      />

                    </div>

                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* Error */}

      {error && (
        <div className="shrink-0 border-t border-red-100 bg-red-50 px-5 py-2.5">
          <div className="mx-auto max-w-5xl text-sm text-red-700">
            {error}
          </div>
        </div>
      )}

      {/* Input */}

      <footer className="shrink-0 border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-5 py-4 sm:px-6">

          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm transition focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50"
          >

            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value,
                )
              }
              disabled={isLoading}
              rows={1}
              placeholder="Ask a question about your document..."
              className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();

                  if (
                    question.trim()
                  ) {
                    event.currentTarget.form?.requestSubmit();
                  }
                }
              }}
            />

            <button
              type="submit"
              disabled={
                isLoading ||
                !question.trim()
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Send question"
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <span className="text-lg">
                  ↑
                </span>
              )}
            </button>

          </form>

          <p className="mt-2 text-center text-[11px] text-slate-400">
            Press Enter to send · Shift + Enter for a new line
          </p>

        </div>
      </footer>

    </div>
  );
}