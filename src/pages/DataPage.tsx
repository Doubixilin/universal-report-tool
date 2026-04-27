import { useState, useCallback } from "react";
import { Card, Button, Table, Empty, Upload, Tabs, Typography, Modal, message } from "antd";
import { UploadOutlined, DatabaseOutlined, PlusOutlined } from "@ant-design/icons";
import { useDataStore } from "@/stores/dataStore";
import { getDatabase } from "@/database";
import { Dataset, DataRecord, ImportScheme } from "@/types";
import ImportWizard from "@/components/excel/ImportWizard";

const { Title } = Typography;

export default function DataPage() {
  const { datasets, currentDataset, currentRecords, setCurrentDataset, setCurrentRecords, setDatasets } = useDataStore();
  const [activeTab, setActiveTab] = useState("datasets");
  const [importing, setImporting] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUploadExcel = (file: File) => {
    setPendingFile(file);
    setImporting(true);
    return false; // 阻止自动上传
  };

  const handleCancelImport = () => {
    setImporting(false);
    setPendingFile(null);
  };

  // 导入完成：保存数据集和记录到SQLite
  const handleImportComplete = useCallback(
    async (
      dataset: Dataset,
      records: Array<Record<string, any>>,
      scheme: ImportScheme
    ) => {
      setLoading(true);
      try {
        const db = await getDatabase();

        // FIX 1: 确保有一个默认项目存在（解决外键约束）
        const defaultProjectId = "default-project";
        const projects = await db.select<Array<{ id: string }>>(
          "SELECT id FROM projects WHERE id = $1",
          [defaultProjectId]
        );
        if (!projects || projects.length === 0) {
          await db.execute(
            `INSERT INTO projects (id, name, description, storage_type, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [defaultProjectId, "默认项目", "自动创建的默认项目", "sqlite", new Date().toISOString(), new Date().toISOString()]
          );
        }

        // FIX 3: 开启事务
        await db.execute("BEGIN TRANSACTION", []);

        try {
          // 先插入 import_scheme
          await db.execute(
            `INSERT INTO import_schemes (id, name, table_type, header_rows, data_start_row, column_mapping, field_types, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              scheme.id,
              scheme.name,
              scheme.tableType,
              scheme.headerRows,
              scheme.dataStartRow,
              JSON.stringify(scheme.columnMapping),
              JSON.stringify(scheme.fieldTypes),
              scheme.createdAt,
            ]
          );

          // 再插入 dataset（使用真实 project_id）
          await db.execute(
            `INSERT INTO datasets (id, project_id, name, source_file, import_scheme_id, created_at, updated_at, row_count, schema_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              dataset.id,
              defaultProjectId,
              dataset.name,
              dataset.sourceFile,
              scheme.id,
              dataset.createdAt,
              dataset.updatedAt,
              dataset.rowCount,
              JSON.stringify(dataset.schema),
            ]
          );

          // 逐条插入数据记录
          for (let i = 0; i < records.length; i++) {
            const recordId = `rec-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`;
            await db.execute(
              `INSERT INTO dataset_records (id, dataset_id, row_index, data_json, created_at)
               VALUES ($1, $2, $3, $4, $5)`,
              [recordId, dataset.id, i, JSON.stringify(records[i]), new Date().toISOString()]
            );
          }

          // 提交事务
          await db.execute("COMMIT", []);
        } catch (txErr) {
          // 出错则回滚
          await db.execute("ROLLBACK", []);
          throw txErr;
        }

        // 刷新列表
        const rows = await db.select<Array<Dataset>>("SELECT * FROM datasets ORDER BY created_at DESC");
        setDatasets(rows || []);

        Modal.success({
          title: "导入成功",
          content: `已导入 ${records.length} 行数据，${Object.keys(scheme.columnMapping).length} 列映射`,
        });

        setImporting(false);
        setPendingFile(null);
        setActiveTab("datasets");
      } catch (err) {
        message.error("保存失败：" + (err instanceof Error ? err.message : "未知错误"));
      } finally {
        setLoading(false);
      }
    },
    [setDatasets]
  );

  // 加载数据列表
  const handleLoadDatasets = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const rows = await db.select<Array<Dataset>>("SELECT * FROM datasets ORDER BY created_at DESC");
      setDatasets(rows || []);
    } catch (err) {
      // BUG 7 FIX: 错误反馈给用户
      message.error("加载数据列表失败：" + (err instanceof Error ? err.message : "未知错误"));
    } finally {
      setLoading(false);
    }
  }, [setDatasets]);

  // 选择数据集并加载记录
  const handleSelectDataset = useCallback(
    async (dataset: Dataset) => {
      setCurrentDataset(dataset);
      setLoading(true);
      try {
        const db = await getDatabase();
        const rows = await db.select<DataRecord[]>(
          "SELECT * FROM dataset_records WHERE dataset_id = $1 ORDER BY row_index ASC",
          [dataset.id]
        );
        setCurrentRecords(rows || []);
      } catch {
        setCurrentRecords([]);
      } finally {
        setLoading(false);
      }
    },
    [setCurrentDataset, setCurrentRecords]
  );

  // BUG 1 FIX: Ant Design v5 使用 items API，不再使用 TabPane
  const tabItems = [
    {
      key: "datasets",
      label: "数据集列表",
      children: (
        <>
          <div style={{ marginBottom: 12 }}>
            <Button size="small" icon={<PlusOutlined />} onClick={handleLoadDatasets}>
              刷新列表
            </Button>
          </div>
          {datasets.length === 0 ? (
            <Empty
              description="暂无数据集，请导入Excel文件"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              dataSource={datasets}
              rowKey="id"
              loading={loading}
              columns={[
                {
                  title: "名称",
                  dataIndex: "name",
                  key: "name",
                  render: (text: string, record: Dataset) => (
                    <a onClick={() => handleSelectDataset(record)}>{text}</a>
                  ),
                },
                { title: "来源文件", dataIndex: "sourceFile", key: "sourceFile" },
                { title: "行数", dataIndex: "rowCount", key: "rowCount" },
                { title: "创建时间", dataIndex: "createdAt", key: "createdAt" },
              ]}
            />
          )}
        </>
      ),
    },
    {
      key: "preview",
      label: "数据预览",
      children: currentDataset ? (
        <Card title={`数据集：${currentDataset.name}`} extra={<span>共 {currentRecords.length} 行</span>}>
          <Table
            dataSource={currentRecords.map((r, i) => ({ ...r.data, _rowIndex: i }))}
            // BUG 2 + 8 FIX: 使用稳定行索引作为 key，避免 Math.random() 导致全量重渲染
            rowKey="_rowIndex"
            size="small"
            scroll={{ x: "max-content", y: 400 }}
            loading={loading}
            pagination={{ pageSize: 20 }}
          />
        </Card>
      ) : (
        <Empty description="请从数据集列表选择一个数据集" />
      ),
    },
    {
      key: "schemes",
      label: "导入方案",
      children: <Empty description="导入方案管理（待实现）" />,
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          <DatabaseOutlined style={{ marginRight: 8 }} />
          数据管理
        </Title>
        <Upload
          beforeUpload={handleUploadExcel}
          accept=".xlsx,.xls,.csv"
          showUploadList={false}
        >
          <Button type="primary" icon={<UploadOutlined />}>
            导入Excel
          </Button>
        </Upload>
      </div>

      {/* 导入向导弹窗 */}
      <Modal
        open={importing}
        onCancel={handleCancelImport}
        footer={null}
        width={1200}
        closable={false}
        destroyOnClose
      >
        {pendingFile && (
          <ImportWizard
            file={pendingFile}
            onImportComplete={handleImportComplete}
            onCancel={handleCancelImport}
          />
        )}
      </Modal>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
}
