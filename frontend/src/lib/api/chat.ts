import { apiRequest } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/token";

export interface ChatRequest {
  question: string;
  session_id?: number | null;
}

export interface ChatResponse {
  answer: string;
  session_id: number;
}

export interface ChatSession {
  id: number;
  workspace_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  session_id: number;
  role: string;
  content: string;
  created_at: string;
}

export async function sendMessage(
  workspaceId: number,
  question: string,
  sessionId?: number | null,
  documentId?: number | null,
): Promise<ChatResponse> {
  const token = getAccessToken();

  const params = new URLSearchParams({
    workspace_id: String(workspaceId),
  });

  if (documentId !== undefined && documentId !== null) {
    params.set("document_id", String(documentId));
  }

  return apiRequest<ChatResponse>(
    `/chat?${params.toString()}`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        question,
        session_id: sessionId ?? null,
      }),
    },
  );
}

export async function getChatSessions(
  workspaceId: number,
): Promise<ChatSession[]> {
  const token = getAccessToken();

  return apiRequest<ChatSession[]>(
    `/chat/sessions?workspace_id=${workspaceId}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function getChatMessages(
  workspaceId: number,
  sessionId: number,
): Promise<ChatMessage[]> {
  const token = getAccessToken();

  return apiRequest<ChatMessage[]>(
    `/chat/sessions/${sessionId}?workspace_id=${workspaceId}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function renameChatSession(
  workspaceId: number,
  sessionId: number,
  title: string,
): Promise<ChatSession> {
  const token = getAccessToken();

  return apiRequest<ChatSession>(
    `/chat/sessions/${sessionId}?workspace_id=${workspaceId}`,
    {
      method: "PUT",
      token,
      body: JSON.stringify({
        title,
      }),
    },
  );
}

export async function deleteChatSession(
  workspaceId: number,
  sessionId: number,
): Promise<void> {
  const token = getAccessToken();

  await apiRequest<void>(
    `/chat/sessions/${sessionId}?workspace_id=${workspaceId}`,
    {
      method: "DELETE",
      token,
    },
  );
}