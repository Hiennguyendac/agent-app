-- Persist original file content for document intake and response attachments.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS content_base64 TEXT;

ALTER TABLE work_item_files
  ADD COLUMN IF NOT EXISTS content_base64 TEXT;
