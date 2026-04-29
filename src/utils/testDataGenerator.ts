// ============================================================
// 测试数据生成器 — 为全流程模拟提供虚拟数据
// ============================================================

import { getDatabase } from "@/database";
import type { ChartTypeKind } from "@/types/chart";

const PROJECT_ID = "default-project";

/** 测试数据集定义 */
interface TestDataset {
  id: string;
  name: string;
  sourceFile: string;
  fields: Array<{ name: string; type: string }>;
  records: Array<Record<string, unknown>>;
}

/** 测试图表配置定义 */
interface TestChartConfig {
  id: string;
  name: string;
  chartType: ChartTypeKind;
  datasetId: string;
  title: string;
  categories: string[];
  series: Array<{ name: string; values: number[]; color?: string }>;
  xAxisTitle?: string;
  yAxisTitle?: string;
}

// ==================== 数据集定义 ====================

const DEPARTMENTS = ["研发部", "市场部", "销售部", "财务部", "人力资源部", "运营部", "产品部", "客服部"];
const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function makeDataset1(): TestDataset {
  // 2024年各部门经营数据（8行 × 5列）
  const records = DEPARTMENTS.map((dept) => ({
    部门: dept,
    营业收入: rand(500, 3000),
    利润: rand(50, 800),
    增长率: rand(-10, 35),
    完成率: rand(70, 120),
  }));
  return {
    id: "ds_depts_2024",
    name: "2024年各部门经营数据",
    sourceFile: "部门经营数据.xlsx",
    fields: [
      { name: "部门", type: "text" },
      { name: "营业收入", type: "number" },
      { name: "利润", type: "number" },
      { name: "增长率", type: "number" },
      { name: "完成率", type: "number" },
    ],
    records,
  };
}

function makeDataset2(): TestDataset {
  // 月度销售趋势（12行 × 4列）
  const records = MONTHS.map((m) => ({
    月份: m,
    产品A销售额: rand(80, 300),
    产品B销售额: rand(60, 250),
    产品C销售额: rand(40, 200),
  }));
  return {
    id: "ds_monthly_sales",
    name: "月度销售趋势",
    sourceFile: "月度销售.xlsx",
    fields: [
      { name: "月份", type: "text" },
      { name: "产品A销售额", type: "number" },
      { name: "产品B销售额", type: "number" },
      { name: "产品C销售额", type: "number" },
    ],
    records,
  };
}

function makeDataset3(): TestDataset {
  // 员工绩效评估（8行 × 6列）
  const names = ["张伟", "李芳", "王强", "赵敏", "刘洋", "陈静", "杨磊", "周婷"];
  const records = names.map((name) => ({
    姓名: name,
    专业能力: rand(60, 98),
    沟通能力: rand(55, 95),
    创新能力: rand(50, 99),
    团队协作: rand(65, 98),
    执行力: rand(60, 97),
  }));
  return {
    id: "ds_employee_perf",
    name: "员工绩效评估",
    sourceFile: "绩效评估.xlsx",
    fields: [
      { name: "姓名", type: "text" },
      { name: "专业能力", type: "number" },
      { name: "沟通能力", type: "number" },
      { name: "创新能力", type: "number" },
      { name: "团队协作", type: "number" },
      { name: "执行力", type: "number" },
    ],
    records,
  };
}

// ==================== 图表配置定义 ====================

