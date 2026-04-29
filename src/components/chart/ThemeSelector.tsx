import { Select } from 'antd';
import { themeManager, type ThemeRecord } from '@/themes';

interface ThemeSelectorProps {
  value?: string;
  onChange?: (theme: string) => void;
}

/** 扩展选项类型，携带完整主题信息 */
interface ThemeOptionItem {
  value: string;
  label: string;
  themeRecord: ThemeRecord;
}

/** 渲染主题选项的标签内容（带颜色预览） */
function renderOption(record: ThemeRecord) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
        {record.color.slice(0, 4).map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c }} />
        ))}
      </div>
      <span>{record.label}</span>
      {record.isDefault && (
        <span style={{ fontSize: 10, color: '#999' }}>默认</span>
      )}
    </div>
  );
}

export default function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const themes = themeManager.listThemes();

  const options: ThemeOptionItem[] = themes.map((t) => ({
    value: t.name,
    label: t.label,
    themeRecord: t,
  }));

  return (
    <Select
      style={{ width: '100%' }}
      value={value ?? themeManager.getCurrentTheme()}
      onChange={onChange}
      optionFilterProp="label"
      options={options}
      optionRender={(option) => renderOption(option.data.themeRecord)}
    />
  );
}
