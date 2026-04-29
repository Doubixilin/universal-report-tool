//! Excel 图表生成核心服务
//! 使用 umya-spreadsheet 创建包含可编辑图表的 .xlsx 文件

use std::path::Path;
use umya_spreadsheet::{new_file, writer::xlsx::write};

use crate::models::chart_data::ChartDataRequest;
use crate::utils::chart_type_mapper::map_chart_type;

/// 生成包含图表的 Excel 文件
///
/// # 参数
/// - `filepath`: 输出文件路径
/// - `request`: 图表数据请求
///
/// # 返回值
/// - `Ok(())`: 生成成功
/// - `Err(String)`: 生成失败，返回错误信息
pub fn generate_excel_with_chart(
    filepath: &str,
    request: &ChartDataRequest,
) -> Result<(), String> {
    // 1. 创建工作簿
    let mut book = new_file();
    let sheet = book
        .get_sheet_by_name_mut("Sheet1")
        .ok_or_else(|| "获取工作表失败: 找不到 Sheet1".to_string())?;

    let data_row_count = request.categories.len();
    let series_count = request.series.len();
    let last_row = data_row_count + 1;

    // 2. 写入表头行（第 1 行：A1=分类列标题，B1起=各系列名称）
    sheet
        .get_cell_mut("A1")
        .set_value(&request.x_axis_title.clone().unwrap_or_else(|| "类别".to_string()));

    for (idx, series) in request.series.iter().enumerate() {
        let col = col_letter(idx + 1); // B=1, C=2, ...
        let cell_ref = format!("{}1", col);
        sheet.get_cell_mut(cell_ref.as_str()).set_value(&series.name);
    }

    // 3. 写入数据行（第 2 行起）
    for (cat_idx, category) in request.categories.iter().enumerate() {
        let row = cat_idx + 2;

        // A 列：分类标签
        let cat_ref = format!("A{}", row);
        sheet.get_cell_mut(cat_ref.as_str()).set_value(category);

        // B 列起：各系列数据
        for (series_idx, series) in request.series.iter().enumerate() {
            let col = col_letter(series_idx + 1);
            let val = series.values.get(cat_idx).copied().unwrap_or_else(|| {
                debug_assert!(false, "series[{}] 缺少 cat_idx={} 的数据，命令层应已校验", series_idx, cat_idx);
                0.0
            });
            let val_ref = format!("{}{}", col, row);
            // umya-spreadsheet 的 set_value 会自动识别数字字符串并存储为数值类型
            sheet.get_cell_mut(val_ref.as_str()).set_value(val.to_string());
        }
    }

    // 4. 构建数据系列引用（绝对引用格式）
    // 对于 bar/line/area/radar/pie/doughnut 图表：
    //   第一个引用是分类列（A列），后续是各数据列
    let mut ref_strings: Vec<String> = Vec::new();
    ref_strings.push(format!("Sheet1!$A$2:$A${}", last_row));
    for idx in 0..series_count {
        let col = col_letter(idx + 1);
        ref_strings.push(format!("Sheet1!${}$2:${}${}", col, col, last_row));
    }

    let series_strs: Vec<&str> = ref_strings.iter().map(|s| s.as_str()).collect();

    // 5. 创建图表
    let chart_type = map_chart_type(&request.chart_type);

    // 图表位置：从 D2 开始，根据数据量动态计算大小
    let mut from_marker =
        umya_spreadsheet::structs::drawing::spreadsheet::MarkerType::default();
    from_marker.set_coordinate("D2");

    let to_col = std::cmp::min(4 + series_count as u32, 14);
    let to_row = std::cmp::min(2 + (data_row_count as u32 / 2).max(10), 30);
    let to_coord = format!("{}{}", col_letter(to_col as usize), to_row);

    let mut to_marker =
        umya_spreadsheet::structs::drawing::spreadsheet::MarkerType::default();
    to_marker.set_coordinate(&to_coord);

    let mut chart = umya_spreadsheet::structs::Chart::default();
    chart.new_chart(chart_type, from_marker, to_marker, series_strs);

    // 设置标题
    chart.set_title(&request.title);

    if let Some(x_title) = &request.x_axis_title {
        chart.set_horizontal_title(x_title);
    }
    if let Some(y_title) = &request.y_axis_title {
        chart.set_vertical_title(y_title);
    }

    // 设置系列标题
    let series_names: Vec<&str> = request.series.iter().map(|s| s.name.as_str()).collect();
    if !series_names.is_empty() {
        chart.set_series_title(series_names);
    }

    // 柱状图默认是堆叠的，改为标准分组
    if matches!(
        request.chart_type,
        crate::models::chart_data::ChartTypeKind::BarChart
    ) {
        chart.set_grouping(umya_spreadsheet::drawing::charts::GroupingValues::Standard);
    }

    // 6. 添加到工作表
    sheet.add_chart(chart);

    // 7. 保存文件
    let path = Path::new(filepath);
    write(&book, path).map_err(|e| format!("保存 Excel 文件失败: {}", e))?;

    Ok(())
}

/// 将列索引（1-based）转换为 Excel 列字母（A, B, C, ..., Z, AA, AB, ...）
fn col_letter(index: usize) -> String {
    assert!(index > 0, "col_letter 参数必须大于 0，收到: {}", index);
    let mut result = String::new();
    let mut n = index;

    loop {
        let remainder = (n - 1) % 26;
        result.push((b'A' + remainder as u8) as char);
        n = (n - 1) / 26;
        if n == 0 {
            break;
        }
    }

    result.chars().rev().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_col_letter() {
        assert_eq!(col_letter(1), "A");
        assert_eq!(col_letter(2), "B");
        assert_eq!(col_letter(26), "Z");
        assert_eq!(col_letter(27), "AA");
        assert_eq!(col_letter(28), "AB");
        assert_eq!(col_letter(52), "AZ");
        assert_eq!(col_letter(53), "BA");
    }
}
