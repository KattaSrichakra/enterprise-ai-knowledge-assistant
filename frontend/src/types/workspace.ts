export interface Workspace {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreateRequest {
  name: string;
  description?: string | null;
}

export interface WorkspaceUpdateRequest {
  name?: string | null;
  description?: string | null;
}