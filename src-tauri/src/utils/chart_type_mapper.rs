//! 图表类型映射：前端枚举 <-> umya-spreadsheet ChartType

use umya_spreadsheet::structs::ChartType;
use crate::models::chart_data::ChartTypeKind;

pub fn map_chart_type(kind: &ChartTypeKind) -> ChartType {
    match kind {
        ChartTypeKind::BarChart => ChartType::BarChart,
        ChartTypeKind::LineChart => ChartType::LineChart,
        ChartTypeKind::PieChart => ChartType::PieChart,
        ChartTypeKind::AreaChart => ChartType::AreaChart,
        ChartTypeKind::ScatterChart => ChartType::ScatterChart,
        ChartTypeKind::RadarChart => ChartType::RadarChart,
        ChartTypeKind::DoughnutChart => ChartType::DoughnutChart,
        ChartTypeKind::BubbleChart => ChartType::BubbleChart,
    }
}
