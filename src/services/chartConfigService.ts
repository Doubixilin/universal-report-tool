// ============================================================
// 图表配置持久化服务 — chart_configs 表 CRUD
// ============================================================

import { getDatabase } from "@/database";
import type { ChartTypeKind } from "@/types/chart";

/** 图表配置持久化记录 */
export interface ChartConfigRecord {
  id: string;
  projectId: string;
  name: string;
  chartType: ChartTypeKind;
  datasetId: string;
  configJson: ChartConfigData;
  createdAt: string;
  updatedAt: string;
}

/** config_json 中存储的图表编辑状态 */
export interface ChartConfigData {
  title: string;
  chartType: ChartTypeKind;
  categories: string[];
  series: Array<{ name: string; values: number[]; color?: string }>;
  xAxisTitle?: string;
  yAxisTitle?: string;
  theme?: string;
  annotations?: Record<string, unknown>;
}

/** 创建图表配置 */
export async function createChartConfig(
  projectId: string,
  name: string,
  chartType: ChartTypeKind,
  datasetId: string,
  configData: ChartConfigData
): Promise<string> {
  const db = await getDatabase();
  const id = `cc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO chart_configs (id, project_id, name, chart_type, dataset_id, config_json, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, projectId, name, chartType, datasetId, JSON.stringify(configData), now, now]
  );

  return id;
}

/** 更新图表配置 */
export async function updateChartConfig(
  id: string,
  updates: {
    name?: string;
    chartType?: ChartTypeKind;
    datasetId?: string;
    configData?: ChartConfigData;
  }
): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const fields: string[] = ["updated_at = $1"];
  const params: unknown[] = [now];
  let paramIdx = 2;

  if (updates.name !== undefined) {
    fields.push(`name = $${paramIdx++}`);
    params.push(updates.name);
  }
  if (updates.chartType !== undefined) {
    fields.push(`chart_type = $${paramIdx++}`);
    params.push(updates.chartType);
  }
  if (updates.datasetId !== undefined) {
    fields.push(`dataset_id = $${paramIdx++}`);
    params.push(updates.datasetId);
  }
  if (updates.configData !== undefined) {
    fields.push(`config_json = $${paramIdx++}`);
    params.push(JSON.stringify(updates.configData));
  }

  params.push(id);
  await db.execute(
    `UPDATE chart_configs SET ${fields.join(", ")} WHERE id = $${paramIdx}`,
    params
  );
}

/** 查询项目下所有图表配置 */
export async function getChartConfigs(projectId: string): Promise<ChartConfigRecord[]> {
  const db = await getDatabase();
  const rows = await db.select<{
    id: string;
    project_id: string;
    name: string;
    chart_type: string;
    dataset_id: string;
    config_json: string;
    created_at: string;
    updated_at: string;
  }[]>(
    "SELECT * FROM chart_configs WHERE project_id = $1 ORDER BY created_at DESC",
    [projectId]
  );

  return (rows || []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    chartType: row.chart_type as ChartTypeKind,
    datasetId: row.dataset_id,
    configJson: JSON.parse(row.config_json) as ChartConfigData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/** 根据 ID 查询单个图表配置 */
export async function getChartConfigById(id: string): Promise<ChartConfigRecord | null> {
  const db = await getDatabase();
  const rows = await db.select<{
    id: string;
    project_id: string;
    name: string;
    chart_type: string;
    dataset_id: string;
    config_json: string;
    created_at: string;
    updated_at: string;
  }[]>(
    "SELECT * FROM chart_configs WHERE id = $1",
    [id]
  );

  if (!rows || rows.length === 0) return null;

  const row = rows[0];
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    chartType: row.chart_type as ChartTypeKind,
    datasetId: row.dataset_id,
    configJson: JSON.parse(row.config_json) as ChartConfigData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** 删除图表配置 */
export async function deleteChartConfig(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute("DELETE FROM chart_configs WHERE id = $1", [id]);
}
