import * as XLSX from "xlsx";
import { SheetAnalysisResult, TableType, MergeCell } from "@/types";

/** 解析 Excel 文件，返回工作簿信息和 Sheet 列表 */
export function parseWorkbook(arrayBuffer: ArrayBuffer): XLSX.WorkBook {
  return XLSX.read(arrayBuffer, { type: "array", cellDates: true });
}

/** 获取工作簿所有 Sheet 名称 */
export function getSheetNames(wb: XLSX.WorkBook): string[] {
  return wb.SheetNames;
}

/** 解析指定 Sheet，返回分析结果 */
export function analyzeSheet(
  wb: XLSX.WorkBook,
  sheetName: string
): SheetAnalysisResult {
  const ws = wb.Sheets[sheetName];
  const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const mergedCells: MergeCell[] = (ws["!merges"] || []) as unknown as MergeCell[];

  const tableType = detectTableType(raw, mergedCells);
  const { headerRowCount, dataStartRow, headers } = detectHeaders(raw, tableType);

  const sampleData = raw.slice(dataStartRow, dataStartRow + 5);

  return { tableType, headerRowCount, dataStartRow, headers, sampleData, mergedCells };
}

/** 检测表格类型 */
function detectTableType(data: any[][], merges: MergeCell[]): TableType {
  if (data.length === 0) return "normal";

  const hasMergedCells = merges && merges.length > 0;

  if (hasMergedCells) {
    // 检查合并单元格是否只在表头区域
    const headerMerges = merges.filter((m) => m.s.r < 2);
    if (headerMerges.length > merges.length * 0.5) {
      return "multiheader";
    }
    // 检查是否有跨列跨行的合并（交叉表特征）
    const hasComplexMerge = merges.some((m) => m.s.r > 0 || m.e.r - m.s.r > 0);
    if (hasComplexMerge) {
      return "complex";
    }
    return "merged";
  }

  // 检查第一行是否有大量空值（可能为多级表头）
  const firstRowEmptyRatio = data[0].filter((v) => v === "" || v === null || v === undefined).length / data[0].length;
  if (firstRowEmptyRatio > 0.5 && data.length > 1) {
    const secondRowEmptyRatio = data[1].filter((v) => v === "" || v === null || v === undefined).length / data[1].length;
    if (secondRowEmptyRatio < 0.3) {
      return "multiheader";
    }
  }

  return "normal";
}

/** 智能检测表头行数和起始行 */
function detectHeaders(
  data: any[][],
  tableType: TableType
): { headerRowCount: number; dataStartRow: number; headers: string[] } {
  if (data.length === 0) {
    return { headerRowCount: 0, dataStartRow: 0, headers: [] };
  }

  if (tableType === "multiheader" || tableType === "complex") {
    // 多级表头：检测连续包含文字的行
    let headerRowCount = 0;
    for (let r = 0; r < Math.min(data.length, 5); r++) {
      const textCount = data[r].filter(
        (v) => typeof v === "string" && v.trim() !== ""
      ).length;
      const nonEmptyRatio = textCount / Math.max(data[r].length, 1);
      if (nonEmptyRatio > 0.2) {
        headerRowCount = r + 1;
      } else {
        break;
      }
    }
    // 最多 3 行表头
    headerRowCount = Math.min(headerRowCount, 3);
    // 如果没检测到表头，默认1行
    if (headerRowCount === 0) headerRowCount = 1;

    const headers = extractMergedHeaders(data, headerRowCount);
    return { headerRowCount, dataStartRow: headerRowCount, headers };
  }

  // 普通表或合并单元格表：第一行即为表头
  const headers = data[0].map((v, i) => {
    if (typeof v === "string" && v.trim()) return v.trim();
    return `列${i + 1}`;
  });

  return { headerRowCount: 1, dataStartRow: 1, headers };
}

/** 提取多级表头合并后的列名 */
function extractMergedHeaders(data: any[][], headerRowCount: number): string[] {
  if (headerRowCount <= 1) {
    return data[0].map((v, i) =>
      typeof v === "string" && v.trim() ? v.trim() : `列${i + 1}`
    );
  }

  const colCount = Math.max(...data.slice(0, headerRowCount).map((r) => r.length));
  const headers: string[] = [];

  for (let c = 0; c < colCount; c++) {
    const parts: string[] = [];
    for (let r = 0; r < headerRowCount; r++) {
      const val = data[r]?.[c];
      if (typeof val === "string" && val.trim()) {
        parts.push(val.trim());
      }
    }
    headers.push(parts.length > 0 ? parts.join(" / ") : `列${c + 1}`);
  }

  return headers;
}

/** 将 Sheet 数据转换为记录数组（用于预览和存储） */
export function sheetToRecords(
  raw: any[][],
  headers: string[],
  dataStartRow: number
): Array<Record<string, any>> {
  const records: Array<Record<string, any>> = [];

  for (let r = dataStartRow; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.every((v) => v === "" || v === null || v === undefined)) continue;

    const record: Record<string, any> = {};
    headers.forEach((h, i) => {
      record[h] = row[i] !== undefined ? row[i] : "";
    });
    records.push(record);
  }

  return records;
}

/** 推断字段类型 */
export function inferFieldTypes(
  records: Array<Record<string, any>>,
  headers: string[]
): Record<string, "text" | "number" | "date" | "percent" | "currency"> {
  const types: Record<string, "text" | "number" | "date" | "percent" | "currency"> = {};
  const sampleSize = Math.min(records.length, 50);

  for (const header of headers) {
    let numberCount = 0;
    let dateCount = 0;
    let percentCount = 0;
    let currencyCount = 0;

    for (let i = 0; i < sampleSize; i++) {
      const val = records[i]?.[header];
      if (val === "" || val === null || val === undefined) continue;

      const str = String(val).trim();
      if (str.includes("%")) {
        percentCount++;
      } else if (/^[¥\$€£]/.test(str) || /元|万|亿$/.test(str)) {
        currencyCount++;
      } else if (!isNaN(Number(str)) && str !== "") {
        numberCount++;
      } else if (/\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(str)) {
        dateCount++;
      }
    }

    const counts = [
      { type: "currency" as const, count: currencyCount },
      { type: "percent" as const, count: percentCount },
      { type: "number" as const, count: numberCount },
      { type: "date" as const, count: dateCount },
      { type: "text" as const, count: sampleSize - numberCount - dateCount - percentCount - currencyCount },
    ];
    counts.sort((a, b) => b.count - a.count);
    types[header] = counts[0].type;
  }

  return types;
}
