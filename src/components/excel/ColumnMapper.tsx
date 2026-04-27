import { Table, Select, Button, Space, Tag, Typography, message } from "antd";
import { CheckOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useState, useMemo } from "react";
import { matchFieldName, FIELD_SYNONYMS } from "@/utils/synonymDict";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

interface ColumnMapperProps {
  headers: string[];
  initialMapping?: Record<string, string>;
  onConfirm: (mapping: Record<string, string>) => void;
}

interface MappingRecord {
  key: string;
  sourceColumn: string;
  matchedField: string | null;
  targetField: string;
  confidence: "high" | "low";
}

const KNOWN_FIELDS = Object.keys(FIELD_SYNONYMS);

export default function ColumnMapper({
  headers,
  initialMapping,
  onConfirm,
}: ColumnMapperProps) {
  const [mappings, setMappings] = useState<MappingRecord[]>(() =>
    headers.map((header) => {
      const matched = matchFieldName(header);
      const confidence: MappingRecord["confidence"] = matched ? "high" : "low";
      return {
        key: header,
        sourceColumn: header,
        matchedField: matched,
        targetField: initialMapping?.[header] || matched || header, // FIX: 默认使用源列名
        confidence,
      };
    })
  );

  // 自动映射覆盖率
  const coverage = useMemo(() => {
    const mapped = mappings.filter((m) => m.targetField && KNOWN_FIELDS.includes(m.targetField)).length;
    return headers.length > 0 ? Math.round((mapped / headers.length) * 100) : 0;
  }, [mappings, headers.length]);

  const handleTargetChange = (key: string, value: string) => {
    setMappings((prev) =>
      prev.map((m) =>
        m.key === key ? { ...m, targetField: value, confidence: value ? "high" : "low" } : m
      )
    );
  };

  const handleAutoMatch = () => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.confidence === "high" && KNOWN_FIELDS.includes(m.targetField)) return m;
        const matched = matchFieldName(m.sourceColumn);
        return {
          ...m,
          matchedField: matched,
          targetField: matched || m.sourceColumn, // FIX: 无匹配时用源列名
          confidence: matched ? "high" : "low",
        };
      })
    );
    message.success("已自动匹配列名");
  };

  const handleConfirm = () => {
    const mapping: Record<string, string> = {};
    mappings.forEach((m) => {
      if (m.targetField) {
        mapping[m.sourceColumn] = m.targetField;
      }
    });
    message.success(`已确认 ${Object.keys(mapping).length} 列映射`);
    onConfirm(mapping);
  };

  const columns: ColumnsType<MappingRecord> = [
    {
      title: "源列名",
      dataIndex: "sourceColumn",
      key: "sourceColumn",
      width: 200,
      ellipsis: true,
    },
    {
      title: "匹配结果",
      dataIndex: "confidence",
      key: "confidence",
      width: 100,
      render: (confidence: MappingRecord["confidence"]) => {
        const map: Record<string, { color: string; label: string }> = {
          high: { color: "green", label: "已匹配" },
          low: { color: "default", label: "未匹配" },
        };
        const { color, label } = map[confidence];
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "目标字段",
      dataIndex: "targetField",
      key: "targetField",
      render: (_, record) => {
        const mappedTargets = mappings.filter((m) => m.targetField && m.key !== record.key).map((m) => m.targetField);
        return (
          <Select
            style={{ width: "100%" }}
            placeholder="选择或输入字段名"
            allowClear
            value={record.targetField || undefined}
            onChange={(val) => handleTargetChange(record.key, val)}
            showSearch
            // FIX: 允许用户输入自定义字段名（不在词典中的列）
            tagRender={(props) => (
              <Tag color="blue" style={{ margin: 2 }}>{props.label}</Tag>
            )}
            options={[
              ...KNOWN_FIELDS.map((f) => ({
                label: f,
                value: f,
                disabled: mappedTargets.includes(f),
              })),
              // 添加源列名作为备选
              ...headers.filter((h) => !KNOWN_FIELDS.includes(h)).map((h) => ({
                label: h,
                value: h,
              })),
            ]}
          />
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text strong>列映射编辑器</Text>
          <Tag color="cyan">智能匹配 {coverage}%</Tag>
        </div>
        <Space>
          <Button icon={<ThunderboltOutlined />} onClick={handleAutoMatch}>
            自动匹配
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleConfirm}
          >
            确认映射
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={mappings}
        rowKey="key"
        size="small"
        pagination={false}
        scroll={{ y: 300 }}
      />
    </div>
  );
}
