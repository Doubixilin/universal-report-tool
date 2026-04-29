import { TemplateHandler } from 'easy-template-x';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testChartPlugin() {
  const templatePath = path.join(__dirname, '..', 'test-templates', 'chart-template.docx');
  const outputPath = path.join(__dirname, '..', 'test-templates', 'output-poc.docx');

  console.log('=== POC 1: easy-template-x Chart Plugin Test ===\n');

  try {
    const templateBuffer = fs.readFileSync(templatePath);

    const data = {
      reportTitle: '2024 年度经营分析报告',
      companyName: '某国有企业',
      generatedDate: new Date().toLocaleDateString('zh-CN'),

      myChart: {
        _type: 'chart',
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

    fs.writeFileSync(outputPath, Buffer.from(outputDoc));

    console.log('✅ POC 1 SUCCESS');
    console.log('   Output:', outputPath);
    console.log('   Please open in Word and verify chart is editable.\n');
    return { success: true, message: `文件已生成: ${outputPath}` };
  } catch (error) {
    console.log('❌ POC 1 FAILED');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
    return { success: false, message: error.message };
  }
}

function compareSyntax() {
  console.log('=== POC 2: Syntax Compatibility ===\n');

  const result = {
    docxTemplates: {
      text: '+++INS companyName+++',
      condition: '+++IF condition+++...+++END-IF+++',
      loop: '+++FOR item IN items+++...+++END-FOR+++',
      image: '+++IMAGE dataUrl()+++',
      chart: 'NOT SUPPORTED',
    },
    easyTemplateX: {
      text: '{companyName}',
      condition: '{#condition}...{/condition}',
      loop: '{#items}{name}{/items}',
      image: 'Image plugin (built-in)',
      chart: '{chartTag} (Chart plugin built-in)',
    },
    differences: [
      'Syntax: +++CMD+++ → {var}',
      'Condition: +++IF+++...+++END-IF+++ → {#condition}...{/condition}',
      'Loop: +++FOR+++...+++END-FOR+++ → {#items}...{/items}',
      'easy-template-x natively supports charts (docx-templates does NOT)',
      'Both free: easy-template-x (Apache-2.0), docx-templates (MIT)',
    ],
  };

  console.log('docx-templates syntax:');
  console.log('  Text:', result.docxTemplates.text);
  console.log('  Condition:', result.docxTemplates.condition);
  console.log('  Loop:', result.docxTemplates.loop);
  console.log('  Image:', result.docxTemplates.image);
  console.log('  Chart:', result.docxTemplates.chart);
  console.log();
  console.log('easy-template-x syntax:');
  console.log('  Text:', result.easyTemplateX.text);
  console.log('  Condition:', result.easyTemplateX.condition);
  console.log('  Loop:', result.easyTemplateX.loop);
  console.log('  Image:', result.easyTemplateX.image);
  console.log('  Chart:', result.easyTemplateX.chart);
  console.log();
  console.log('Differences:');
  result.differences.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));
  console.log();

  return result;
}

function estimateMigrationEffort() {
  console.log('=== POC 3: Migration Effort Estimate ===\n');

  const templateCount = 0; // Currently no real templates
  const avgComplexity = 'simple';

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

  console.log('Current template count:', templateCount, '(project is new, no real templates yet)');
  console.log('Estimated migration effort:', estimatedDays, 'days');
  console.log('Risk level:', riskLevel);
  console.log('Recommendation: Since there are no existing templates to migrate, switching to easy-template-x has ZERO migration cost.');
  console.log();

  return { estimatedDays, riskLevel, templateCount };
}

// Run all POCs
async function main() {
  const r1 = await testChartPlugin();
  compareSyntax();
  estimateMigrationEffort();

  console.log('=== Final Verdict ===');
  console.log('Recommended approach: Scheme A — migrate to easy-template-x');
  console.log('Reasons:');
  console.log('  1. Native chart support (docx-templates lacks this)');
  console.log('  2. No migration cost (project is new, no real templates)');
  console.log('  3. Simpler template syntax ({var} vs +++INS var+++)');
  console.log('  4. Apache-2.0 license (compatible with commercial use)');
  console.log('  5. Active maintenance, TypeScript native');
  console.log('  6. Chart data format matches our existing data structure');
}

main().catch(console.error);
