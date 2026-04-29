-- 导入历史记录表
CREATE TABLE IF NOT EXISTS import_history (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  sheet_name TEXT NOT NULL,
  column_mapping TEXT NOT NULL,
  field_types TEXT,
  data_summary TEXT,
  import_fingerprint TEXT,
  created_at TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id)
);

-- 按项目查询
CREATE INDEX IF NOT EXISTS idx_import_history_project ON import_history(project_id);
-- 按指纹查询（相同结构文件推荐）
CREATE INDEX IF NOT EXISTS idx_import_history_fingerprint ON import_history(import_fingerprint);
