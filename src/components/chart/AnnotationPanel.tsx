import { Switch, InputNumber, Divider, Typography } from 'antd';
import type { AnnotationConfig } from '@/components/chart/chartConfigs/types';

const { Text } = Typography;

interface AnnotationPanelProps {
  config: AnnotationConfig;
  onChange: (config: AnnotationConfig) => void;
}

export default function AnnotationPanel({ config, onChange }: AnnotationPanelProps) {
  const update = (patch: Partial<AnnotationConfig>) => {
    onChange({ ...config, ...patch });
  };

  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 8 }}>标注设置</Text>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text>标注最大值</Text>
        <Switch size="small" checked={config.markMax} onChange={(v) => update({ markMax: v })} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text>标注最小值</Text>
        <Switch size="small" checked={config.markMin} onChange={(v) => update({ markMin: v })} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text>平均值线</Text>
        <Switch size="small" checked={config.markAverage} onChange={(v) => update({ markAverage: v })} />
      </div>

      <Divider style={{ margin: '12px 0' }} />
      <Text strong style={{ display: 'block', marginBottom: 8 }}>自定义标注</Text>

      <div style={{ marginBottom: 8 }}>
        <Text>目标线（Y 轴值）</Text>
        <div style={{ marginTop: 4 }}>
          <InputNumber
            style={{ width: '100%' }}
            size="small"
            placeholder="不填写则不显示"
            value={config.markTarget}
            onChange={(v) => update({ markTarget: v ?? undefined })}
          />
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Text>预警区间</Text>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <InputNumber
            style={{ flex: 1 }}
            size="small"
            placeholder="下界"
            value={config.warnRangeLower}
            onChange={(v) => update({ warnRangeLower: v ?? undefined })}
          />
          <InputNumber
            style={{ flex: 1 }}
            size="small"
            placeholder="上界"
            value={config.warnRangeUpper}
            onChange={(v) => update({ warnRangeUpper: v ?? undefined })}
          />
        </div>
      </div>
    </div>
  );
}
