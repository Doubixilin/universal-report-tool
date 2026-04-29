//! Excel 图表生成 Tauri Command（完整实现）

use std::path::Path;

use crate::models::chart_data::{ChartDataRequest, ChartGenerationResponse};
use crate::services::chart_generator::generate_excel_with_chart;

/// 数据大小限制常量
const MAX_CATEGORIES: usize = 50_000;
const MAX_SERIES: usize = 100;
const MAX_VALUES_PER_SERIES: usize = 50_000;

/// 生成包含可编辑图表的 Excel 文件（异步版本，不阻塞 UI）
///
/// 前端调用方式：
/// ```typescript
/// const result = await invoke('generate_excel_chart', {
///   filepath: 'C:/output/report.xlsx',
///   request: {
///     title: '月度销售报表',
///     chartType: 'barChart',
///     categories: ['1月', '2月', '3月'],
///     series: [{ name: '销售额', values: [100, 200, 150], color: '#C41E24' }],
///   }
/// });
/// ```
#[tauri::command]
pub async fn generate_excel_chart(
    filepath: String,
    request: ChartDataRequest,
) -> Result<ChartGenerationResponse, String> {
    // 参数基础校验（快速，无需异步）
    if request.title.is_empty() {
        return Err("图表标题不能为空".to_string());
    }
    if request.categories.is_empty() {
        return Err("分类标签不能为空".to_string());
    }
    if request.series.is_empty() {
        return Err("数据系列不能为空".to_string());
    }

    // 校验系列数据长度与分类数量一致
    for (idx, series) in request.series.iter().enumerate() {
        if series.values.len() != request.categories.len() {
            return Err(format!(
                "第 {} 个系列的数据点数量（{}）与分类数量（{}）不一致",
                idx + 1,
                series.values.len(),
                request.categories.len()
            ));
        }
    }

    // 校验文件路径
    if filepath.is_empty() {
        return Err("文件路径不能为空".to_string());
    }
    if !filepath.ends_with(".xlsx") {
        return Err("文件路径必须以 .xlsx 结尾".to_string());
    }

    // 路径安全校验：canonicalize 防止路径穿越
    let path = Path::new(&filepath);
    let canonical = std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    let path_str = canonical.to_string_lossy().to_lowercase();
    // 禁止写入系统目录
    let blocked = ["\\windows\\", "\\system32", "/etc/", "/usr/bin/", "/bin/"];
    for b in &blocked {
        if path_str.contains(b) {
            return Err("不允许写入系统目录".to_string());
        }
    }

    // 校验数据大小限制
    if request.categories.len() > MAX_CATEGORIES {
        return Err(format!(
            "分类数量（{}）超过限制（{}）",
            request.categories.len(),
            MAX_CATEGORIES
        ));
    }
    if request.series.len() > MAX_SERIES {
        return Err(format!(
            "数据系列数量（{}）超过限制（{}）",
            request.series.len(),
            MAX_SERIES
        ));
    }

    // 校验数值有效性（NaN/Infinity）及数据大小
    for (idx, series) in request.series.iter().enumerate() {
        if series.values.len() > MAX_VALUES_PER_SERIES {
            return Err(format!(
                "第 {} 个系列的数据点数量（{}）超过限制（{}）",
                idx + 1,
                series.values.len(),
                MAX_VALUES_PER_SERIES
            ));
        }
        for (vidx, &val) in series.values.iter().enumerate() {
            if !val.is_finite() {
                return Err(format!(
                    "第 {} 个系列第 {} 个数据值无效（NaN 或 Infinity）",
                    idx + 1,
                    vidx + 1
                ));
            }
        }
    }

    // 在阻塞线程中执行文件 I/O，避免阻塞 Tauri 异步运行时
    let filepath_clone = filepath.clone();
    let result = tauri::async_runtime::spawn_blocking(move || {
        generate_excel_with_chart(&filepath_clone, &request)
    })
    .await
    .map_err(|e| format!("任务执行失败: {}", e))?;

    match result {
        Ok(()) => Ok(ChartGenerationResponse {
            success: true,
            message: format!("Excel 文件已生成: {}", filepath),
        }),
        Err(err) => Err(format!("图表生成失败: {}", err)),
    }
}
