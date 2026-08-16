export interface Document {
  id: number;
  workspace_id: number;
  name: string;
  source_type: string;
  original_filename: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

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

export interface UploadResponse {
  message: string;
  documents_indexed: number;
  chunks_indexed: number;
}