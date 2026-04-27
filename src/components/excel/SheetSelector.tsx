import { Select, Tag } from "antd";
import { FileExcelOutlined } from "@ant-design/icons";

interface SheetSelectorProps {
  sheetNames: string[];
  activeSheet: string;
  onChange: (name: string) => void;
}

export default function SheetSelector({
  sheetNames,
  activeSheet,
  onChange,
}: SheetSelectorProps) {
  if (sheetNames.length === 0) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <Tag icon={<FileExcelOutlined />} color="green">
        Excel 文件
      </Tag>
      <span style={{ color: "#666", fontSize: 13 }}>工作表：</span>
      <Select
        style={{ width: 200 }}
        value={activeSheet}
        onChange={onChange}
        options={sheetNames.map((name) => ({ label: name, value: name }))}
      />
      <Tag color="blue">共 {sheetNames.length} 个工作表</Tag>
    </div>
  );
}
