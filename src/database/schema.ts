// SQLite 数据库初始化脚本

export const INIT_SQL = `
-- 项目表
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  storage_type TEXT DEFAULT 'sqlite',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 数据集表
CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  source_file TEXT,
  import_scheme_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  row_count INTEGER DEFAULT 0,
  schema_json TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 数据记录表（动态字段以JSON存储）
CREATE TABLE IF NOT EXISTS dataset_records (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  row_index INTEGER NOT NULL,
  data_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- 导入方案表
CREATE TABLE IF NOT EXISTS import_schemes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  table_type TEXT DEFAULT 'normal',
  header_rows INTEGER DEFAULT 1,
  data_start_row INTEGER DEFAULT 2,
  column_mapping TEXT,
  field_types TEXT,
  created_at TEXT NOT NULL
);

-- Word模板表
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  placeholders TEXT,
  bindings TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 图表配置表
CREATE TABLE IF NOT EXISTS chart_configs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  chart_type TEXT NOT NULL,
  dataset_id TEXT NOT NULL,
  config_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
);

-- 报告任务表
CREATE TABLE IF NOT EXISTS report_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  dataset_ids TEXT,
  chart_ids TEXT,
  status TEXT DEFAULT 'pending',
  output_path TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
`;
