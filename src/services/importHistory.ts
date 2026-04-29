// ============================================================
// 导入历史服务 -- 记录每次导入配置，支持指纹匹配推荐
// ============================================================

import { getDatabase } from '@/database';

/** 导入历史纪录 */
export interface ImportHistoryRecord {
  id: string;
  filename: string;
  sheetName: string;
  columnMapping: Record<string, string>;
  fieldTypes: Record<string, string>;
  dataSummary: { rowCount: number; columns: number };
  fingerprint: string;
  createdAt: string;
  projectId: string;
}

/** 根据列名生成导入指纹 */
export function generateFingerprint(headers: string[]): string {
  const sorted = [...headers].sort().join('|').toLowerCase();
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

/** 保存导入历史 */
export async function saveImportHistory(record: Omit<ImportHistoryRecord, 'id' | 'createdAt'>): Promise<string> {
  const db = await getDatabase();
  const id = `ih-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const createdAt = new Date().toISOString();

  await db.execute(
    `INSERT INTO import_history (id, filename, sheet_name, column_mapping, field_types, data_summary, import_fingerprint, created_at, project_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      id,
      record.filename,
      record.sheetName,
      JSON.stringify(record.columnMapping),
      JSON.stringify(record.fieldTypes),
      JSON.stringify(record.dataSummary),
      record.fingerprint,
      createdAt,
      record.projectId,
    ]
  );

  // 保留最近 50 条记录，清理旧的
  await db.execute(
    `DELETE FROM import_history WHERE id NOT IN (
      SELECT id FROM import_history ORDER BY created_at DESC LIMIT 50
    )`
  );

  return id;
}

/** 查询项目下的导入历史（按时间倒序） */
export async function getImportHistory(projectId: string, limit = 20): Promise<ImportHistoryRecord[]> {
  const db = await getDatabase();
  const rows = await db.select<{
    id: string;
    filename: string;
    sheet_name: string;
    column_mapping: string;
    field_types: string;
    data_summary: string;
    import_fingerprint: string;
    created_at: string;
    project_id: string;
  }[]>(
    `SELECT id, filename, sheet_name, column_mapping, field_types, data_summary, import_fingerprint, created_at, project_id
     FROM import_history
     WHERE project_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [projectId, limit]
  );

  return rows.map((r) => ({
    id: r.id,
    filename: r.filename,
    sheetName: r.sheet_name,
    columnMapping: JSON.parse(r.column_mapping),
    fieldTypes: r.field_types ? JSON.parse(r.field_types) : {},
    dataSummary: r.data_summary ? JSON.parse(r.data_summary) : { rowCount: 0, columns: 0 },
    fingerprint: r.import_fingerprint,
    createdAt: r.created_at,
    projectId: r.project_id,
  }));
}

/** 根据指纹查询历史配置（用于智能推荐） */
export async function findByFingerprint(fingerprint: string, projectId: string): Promise<ImportHistoryRecord | null> {
  const db = await getDatabase();
  const rows = await db.select<{
    id: string;
    filename: string;
    sheet_name: string;
    column_mapping: string;
    field_types: string;
    data_summary: string;
    import_fingerprint: string;
    created_at: string;
    project_id: string;
  }[]>(
    `SELECT id, filename, sheet_name, column_mapping, field_types, data_summary, import_fingerprint, created_at, project_id
     FROM import_history
     WHERE import_fingerprint = $1 AND project_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [fingerprint, projectId]
  );

  if (rows.length === 0) return null;

  const r = rows[0];
  return {
    id: r.id,
    filename: r.filename,
    sheetName: r.sheet_name,
    columnMapping: JSON.parse(r.column_mapping),
    fieldTypes: r.field_types ? JSON.parse(r.field_types) : {},
    dataSummary: r.data_summary ? JSON.parse(r.data_summary) : { rowCount: 0, columns: 0 },
    fingerprint: r.import_fingerprint,
    createdAt: r.created_at,
    projectId: r.project_id,
  };
}

/** 删除导入历史纪录 */
export async function deleteImportHistory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(`DELETE FROM import_history WHERE id = $1`, [id]);
}
