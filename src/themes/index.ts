import { themeManager } from './themeManager';
import { partyRedTheme } from './partyRed';
import { businessBlueTheme } from './businessBlue';
import { techPurpleTheme } from './techPurple';
import { ecoGreenTheme } from './ecoGreen';
import { luxuryGoldTheme } from './luxuryGold';
import { excelCompatibleTheme } from './excelCompatible';

export * from './themeManager';
export * from './types';

const BUILTIN_THEMES = [
  { name: 'party-red', theme: partyRedTheme, label: '党建红', description: '适用于党政报告', primaryColor: '#C41E24' },
  { name: 'business-blue', theme: businessBlueTheme, label: '商务蓝', description: '适用于商业报告', primaryColor: '#1E6FDC' },
  { name: 'tech-purple', theme: techPurpleTheme, label: '科技紫', description: '适用于科技创新报告', primaryColor: '#6C5CE7' },
  { name: 'eco-green', theme: ecoGreenTheme, label: '环保绿', description: '适用于可持续发展报告', primaryColor: '#27AE60' },
  { name: 'luxury-gold', theme: luxuryGoldTheme, label: '高端金', description: '适用于金融高端报告', primaryColor: '#B8860B' },
  { name: 'excel-compatible', theme: excelCompatibleTheme, label: 'Excel 兼容', description: '配色接近 Office 默认', primaryColor: '#4472C4' },
];

/** 在应用初始化时调用，注册所有内置主题 */
export function initThemes(): void {
  for (const { name, theme, label, description } of BUILTIN_THEMES) {
    themeManager.register(name, theme, {
      name,
      label,
      description,
      category: 'built-in',
      color: theme.color,
      isDefault: name === 'business-blue',
    });
  }
}

/** 获取默认主题名称 */
export const DEFAULT_THEME = 'business-blue';
