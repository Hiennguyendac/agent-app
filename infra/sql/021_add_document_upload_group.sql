ALTER TABLE documents
ADD COLUMN IF NOT EXISTS upload_group_id TEXT;

CREATE INDEX IF NOT EXISTS documents_upload_group_id_idx
ON documents (upload_group_id);
