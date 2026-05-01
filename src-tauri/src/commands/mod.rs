pub mod excel_chart;

use rusqlite::Connection;
use serde_json::{Map, Value};
use tauri::Manager;

/// Convert $1, $2, ... SQL placeholders to ?1, ?2, ... (SQLite numbered parameters)
fn convert_dollar_params(sql: &str) -> String {
    let mut result = String::with_capacity(sql.len());
    let chars: Vec<char> = sql.chars().collect();
    let mut i = 0;
    while i < chars.len() {
        if chars[i] == '$' && i + 1 < chars.len() && chars[i + 1].is_ascii_digit() {
            result.push('?');
            // Keep the digit(s) after ?
            i += 1;
            while i < chars.len() && chars[i].is_ascii_digit() {
                result.push(chars[i]);
                i += 1;
            }
        } else {
            result.push(chars[i]);
            i += 1;
        }
    }
    result
}

fn json_to_rusqlite(v: &Value) -> rusqlite::types::Value {
    match v {
        Value::Null => rusqlite::types::Value::Null,
        Value::Bool(b) => rusqlite::types::Value::Integer(*b as i64),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                rusqlite::types::Value::Integer(i)
            } else if let Some(f) = n.as_f64() {
                rusqlite::types::Value::Real(f)
            } else {
                rusqlite::types::Value::Text(n.to_string())
            }
        }
        Value::String(s) => rusqlite::types::Value::Text(s.clone()),
        Value::Array(_) | Value::Object(_) => rusqlite::types::Value::Text(v.to_string()),
    }
}

fn rusqlite_to_json(v: &rusqlite::types::Value) -> Value {
    match v {
        rusqlite::types::Value::Null => Value::Null,
        rusqlite::types::Value::Integer(i) => Value::Number((*i).into()),
        rusqlite::types::Value::Real(f) => {
            serde_json::Number::from_f64(*f).map(Value::Number).unwrap_or(Value::Null)
        }
        rusqlite::types::Value::Text(s) => Value::String(s.clone()),
        rusqlite::types::Value::Blob(_) => Value::Null,
    }
}

#[tauri::command]
pub fn run_sql(
    app: tauri::AppHandle,
    sql: String,
    params: Vec<Value>,
) -> Result<Vec<Map<String, Value>>, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("获取数据目录失败: {}", e))?;
    let db_path = data_dir.join("universal_report.db");
    let conn = Connection::open(&db_path)
        .map_err(|e| format!("打开数据库失败: {}", e))?;

    // Convert $N to ?N for SQLite
    let converted_sql = convert_dollar_params(&sql);

    let is_select = converted_sql
        .trim()
        .to_uppercase()
        .starts_with("SELECT")
        || converted_sql
            .trim()
            .to_uppercase()
            .starts_with("PRAGMA");

    if is_select {
        let mut stmt = conn
            .prepare(&converted_sql)
            .map_err(|e| format!("准备查询失败: {}", e))?;
        let column_names: Vec<String> = stmt
            .column_names()
            .iter()
            .map(|s| s.to_string())
            .collect();

        // Convert params to rusqlite values
        let rusqlite_params: Vec<rusqlite::types::Value> =
            params.iter().map(json_to_rusqlite).collect();
        let param_refs: Vec<&dyn rusqlite::types::ToSql> = rusqlite_params
            .iter()
            .map(|v| v as &dyn rusqlite::types::ToSql)
            .collect();

        let rows = stmt
            .query_map(param_refs.as_slice(), |row| {
                let mut map = serde_json::Map::new();
                for (i, col_name) in column_names.iter().enumerate() {
                    let value: rusqlite::types::Value = row.get_unwrap(i);
                    map.insert(col_name.clone(), rusqlite_to_json(&value));
                }
                Ok(map)
            })
            .map_err(|e| format!("查询失败: {}", e))?;

        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| format!("读取行失败: {}", e))?);
        }
        Ok(result)
    } else {
        let converted_upper = converted_sql.trim().to_uppercase();
        // Only allow INSERT / UPDATE / DELETE / REPLACE (and CREATE TABLE for init)
        if converted_upper.starts_with("INSERT")
            || converted_upper.starts_with("UPDATE")
            || converted_upper.starts_with("DELETE")
            || converted_upper.starts_with("REPLACE")
            || converted_upper.starts_with("CREATE")
            || converted_upper.starts_with("DROP")
            || converted_upper.starts_with("ALTER")
            || converted_upper.starts_with("BEGIN")
            || converted_upper.starts_with("COMMIT")
            || converted_upper.starts_with("ROLLBACK")
        {
            let rusqlite_params: Vec<rusqlite::types::Value> =
                params.iter().map(json_to_rusqlite).collect();
            let param_refs: Vec<&dyn rusqlite::types::ToSql> = rusqlite_params
                .iter()
                .map(|v| v as &dyn rusqlite::types::ToSql)
                .collect();
            let mut stmt = conn
                .prepare(&converted_sql)
                .map_err(|e| format!("准备语句失败: {}", e))?;
            stmt.execute(param_refs.as_slice())
                .map_err(|e| format!("执行失败: {}", e))?;
            Ok(Vec::new())
        } else {
            Err(format!("不支持的SQL语句类型: {}", converted_upper))
        }
    }
}
