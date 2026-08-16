import { apiRequest } from "@/lib/api/client";
import { getAccessToken } from "@/lib/auth/token";

export interface DocumentVersion {
  id: number;
  document_id: number;
  version_number: number;
  storage_path: string | null;
  checksum_sha256: string | null;
  file_size: number | null;
  content_type: string | null;
  status: string;
  created_at: string;
}

export interface Document {
  id: number;
  workspace_id: number;
  name: string;
  source_type: string;
  original_filename: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
  versions?: DocumentVersion[];
}

export interface UploadResponse {
  message: string;
  documents_indexed: number;
  chunks_indexed: number;
}

export async function getDocuments(
  workspaceId: number,
): Promise<Document[]> {
  const token = getAccessToken();

  return apiRequest<Document[]>(
    `/documents?workspace_id=${workspaceId}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function getDocument(
  workspaceId: number,
  documentId: number,
): Promise<Document> {
  const token = getAccessToken();

  return apiRequest<Document>(
    `/documents/${documentId}?workspace_id=${workspaceId}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function getDocumentVersions(
  workspaceId: number,
  documentId: number,
): Promise<DocumentVersion[]> {
  const token = getAccessToken();

  return apiRequest<DocumentVersion[]>(
    `/documents/${documentId}/versions?workspace_id=${workspaceId}`,
    {
      method: "GET",
      token,
    },
  );
}

export async function uploadDocuments(
  workspaceId: number,
  files: File[],
): Promise<UploadResponse> {
  const token = getAccessToken();

  const formData = new FormData();

  for (const file of files) {
    formData.append("files", file);
  }

  return apiRequest<UploadResponse>(
    `/documents/upload?workspace_id=${workspaceId}`,
    {
      method: "POST",
      token,
      body: formData,
    },
  );
}

export async function uploadUrl(
  workspaceId: number,
  url: string,
): Promise<UploadResponse> {
  const token = getAccessToken();

  return apiRequest<UploadResponse>(
    `/documents/url?workspace_id=${workspaceId}`,
    {
      method: "POST",
      token,
      body: JSON.stringify({
        url,
      }),
    },
  );
}

export async function deleteDocument(
  workspaceId: number,
  documentId: number,
): Promise<void> {
  const token = getAccessToken();

  await apiRequest<void>(
    `/documents/${documentId}?workspace_id=${workspaceId}`,
    {
      method: "DELETE",
      token,
    },
  );
}
