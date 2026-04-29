//! 图表数据结构定义
//! 前端通过 JSON 传递图表配置，Rust 端反序列化为这些结构体

use serde::{Deserialize, Serialize};

/// 图表类型枚举（映射到 umya-spreadsheet 的 ChartType）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ChartTypeKind {
    BarChart,      // 柱状图
    LineChart,     // 折线图
    PieChart,      // 饼图
    AreaChart,     // 面积图
    ScatterChart,  // 散点图
    RadarChart,    // 雷达图
    DoughnutChart, // 环形图
    BubbleChart,   // 气泡图
}

/// 单个数据系列
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartSeries {
    pub name: String,
    pub values: Vec<f64>,
    pub color: Option<String>,
}

/// 图表数据请求体（前端 -> 后端）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartDataRequest {
    pub title: String,
    #[serde(rename = "chartType")]
    pub chart_type: ChartTypeKind,
    pub categories: Vec<String>,
    pub series: Vec<ChartSeries>,
    #[serde(rename = "xAxisTitle")]
    pub x_axis_title: Option<String>,
    #[serde(rename = "yAxisTitle")]
    pub y_axis_title: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
}

/// 图表生成响应（后端 -> 前端）
#[allow(dead_code)] // Phase 2 使用
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartGenerationResponse {
    /// 是否成功
    pub success: bool,
    /// 消息（成功时为空，失败时为错误信息）
    pub message: String,
}

#[allow(dead_code)] // Phase 2 使用
impl ChartDataRequest {
    /// 获取默认图表宽度（EMU 单位，1 EMU = 1/360000 cm）
    pub fn default_width() -> u32 {
        5486400 // 15.24 cm
    }

    /// 获取默认图表高度
    pub fn default_height() -> u32 {
        3200400 // 8.89 cm
    }
}
