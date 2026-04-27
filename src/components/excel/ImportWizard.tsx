import { useState, useCallback } from "react";
import { Steps, Button, message, Space, Card, Typography } from "antd";
import { UploadOutlined, SaveOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import {
  parseWorkbook,
  getSheetNames,
  analyzeSheet,
  sheetToRecords,
  inferFieldTypes,
} from "@/utils/excelParser";
import { SheetAnalysisResult, Dataset, ImportScheme, FieldConfig } from "@/types";
import SheetSelector from "./SheetSelector";
import DataPreview from "./DataPreview";
import ColumnMapper from "./ColumnMapper";

const { Title, Text } = Typography;

interface ImportWizardProps {
  file: File | null;
  onImportComplete: (
    dataset: Dataset,
    records: Array<Record<string, any>>,
    scheme: ImportScheme
  ) => Promise<void>;
  onCancel: () => void;
}

export default function ImportWizard({ file, onImportComplete, onCancel }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [analysis, setAnalysis] = useState<SheetAnalysisResult | null>(null);
  const [rawData, setRawData] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [fieldTypes, setFieldTypes] = useState<Record<string, FieldConfig["type"]>>({});
  const [loading, setLoading] = useState(false);

  // 步骤1：解析文件
  const handleFileParse = useCallback(() => {
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const wb = parseWorkbook(arrayBuffer);
        const names = getSheetNames(wb);

        setWorkbook(wb);
        setSheetNames(names);
        setActiveSheet(names[0]);

        // 分析第一个Sheet
        const result = analyzeSheet(wb, names[0]);
        setAnalysis(result);

        const ws = wb.Sheets[names[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        setRawData(raw);

        setCurrentStep(1);
        message.success(`解析成功！共 ${names.length} 个工作表`);
      } catch (err) {
        message.error("文件解析失败：" + (err instanceof Error ? err.message : "未知错误"));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  // 切换Sheet
  const handleSheetChange = useCallback(
    (name: string) => {
      if (!workbook) return;
      setActiveSheet(name);
      const result = analyzeSheet(workbook, name);
      setAnalysis(result);

      const ws = workbook.Sheets[name];
      const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      setRawData(raw);
    },
    [workbook]
  );

  // 确认列映射
  const handleMappingConfirm = useCallback((mapping: Record<string, string>) => {
    setColumnMapping(mapping);

    // 推断字段类型
    if (analysis) {
      const records = sheetToRecords(rawData, analysis.headers, analysis.dataStartRow);
      const types = inferFieldTypes(records, analysis.headers);
      setFieldTypes(types);
    }

    setCurrentStep(3); // 修复：从步骤2跳到步骤3（确认导入）
  }, [analysis, rawData]);

  // 确认导入
  const handleImport = useCallback(async () => {
    if (!analysis || !file) return;
    setLoading(true);
    try {
      const records = sheetToRecords(rawData, analysis.headers, analysis.dataStartRow);

      // 构建数据集对象
      const dataset: Dataset = {
        id: `ds-${Date.now()}`,
        projectId: "",
        name: file.name.replace(/\.[^.]+$/, ""),
        sourceFile: file.name,
        importSchemeId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rowCount: records.length,
        schema: {
          fields: analysis.headers.map((h) => ({
            name: h,
            type: fieldTypes[h] || "text",
            displayName: columnMapping[h] || h,
            format: undefined,
          })),
        },
      };

      const scheme: ImportScheme = {
        id: `scheme-${Date.now()}`,
        name: `${dataset.name} 导入方案`,
        tableType: analysis.tableType,
        headerRows: analysis.headerRowCount,
        dataStartRow: analysis.dataStartRow,
        columnMapping,
        fieldTypes,
        createdAt: new Date().toISOString(),
      };

      await onImportComplete(dataset, records, scheme);
    } catch (err) {
      message.error("导入失败：" + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setLoading(false);
    }
  }, [analysis, file, rawData, columnMapping, fieldTypes, onImportComplete]);

  const steps = [
    { title: "上传文件", description: file?.name || "选择Excel文件" },
    { title: "数据预览", description: analysis ? `检测到：${analysis.tableType}` : "解析中..." },
    { title: "列映射", description: `已映射 ${Object.keys(columnMapping).length} 列` },
    { title: "确认导入", description: "保存数据" },
  ];

  return (
    <div>
      <Title level={5} style={{ marginBottom: 24 }}>
        Excel 智能导入
      </Title>

      <Steps current={currentStep} style={{ marginBottom: 24 }} items={steps} />

      {/* 步骤0：上传/解析 */}
      {currentStep === 0 && (
        <Card>
          <Text>已选择文件：</Text>
          <Text strong>{file?.name}</Text>
          <Text type="secondary"> ({((file?.size || 0) / 1024).toFixed(1)} KB)</Text>
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button type="primary" icon={<UploadOutlined />} onClick={handleFileParse} loading={loading}>
                解析文件
              </Button>
              <Button onClick={onCancel}>取消</Button>
            </Space>
          </div>
        </Card>
      )}

      {/* 步骤1：数据预览 + Sheet切换 */}
      {currentStep === 1 && analysis && (
        <div>
          <SheetSelector
            sheetNames={sheetNames}
            activeSheet={activeSheet}
            onChange={handleSheetChange}
          />
          <DataPreview
            headers={analysis.headers}
            data={rawData}
            tableType={analysis.tableType}
            headerRowCount={analysis.headerRowCount}
            dataStartRow={analysis.dataStartRow}
            mergedCells={analysis.mergedCells}
            loading={loading}
          />
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button type="primary" onClick={() => setCurrentStep(2)}>
                下一步：配置列映射
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* 步骤2：列映射 */}
      {currentStep === 2 && analysis && (
        <div>
          <ColumnMapper
            key={analysis.headers.join("|")}
            headers={analysis.headers}
            onConfirm={handleMappingConfirm}
          />
        </div>
      )}

      {/* 步骤3：确认导入 */}
      {currentStep === 3 && analysis && (
        <Card>
          <Title level={5}>导入确认</Title>
          <div style={{ marginBottom: 16 }}>
            <Text>数据集名称：</Text>
            <Text strong>{file?.name?.replace(/\.[^.]+$/, "")}</Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text>数据行数：</Text>
            <Text strong>
              {sheetToRecords(rawData, analysis.headers, analysis.dataStartRow).length}
            </Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text>列映射：</Text>
            <Text strong>
              {Object.keys(columnMapping).length} / {analysis.headers.length} 列
            </Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Text>表格类型：</Text>
            <Text strong>{analysis.tableType}</Text>
          </div>
          <div>
            <Space>
              <Button onClick={() => setCurrentStep(2)}>上一步</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleImport} loading={loading}>
                确认导入
              </Button>
            </Space>
          </div>
        </Card>
      )}
    </div>
  );
}
