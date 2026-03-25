-- School workflow Phase 4
--
-- Adds document-first intake before work item creation.

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  metadata_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  extracted_text TEXT,
  ocr_status TEXT NOT NULL DEFAULT 'ready',
  uploaded_by_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'documents_ocr_status_check'
  ) THEN
    ALTER TABLE documents
    ADD CONSTRAINT documents_ocr_status_check
    CHECK (ocr_status IN ('pending', 'ready', 'failed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS documents_uploaded_by_user_id_idx
  ON documents (uploaded_by_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS documents_created_work_item_id_idx
  ON documents (created_work_item_id);

CREATE TABLE IF NOT EXISTS document_analysis (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  raw_output TEXT NOT NULL,
  model TEXT,
  created_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_analysis_document_id_idx
  ON document_analysis (document_id, created_at DESC);