function makeChartConfigs(ds1: TestDataset, ds2: TestDataset, ds3: TestDataset): TestChartConfig[] {
  const d1 = ds1.records;
  const d2 = ds2.records;
  const d3 = ds3.records;

  return [
    // 1. barChart — 部门 × 营业收入
    {
      id: "cc_bar",
      name: "各部门营业收入对比",
      chartType: "barChart",
      datasetId: ds1.id,
      title: "2024年各部门营业收入",
      categories: d1.map((r) => r["部门"] as string),
      series: [{ name: "营业收入", values: d1.map((r) => r["营业收入"] as number), color: "#C41E24" }],
      xAxisTitle: "部门",
      yAxisTitle: "万元",
    },
    // 2. lineChart — 月份 × 3个产品
    {
      id: "cc_line",
      name: "月度销售趋势",
      chartType: "lineChart",
      datasetId: ds2.id,
      title: "2024年月度销售趋势",
      categories: d2.map((r) => r["月份"] as string),
      series: [
        { name: "产品A", values: d2.map((r) => r["产品A销售额"] as number), color: "#1E6FDC" },
        { name: "产品B", values: d2.map((r) => r["产品B销售额"] as number), color: "#27AE60" },
        { name: "产品C", values: d2.map((r) => r["产品C销售额"] as number), color: "#B8860B" },
      ],
      xAxisTitle: "月份",
      yAxisTitle: "万元",
    },
    // 3. pieChart — 部门 × 利润占比
    {
      id: "cc_pie",
      name: "各部门利润占比",
      chartType: "pieChart",
      datasetId: ds1.id,
      title: "2024年各部门利润占比",
      categories: d1.map((r) => r["部门"] as string),
      series: [{ name: "利润", values: d1.map((r) => r["利润"] as number) }],
    },
    // 4. doughnutChart — 部门 × 营业收入占比
    {
      id: "cc_doughnut",
      name: "营收构成环形图",
      chartType: "doughnutChart",
      datasetId: ds1.id,
      title: "2024年营收构成",
      categories: d1.map((r) => r["部门"] as string),
      series: [{ name: "营业收入", values: d1.map((r) => r["营业收入"] as number) }],
    },
    // 5. areaChart — 月份 × 销售趋势
    {
      id: "cc_area",
      name: "销售面积图",
      chartType: "areaChart",
      datasetId: ds2.id,
      title: "2024年销售面积趋势",
      categories: d2.map((r) => r["月份"] as string),
      series: [
        { name: "产品A", values: d2.map((r) => r["产品A销售额"] as number), color: "#6C5CE7" },
        { name: "产品B", values: d2.map((r) => r["产品B销售额"] as number), color: "#00B894" },
      ],
      xAxisTitle: "月份",
      yAxisTitle: "万元",
    },
    // 6. scatterChart — 增长率 vs 完成率
    {
      id: "cc_scatter",
      name: "增长率与完成率散点图",
      chartType: "scatterChart",
      datasetId: ds1.id,
      title: "增长率 vs 完成率",
      categories: d1.map((r) => r["部门"] as string),
      series: [
        { name: "增长率", values: d1.map((r) => r["增长率"] as number) },
        { name: "完成率", values: d1.map((r) => r["完成率"] as number) },
      ],
      xAxisTitle: "增长率%",
      yAxisTitle: "完成率%",
    },
    // 7. bubbleChart — 营业收入(气泡大小) + 利润 + 增长率
    {
      id: "cc_bubble",
      name: "经营指标气泡图",
      chartType: "bubbleChart",
      datasetId: ds1.id,
      title: "部门经营指标气泡图",
      categories: d1.map((r) => r["部门"] as string),
      series: [
        { name: "利润", values: d1.map((r) => r["利润"] as number) },
        { name: "营业收入", values: d1.map((r) => r["营业收入"] as number) },
      ],
    },
    // 8. radarChart — 5维度 × 2个人员
    {
      id: "cc_radar",
      name: "员工能力雷达图",
      chartType: "radarChart",
      datasetId: ds3.id,
      title: "员工能力对比",
      categories: ["专业能力", "沟通能力", "创新能力", "团队协作", "执行力"],
      series: [
        { name: d3[0]["姓名"] as string, values: [d3[0]["专业能力"], d3[0]["沟通能力"], d3[0]["创新能力"], d3[0]["团队协作"], d3[0]["执行力"]] as number[] },
        { name: d3[1]["姓名"] as string, values: [d3[1]["专业能力"], d3[1]["沟通能力"], d3[1]["创新能力"], d3[1]["团队协作"], d3[1]["执行力"]] as number[] },
      ],
    },
    // 9. liquidFillChart — 完成率均值
    {
      id: "cc_liquid",
      name: "整体完成率水球图",
      chartType: "liquidFillChart",
      datasetId: ds1.id,
      title: "整体完成率",
      categories: ["完成率"],
      series: [{
        name: "完成率",
        values: [Math.round(d1.reduce((s, r) => s + (r["完成率"] as number), 0) / d1.length)],
      }],
    },
    // 10. pictorialBarChart — 部门 × 营业收入
    {
      id: "cc_pictorial",
      name: "营收象形柱图",
      chartType: "pictorialBarChart",
      datasetId: ds1.id,
      title: "各部门营收象形图",
      categories: d1.map((r) => r["部门"] as string),
      series: [{ name: "营业收入", values: d1.map((r) => r["营业收入"] as number) }],
    },
    // 11. candlestickChart — 12个月OHLC
    {
      id: "cc_candlestick",
      name: "股价K线图",
      chartType: "candlestickChart",
      datasetId: ds2.id,
      title: "模拟股价走势",
      categories: d2.map((r) => r["月份"] as string),
      series: [
        { name: "开盘", values: d2.map(() => rand(90, 110)) },
        { name: "收盘", values: d2.map(() => rand(85, 115)) },
        { name: "最低", values: d2.map(() => rand(80, 95)) },
        { name: "最高", values: d2.map(() => rand(105, 120)) },
      ],
    },
    // 12. wordCloudChart — 关键词 × 频率
    {
      id: "cc_wordcloud",
      name: "业务关键词词云",
      chartType: "wordCloudChart",
      datasetId: ds1.id,
      title: "业务关键词",
      categories: ["数字化转型", "降本增效", "市场拓展", "产品创新", "客户满意度", "人才培养", "流程优化", "品牌建设", "数据驱动", "生态合作", "智能运营", "风险管理", "组织变革", "业绩增长", "技术赋能"],
      series: [{ name: "频率", values: [95, 88, 82, 78, 75, 70, 65, 60, 58, 55, 50, 45, 42, 40, 38] }],
    },
    // 13. graphChart — 节点关系
    {
      id: "cc_graph",
      name: "部门协作关系图",
      chartType: "graphChart",
      datasetId: ds1.id,
      title: "部门协作关系",
      categories: DEPARTMENTS.slice(0, 6),
      series: [
        { name: "连接", values: [3, 2, 4, 1, 2, 3] },
      ],
    },
    // 14. themeRiverChart — 12个月 × 3个主题流
    {
      id: "cc_themeriver",
      name: "业务主题河流图",
      chartType: "themeRiverChart",
      datasetId: ds2.id,
      title: "业务主题演变",
      categories: d2.map((r) => r["月份"] as string),
      series: [
        { name: "产品A", values: d2.map((r) => r["产品A销售额"] as number) },
        { name: "产品B", values: d2.map((r) => r["产品B销售额"] as number) },
        { name: "产品C", values: d2.map((r) => r["产品C销售额"] as number) },
      ],
    },
    // 15. customChart — 部门 × 带误差的指标值
    {
      id: "cc_custom",
      name: "自定义系列图",
      chartType: "customChart",
      datasetId: ds1.id,
      title: "部门综合评分",
      categories: d1.map((r) => r["部门"] as string),
      series: [
        { name: "综合评分", values: d1.map(() => rand(60, 95)), color: "#6C5CE7" },
        { name: "误差上界", values: d1.map(() => rand(5, 15)) },
        { name: "误差下界", values: d1.map(() => rand(5, 15)) },
      ],
    },
  ];
}

