import { apiRequest } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/token";

export interface Workspace {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string | null;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string | null;
}

export async function getWorkspaces(): Promise<Workspace[]> {
  const token = getAccessToken();

  return apiRequest<Workspace[]>("/workspaces", {
    method: "GET",
    token,
  });
}

export async function getWorkspace(
  workspaceId: number,
): Promise<Workspace> {
  const token = getAccessToken();

  return apiRequest<Workspace>(
    `/workspaces/${workspaceId}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function createWorkspace(
  data: CreateWorkspaceRequest,
): Promise<Workspace> {
  const token = getAccessToken();

  return apiRequest<Workspace>("/workspaces", {
    method: "POST",
    token,
    body: JSON.stringify(data),
  });
}

export async function updateWorkspace(
  workspaceId: number,
  data: UpdateWorkspaceRequest,
): Promise<Workspace> {
  const token = getAccessToken();

  return apiRequest<Workspace>(
    `/workspaces/${workspaceId}`,
    {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    },
  );
}

export async function deleteWorkspace(
  workspaceId: number,
): Promise<void> {
  const token = getAccessToken();

  await apiRequest<void>(
    `/workspaces/${workspaceId}`,
    {
      method: "DELETE",
      token,
    },
  );
}