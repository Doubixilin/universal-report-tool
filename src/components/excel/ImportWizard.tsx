import { useState, useCallback } from "react";
import { Steps, Button, message, Space, Card, Typography, Alert } from "antd";
import { UploadOutlined, SaveOutlined, HistoryOutlined } from "@ant-design/icons";
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
import ImportHistoryPanel from "./ImportHistoryPanel";
import { generateFingerprint, type ImportHistoryRecord } from "@/services/importHistory";

const { Title, Text } = Typography;

interface ImportWizardProps {
  file: File | null;
  projectId: string;
  onImportComplete: (
    dataset: Dataset,
    records: Array<Record<string, any>>,
    scheme: ImportScheme
  ) => Promise<void>;
  onCancel: () => void;
}

export default function ImportWizard({ file, projectId, onImportComplete, onCancel }: ImportWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [analysis, setAnalysis] = useState<SheetAnalysisResult | null>(null);
  const [rawData, setRawData] = useState<any[][]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [fieldTypes, setFieldTypes] = useState<Record<string, FieldConfig["type"]>>({});
  const [loading, setLoading] = useState(false);
  const [matchedHistory, setMatchedHistory] = useState<ImportHistoryRecord | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // 步骤1：解析文件
  const handleFileParse = useCallback(async () => {
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
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

        // 检查是否有匹配的历史配置
        const fingerprint = generateFingerprint(result.headers);
        try {
          const { findByFingerprint } = await import('@/services/importHistory');
          const match = await findByFingerprint(fingerprint, projectId);
          if (match) {
            setMatchedHistory(match);
            message.info(`检测到相同结构的文件「${match.filename}」，可一键复用列映射`);
          }
        } catch {
          // import_history 表可能不存在，忽略
        }

        setCurrentStep(1);
        message.success(`解析成功！共 ${names.length} 个工作表`);
      } catch (err) {
        message.error("文件解析失败：" + (err instanceof Error ? err.message : "未知错误"));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file, projectId]);

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

      // 保存导入历史
      try {
        const { saveImportHistory, generateFingerprint } = await import('@/services/importHistory');
        await saveImportHistory({
          filename: file.name,
          sheetName: activeSheet,
          columnMapping,
          fieldTypes,
          dataSummary: { rowCount: records.length, columns: analysis.headers.length },
          fingerprint: generateFingerprint(analysis.headers),
          projectId,
        });
      } catch {
        // 静默处理，不影响主流程
      }

      await onImportComplete(dataset, records, scheme);
    } catch (err) {
      message.error("导入失败：" + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setLoading(false);
    }
  }, [analysis, file, rawData, columnMapping, fieldTypes, activeSheet, projectId, onImportComplete]);

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

          {matchedHistory && (
            <Alert
              style={{ marginTop: 16 }}
              message="检测到相同结构的历史导入"
              description={
                <div>
                  <Text>文件名：{matchedHistory.filename} | 工作表：{matchedHistory.sheetName}</Text>
                  <br />
                  <Text>数据：{matchedHistory.dataSummary.rowCount} 行 × {matchedHistory.dataSummary.columns} 列</Text>
                  <br />
                  <Text>列映射：{Object.keys(matchedHistory.columnMapping).length} 列</Text>
                  <div style={{ marginTop: 8 }}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<HistoryOutlined />}
                      onClick={() => {
                        setColumnMapping(matchedHistory.columnMapping);
                        setFieldTypes(matchedHistory.fieldTypes as Record<string, FieldConfig["type"]>);
                        message.success('已复用历史列映射配置');
                      }}
                    >
                      一键复用列映射
                    </Button>
                  </div>
                </div>
              }
              type="success"
              showIcon
              closable
            />
          )}

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
          {showHistory ? (
            <div>
              <div style={{ marginBottom: 12 }}>
                <Button onClick={() => setShowHistory(false)}>返回导入流程</Button>
              </div>
              <ImportHistoryPanel
                projectId={projectId}
                onReuse={(record) => {
                  setColumnMapping(record.columnMapping);
                  setFieldTypes(record.fieldTypes as Record<string, FieldConfig["type"]>);
                  message.success('已复用历史配置，可继续调整');
                  setShowHistory(false);
                }}
              />
            </div>
          ) : (
            <>
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
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={() => setShowHistory(true)} icon={<HistoryOutlined />}>
                  查看导入历史
                </Button>
                <Space>
                  <Button onClick={() => setCurrentStep(0)}>上一步</Button>
                  <Button type="primary" onClick={() => setCurrentStep(2)}>
                    下一步：配置列映射
                  </Button>
                </Space>
              </div>
            </>
          )}
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