// ==================== 数据库写入 ====================

async function ensureProject(db: Awaited<ReturnType<typeof getDatabase>>): Promise<void> {
  const existing = await db.select<Array<{ id: string }>>(
    "SELECT id FROM projects WHERE id = $1",
    [PROJECT_ID]
  );
  if (!existing || existing.length === 0) {
    const now = new Date().toISOString();
    await db.execute(
      `INSERT INTO projects (id, name, description, storage_type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [PROJECT_ID, "默认项目", "测试数据自动生成", "sqlite", now, now]
    );
  }
}

async function writeDataset(db: Awaited<ReturnType<typeof getDatabase>>, ds: TestDataset): Promise<void> {
  const now = new Date().toISOString();

  // 清理旧数据
  await db.execute("DELETE FROM dataset_records WHERE dataset_id = $1", [ds.id]);
  await db.execute("DELETE FROM datasets WHERE id = $1", [ds.id]);

  // 插入数据集
  await db.execute(
    `INSERT INTO datasets (id, project_id, name, source_file, created_at, updated_at, row_count, schema_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      ds.id, PROJECT_ID, ds.name, ds.sourceFile, now, now,
      ds.records.length,
      JSON.stringify({ fields: ds.fields }),
    ]
  );

  // 逐条插入记录
  for (let i = 0; i < ds.records.length; i++) {
    const recId = `${ds.id}_rec_${i}`;
    await db.execute(
      `INSERT INTO dataset_records (id, dataset_id, row_index, data_json, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [recId, ds.id, i, JSON.stringify(ds.records[i]), now]
    );
  }
}

async function writeChartConfig(db: Awaited<ReturnType<typeof getDatabase>>, cfg: TestChartConfig): Promise<void> {
  const now = new Date().toISOString();

  // 清理旧配置
  await db.execute("DELETE FROM chart_configs WHERE id = $1", [cfg.id]);

  await db.execute(
    `INSERT INTO chart_configs (id, project_id, name, chart_type, dataset_id, config_json, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      cfg.id, PROJECT_ID, cfg.name, cfg.chartType, cfg.datasetId,
      JSON.stringify({
        title: cfg.title,
        chartType: cfg.chartType,
        categories: cfg.categories,
        series: cfg.series,
        xAxisTitle: cfg.xAxisTitle,
        yAxisTitle: cfg.yAxisTitle,
      }),
      now, now,
    ]
  );
}

// ==================== 主入口 ====================

export interface TestDataResult {
  datasets: number;
  chartConfigs: number;
  records: number;
}

/**
 * 生成全套测试数据并写入 SQLite
 * 调用一次即可为全流程模拟提供数据基础
 */
export async function generateTestData(): Promise<TestDataResult> {
  const db = await getDatabase();

  // 确保默认项目存在
  await ensureProject(db);

  // 生成数据集
  const ds1 = makeDataset1();
  const ds2 = makeDataset2();
  const ds3 = makeDataset3();

  await db.execute("BEGIN TRANSACTION", []);
  try {
    await writeDataset(db, ds1);
    await writeDataset(db, ds2);
    await writeDataset(db, ds3);

    // 生成图表配置
    const configs = makeChartConfigs(ds1, ds2, ds3);
    for (const cfg of configs) {
      await writeChartConfig(db, cfg);
    }

    await db.execute("COMMIT", []);

    return {
      datasets: 3,
      chartConfigs: configs.length,
      records: ds1.records.length + ds2.records.length + ds3.records.length,
    };
  } catch (err) {
    await db.execute("ROLLBACK", []);
    throw err;
  }
}

/**
 * 清理所有测试数据
 */
export async function clearTestData(): Promise<void> {
  const db = await getDatabase();
  await db.execute("BEGIN TRANSACTION", []);
  try {
    await db.execute("DELETE FROM chart_configs WHERE project_id = $1", [PROJECT_ID]);
    await db.execute("DELETE FROM dataset_records WHERE dataset_id IN (SELECT id FROM datasets WHERE project_id = $1)", [PROJECT_ID]);
    await db.execute("DELETE FROM datasets WHERE project_id = $1", [PROJECT_ID]);
    await db.execute("COMMIT", []);
  } catch (err) {
    await db.execute("ROLLBACK", []);
    throw err;
  }
}
