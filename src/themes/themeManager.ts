import * as echarts from 'echarts';
import type { EChartsTheme } from './types';
import { invoke } from '@tauri-apps/api/core';

/** 主题记录 */
export interface ThemeRecord {
  id: string;
  name: string;
  label: string;
  description?: string;
  category: 'built-in' | 'custom';
  color: string[];
  isDefault: boolean;
}

/**
 * 主题管理器 — 单例模式
 */
class ThemeManager {
  private static instance: ThemeManager;
  private themes: Map<string, EChartsTheme> = new Map();
  private themeRecords: Map<string, ThemeRecord> = new Map();
  private currentTheme: string = 'business-blue';

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /** 注册主题 */
  register(name: string, theme: EChartsTheme, record: Omit<ThemeRecord, 'id'>): void {
    this.themes.set(name, theme);
    this.themeRecords.set(name, { ...record, id: name });
    echarts.registerTheme(name, theme);
  }

  /** 获取主题 ECharts 配置 */
  getTheme(name: string): EChartsTheme | undefined {
    return this.themes.get(name);
  }

  /** 获取主题记录 */
  getThemeRecord(name: string): ThemeRecord | undefined {
    return this.themeRecords.get(name);
  }

  /** 获取当前主题名称 */
  getCurrentTheme(): string {
    return this.currentTheme;
  }

  /** 切换主题 */
  switchTheme(name: string): boolean {
    if (!this.themes.has(name)) {
      console.warn(`Theme "${name}" not registered`);
      return false;
    }
    this.currentTheme = name;
    return true;
  }

  /** 列出所有已注册主题的记录 */
  listThemes(): ThemeRecord[] {
    return Array.from(this.themeRecords.values());
  }

  /** 初始化 ECharts 实例时使用的主题名 */
  getInitThemeName(): string {
    return this.currentTheme;
  }

  /** 保存当前主题到数据库（用户偏好） */
  async savePreference(): Promise<void> {
    try {
      await invoke('run_sql', {
        sql: "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('default_chart_theme', $1)",
        params: [this.currentTheme],
      });
    } catch {
      // 静默失败，不影响功能
    }
  }

  /** 从数据库加载用户偏好主题 */
  async loadPreference(): Promise<string | null> {
    try {
      const rows = await invoke<any[]>('run_sql', {
        sql: "SELECT value FROM app_settings WHERE key = 'default_chart_theme'",
        params: [],
      });
      if (rows?.[0]?.value) {
        const themeName = rows[0].value;
        if (this.themes.has(themeName)) {
          this.currentTheme = themeName;
          return themeName;
        }
      }
    } catch {
      // 静默失败，使用默认主题
    }
    return null;
  }
}

export const themeManager = ThemeManager.getInstance();
