import { useMemo } from "react";
import { Table, Tag, Typography } from "antd";
import { MergeCell, TableType } from "@/types";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

const TABLE_TYPE_LABELS: Record<TableType, string> = {
  normal: "普通表格",
  multiheader: "多级表头",
  pivot: "交叉表",
  merged: "合并单元格",
  complex: "复杂表格",
};

interface DataPreviewProps {
  headers: string[];
  data: any[][];
  tableType: TableType;
  headerRowCount: number;
  dataStartRow: number;
  mergedCells: MergeCell[];
  loading?: boolean;
}

export default function DataPreview({
  headers,
  data,
  tableType,
  headerRowCount,
  dataStartRow,
  mergedCells,
  loading,
}: DataPreviewProps) {
  const columns: ColumnsType<Record<string, any>> = useMemo(
    () =>
      headers.map((h, i) => ({
        title: (
          <span>
            {h}
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              第 {i + 1} 列
            </Text>
          </span>
        ),
        dataIndex: h,
        key: `col-${i}-${h}`,
        ellipsis: { showTitle: true },
        width: 120,
        render: (text: any) => {
          const displayVal = text ?? "";
          return <span title={String(displayVal)}>{String(displayVal)}</span>;
        },
      })),
    [headers, data, dataStartRow]
  );

  const dataSource = useMemo(
    () =>
      data.slice(dataStartRow).map((row, idx) => {
        const record: Record<string, any> = { _key: idx };
        headers.forEach((h, i) => {
          record[h] = row[i] !== undefined ? row[i] : "";
        });
        return record;
      }),
    [data, dataStartRow]
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Tag color="purple">{TABLE_TYPE_LABELS[tableType]}</Tag>
        <Tag>表头行数：{headerRowCount}</Tag>
        <Tag>数据起始行：第 {dataStartRow + 1} 行</Tag>
        <Tag>数据行数：{dataSource.length}</Tag>
        {mergedCells.length > 0 && (
          <Tag color="orange">合并单元格：{mergedCells.length} 处</Tag>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="_key"
        size="small"
        loading={loading}
        scroll={{ x: "max-content", y: 400 }}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          pageSizeOptions: ["20", "50", "100"],
          showTotal: (total) => `共 ${total} 行`,
        }}
      />
    </div>
  );
}
