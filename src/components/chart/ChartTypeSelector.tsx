import { Select } from "antd";
import { CHART_TYPE_GROUPS } from "./chartConfigs/chartTypeToGenerator";
import type { ChartTypeKind } from "@/types/chart";

interface ChartTypeSelectorProps {
  value: ChartTypeKind;
  onChange: (value: ChartTypeKind) => void;
}

export default function ChartTypeSelector({ value, onChange }: ChartTypeSelectorProps) {
  return (
    <Select
      style={{ width: "100%" }}
      value={value}
      onChange={onChange}
      listHeight={400}
    >
      {CHART_TYPE_GROUPS.map((group) => (
        <Select.OptGroup key={group.label} label={group.label}>
          {group.options.map((opt) => (
            <Select.Option key={opt.key} value={opt.key}>
              {opt.label}
            </Select.Option>
          ))}
        </Select.OptGroup>
      ))}
    </Select>
  );
}
