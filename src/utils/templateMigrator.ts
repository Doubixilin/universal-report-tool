import JSZip from "jszip";
import { readFile } from "@tauri-apps/plugin-fs";
import type { ParsedPlaceholder } from "@/types";

/**
 * 解析 .docx 文件，提取所有 easy-template-x 占位符
 *
 * Word XML 中文字可能分散在多个 <w:t> 节点中，
 * 本函数合并同一段落的所有文本，然后正则匹配 {var} 模式。
 */
export async function parsePlaceholders(
  docxPath: string
): Promise<ParsedPlaceholder[]> {
  const bytes = await readFile(docxPath);
  const zip = await JSZip.loadAsync(bytes);

  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) return [];

  const placeholders = extractPlaceholdersFromXml(docXml);

  // Also check headers and footers
  const headerFiles = Object.keys(zip.files).filter(
    (f) => f.startsWith("word/header") && f.endsWith(".xml")
  );
  const footerFiles = Object.keys(zip.files).filter(
    (f) => f.startsWith("word/footer") && f.endsWith(".xml")
  );

  for (const file of [...headerFiles, ...footerFiles]) {
    const xml = await zip.file(file)?.async("string");
    if (xml) {
      const extra = extractPlaceholdersFromXml(xml);
      placeholders.push(...extra);
    }
  }

  return placeholders;
}

/**
 * 从 XML 字符串中提取占位符（内部函数）
 */
function extractPlaceholdersFromXml(xml: string): ParsedPlaceholder[] {
  const placeholders: ParsedPlaceholder[] = [];

  // Try DOMParser first (available in WebView2)
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "text/xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      // Fallback to regex if XML parsing fails
      return extractPlaceholdersByRegex(xml);
    }

    const paragraphs = doc.getElementsByTagName("w:p");
    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const p = paragraphs[pIdx];
      const fullText = extractParagraphText(p);
      const isChartContext = isChartTitleParagraph(p);
      const cellInfo = getTableCellInfo(p);

      extractPlaceholdersFromText(
        fullText,
        pIdx,
        isChartContext ? "chart" : undefined,
        cellInfo,
        placeholders
      );
    }
  } catch {
    return extractPlaceholdersByRegex(xml);
  }

  return placeholders;
}

/**
 * 降级方案：用正则直接扫描 XML 中的占位符
 */
function extractPlaceholdersByRegex(xml: string): ParsedPlaceholder[] {
  const placeholders: ParsedPlaceholder[] = [];
  // 匹配 <w:t>...</w:t> 中的文本
  const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let pIdx = 0;
  let match;
  while ((match = textRegex.exec(xml)) !== null) {
    const text = match[1];
    extractPlaceholdersFromText(text, pIdx++, undefined, undefined, placeholders);
  }
  return placeholders;
}

/**
 * 合并段落中所有 <w:t> 元素的文本
 */
function extractParagraphText(p: Element): string {
  const texts = p.getElementsByTagName("w:t");
  let result = "";
  for (let t = 0; t < texts.length; t++) {
    result += texts[t].textContent || "";
  }
  return result;
}

/**
 * 检查段落是否在图表标题上下文中
 */
function isChartTitleParagraph(p: Element): boolean {
  // 检查段落祖先是否包含 c:chart 或 c:tx（图表标题文本）
  let node: Element | null = p;
  while (node) {
    if (node.tagName && node.tagName.includes("chart")) return true;
    node = node.parentElement;
  }
  // 检查段落内是否有 c:chart 引用
  return p.innerHTML.includes("c:chart");
}

/**
 * 获取段落所在的表格单元格信息
 */
function getTableCellInfo(p: Element): { row: number; col: number } | undefined {
  let node: Element | null = p;
  while (node) {
    if (node.tagName && node.tagName.endsWith("tc")) {
      const tr = node.parentElement;
      const tbl = tr?.parentElement;
      if (tr && tbl) {
        const cells = Array.from(tr.getElementsByTagName("w:tc"));
        const rows = Array.from(tbl.getElementsByTagName("w:tr"));
        return {
          row: rows.indexOf(tr as HTMLElement),
          col: cells.indexOf(node as HTMLElement),
        };
      }
    }
    node = node.parentElement;
  }
  return undefined;
}

/**
 * 从文本中提取所有 {var}、{#var}、{/var} 占位符
 */
function extractPlaceholdersFromText(
  text: string,
  paragraphIndex: number,
  forcedType: "chart" | undefined,
  cellInfo: { row: number; col: number } | undefined,
  placeholders: ParsedPlaceholder[]
) {
  const regex = /\{([#\/]?[^{}]+)\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const name = match[1];
    const isOpener = name.startsWith("#");
    const isCloser = name.startsWith("/");
    const cleanName = isOpener || isCloser ? name.slice(1) : name;

    let type: ParsedPlaceholder["type"] = forcedType || "text";
    if (!forcedType) {
      if (isOpener || isCloser) type = "condition";
    }

    placeholders.push({
      name: cleanName,
      type,
      rawCommand: raw,
      isOpener,
      isCloser,
      location: { paragraph: paragraphIndex, cell: cellInfo },
    });
  }
}

/**
 * 将 docx-templates 语法迁移为 easy-template-x 语法
 */
export function convertTemplateSyntax(xmlContent: string): string {
  return xmlContent
    .replace(/\+\+\+INS\s+(\w+)\+\+\+/g, "{$1}")
    .replace(/\+\+\+IF\s+(.+?)\+\+\+/g, "{#$1}")
    .replace(/\+\+\+END-IF\+\+\+/g, "{/$1}")
    .replace(/\+\+\+FOR\s+(\w+)\s+IN\s+(\w+)\+\+\+/g, "{#$2}")
    .replace(/\+\+\+END-FOR\+\+\+/g, "{/$2}")
    .replace(/\+\+\+IMAGE\s+(.+?)\+\+\+/g, "[IMAGE: $1 - 需手动迁移]");
}

/**
 * 检测模板语法版本
 */
export async function detectTemplateSyntax(
  docxPath: string
): Promise<"easy-template-x" | "docx-templates" | "unknown"> {
  const bytes = await readFile(docxPath);
  const zip = await JSZip.loadAsync(bytes);
  const docXml = await zip.file("word/document.xml")?.async("string");
  if (!docXml) return "unknown";

  if (/\+\+\+(INS|IF|FOR|IMAGE)/.test(docXml)) return "docx-templates";
  if (/\{[\w#\/]+\}/.test(docXml)) return "easy-template-x";
  return "unknown";
}
