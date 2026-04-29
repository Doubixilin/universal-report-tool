import { TemplateHandler } from 'easy-template-x';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';

/**
 * Word 模板引擎技术评估 POC
 *
 * ⚠️ POC 1 结果：easy-template-x Chart 插件存在 Bug
 *    当图表嵌入在 Word 文档正文中时，ChartPlugin 调用 updateChart(context.currentPart)
 *    传入的是文档部件（w:document），而非图表部件（c:chartSpace），
 *    导致 MalformedFileError: Unexpected chart root node "w:document"
 *
 *    结论：easy-template-x 的 Chart 插件不适用于文档正文中的嵌入图表
 *    详见 docs/word-engine-evaluation.md
 */

export interface Poc1Result {
  success: boolean;
  message: string;
  /** Bug 描述 */
  knownIssue?: string;
}

/**
 * POC 1: 测试 easy-template-x 的 Chart 插件
 *
 * ⚠️ 已知失败：embedded chart 在 document.xml 中的图表无法被更新
 * 原因见：docs/word-engine-evaluation.md
 */
export async function testChartPlugin(
  templatePath: string,
  outputPath: string
): Promise<Poc1Result> {
  try {
    const templateBytes = await readFile(templatePath);
    const templateBuffer = Buffer.from(templateBytes);

    const data = {
      reportTitle: '2024 年度经营分析报告',
      companyName: '某国有企业',
      generatedDate: new Date().toLocaleDateString('zh-CN'),

      myChart: {
        _type: 'chart' as const,
        categories: {
          names: ['Q1', 'Q2', 'Q3', 'Q4'],
        },
        series: [
          {
            name: '营业收入（万元）',
            color: '#4472C4',
            values: [1520, 1830, 1650, 2100],
          },
          {
            name: '净利润（万元）',
            color: '#ED7D31',
            values: [320, 410, 380, 520],
          },
        ],
      },
    };

    const handler = new TemplateHandler();
    const outputDoc = await handler.process(templateBuffer, data);

    await writeFile(outputPath, Buffer.from(outputDoc));

    return {
      success: true,
      message: `文件已生成到 ${outputPath}（注：文本替换成功，但图表数据未更新 — 见 evaluation.md）`,
      knownIssue: 'ChartPlugin 无法更新文档正文中的嵌入图表，updateChart 收到错误的 currentPart',
    };
  } catch (error) {
    return {
      success: false,
      message: `POC 失败: ${error instanceof Error ? error.message : String(error)}`,
      knownIssue: error instanceof Error && error.message.includes('Unexpected chart root node')
        ? '已知 Bug: ChartPlugin 传入 context.currentPart 为文档部件而非图表部件'
        : undefined,
    };
  }
}

/**
 * POC 2: 测试模板语法兼容性
 */
export function compareSyntax(): {
  docxTemplates: string;
  easyTemplateX: string;
  differences: string[];
} {
  return {
    docxTemplates: `
      文本插入: +++INS companyName+++
      条件判断: +++IF condition+++...+++END-IF+++
      循环: +++FOR item IN items+++...+++END-FOR+++
      图片: +++IMAGE dataUrl()+++
      图表: 不支持
    `,
    easyTemplateX: `
      文本插入: {companyName}
      条件判断: {#condition}...{/condition}
      循环: {#items}{name}{/items}
      图片: Image 插件（免费内置）
      图表: {chartTag}（Chart 插件免费内置，但有 Bug — 嵌入图表无法更新）
    `,
    differences: [
      '语法格式从 +++CMD+++ 变为 {var}',
      '条件从 +++IF+++...+++END-IF+++ 变为 {#condition}...{/condition}',
      '循环从 +++FOR+++...+++END-FOR+++ 变为 {#items}...{/items}',
      'easy-template-x 原生支持图表（但 Chart 插件有 Bug，嵌入图表无法更新）',
      '两者均为免费开源（easy-template-x: Apache-2.0, docx-templates: MIT）',
    ],
  };
}

/**
 * POC 3: 评估迁移工作量
 */
export function estimateMigrationEffort(
  templateCount: number,
  avgComplexity: 'simple' | 'medium' | 'complex'
): {
  estimatedDays: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
} {
  const complexityMultiplier = {
    simple: 0.5,
    medium: 1,
    complex: 2,
  };

  const baseDaysPerTemplate = 0.5;
  const estimatedDays = Math.ceil(
    templateCount * baseDaysPerTemplate * complexityMultiplier[avgComplexity]
  );

  const riskLevel = templateCount > 10 ? 'high' : templateCount > 5 ? 'medium' : 'low';

  const recommendation =
    estimatedDays <= 3
      ? '建议直接迁移：工作量小，收益大'
      : estimatedDays <= 7
        ? '建议分步迁移：先迁移核心模板，验证后再全面迁移'
        : '建议保留双引擎：新模板用 easy-template-x，旧模板逐步迁移';

  return { estimatedDays, riskLevel, recommendation };
}
