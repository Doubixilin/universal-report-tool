use serde::Serialize;

/// 应用统一错误类型
#[derive(Debug, Serialize)]
#[serde(tag = "type", content = "detail")]
pub enum AppError {
    /// 参数校验错误
    #[serde(rename = "validation")]
    Validation(String),
    /// 文件 I/O 错误
    #[serde(rename = "io")]
    Io(String),
    /// 内部逻辑错误
    #[serde(rename = "internal")]
    Internal(String),
}

impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::Validation(msg) => write!(f, "校验错误: {}", msg),
            AppError::Io(msg) => write!(f, "IO 错误: {}", msg),
            AppError::Internal(msg) => write!(f, "内部错误: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err.to_string())
    }
}
