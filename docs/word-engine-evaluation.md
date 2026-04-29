# Word 模板引擎技术评估报告

> 日期：2026-04-28（初评）→ 2026-04-29（重新评估）
> 评估人：Claude Code
> 状态：✅ 完成 — 方案 A 已验证可行

---

## 结论摘要（重新评估后）

### 推荐方案：方案 A — 迁移至 easy-template-x ✅

### Bug 修复验证

easy-template-x v7.2.3 的 Chart 插件 Bug **已修复并验证通过**：

| 验证项 | 结果 |
|--------|------|
| 图表数据更新 | ✅ 2 个系列正确填充 |
| 分类标签 | ✅ Q1, Q2, Q3, Q4 |
| 系列1数据 | ✅ 营业收入: 1520/1830/1650/2100 |
| 系列2数据 | ✅ 净利润: 320/410/380/520 |
| ptCount | ✅ 全部为 4 |
| 文本替换 | ✅ `{reportTitle}`, `{companyName}`, `{generatedDate}` |

### Bug 修复详情

**根因**：`ChartPlugin.simpleTagReplacements()` 调用 `updateChart(context.currentPart)` 时，`context.currentPart` 是文档部件（`w:document`），不是图表部件（`c:chartSpace`）。

**修复**：通过 `c:chart` 元素的 `r:id` 属性获取正确的图表部件：

```typescript
// 修复前（1行）
await updateChart(context.currentPart, content);

// 修复后（7行）
const chartRelId = chartNode.attributes && chartNode.attributes["r:id"];
if (!chartRelId) {
  throw new TemplateSyntaxError(`Chart tag "${tag.rawText}" is missing r:id reference`);
}
const chartPart = await context.currentPart.getPartById(chartRelId);
if (!chartPart) {
  throw new TemplateSyntaxError(`Chart part with id "${chartRelId}" not found`);
}
await updateChart(chartPart, content);
```

**永久化方案**：使用 `patch-package`，每次 `npm install` 后自动应用补丁。
- 补丁文件：`patches/easy-template-x+7.2.3.patch`（2KB）
- postinstall 脚本：`"postinstall": "patch-package"`

---

## 原始评估记录（2026-04-28）

### POC 1: Chart 插件功能测试 — ❌ 失败（已修复）

| 项目 | 结果 |
|------|------|
| 测试模板 | `test-templates/chart-template.docx` |
| 错误信息 | `MalformedFileError: Unexpected chart root node "w:document"` |
| 图表数据更新 | ❌ 未更新 |
| 文本替换 | ✅ `{reportTitle}`、`{companyName}`、`{generatedDate}` 替换成功 |

### POC 2: 语法兼容性分析 — ✅ 完成

| 特性 | docx-templates | easy-template-x |
|------|---------------|-----------------|
| 文本插入 | `+++INS var+++` | `{var}` |
| 条件判断 | `+++IF+++...+++END-IF+++` | `{#cond}...{/cond}` |
| 循环 | `+++FOR+++...+++END-FOR+++` | `{#items}...{/items}` |
| 图片 | `+++IMAGE dataUrl()+++` | Image 插件 |
| 图表 | ❌ 不支持 | ✅ 支持（修复后） |
| 许可证 | MIT | Apache-2.0 |

### POC 3: 迁移工作量评估 — ✅ 完成

| 项目 | 结果 |
|------|------|
| 当前模板数量 | 0（项目新建，无真实模板） |
| 迁移工作量 | 0 天（无模板需要迁移） |
| 风险等级 | 低 |

## 方案 A 优势

1. **统一处理流水线**：一套库完成所有替换：文本/循环/条件/图片/链接/图表
2. **图表可编辑性**：自动更新嵌入的图表数据，双击即可编辑
3. **图表类型丰富**：支持柱状/折线/饼图/环形/散点/气泡 + 3D 变体（13种）
4. **模板语法简洁**：`{var}` 直观易读
5. **免费开源**：Apache-2.0 许可证，兼容商业使用
6. **数据格式匹配**：与我们现有的 ChartDataRequest 结构一致

## 最终决策

**选择方案 A**：迁移至 easy-template-x（使用 patch-package 修复 Chart 插件 Bug）。

理由：
- Bug 仅需 7 行代码修复，已通过 `patch-package` 永久化
- easy-template-x 功能全面，覆盖所有 Word 模板需求
- 项目处于初期，无现有模板迁移成本
- 统一的前后端处理模型更易于维护
