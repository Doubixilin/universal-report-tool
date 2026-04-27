/** 字段名同义词词典，用于列名智能匹配 */
export const FIELD_SYNONYMS: Record<string, string[]> = {
  "日期": ["日期", "时间", "年月", "Date"],
  "项目名称": ["项目名称", "项目名", "工程名称"],
  "营业收入": ["营业收入", "收入", "营收", "Revenue", "总收入"],
  "净利润": ["净利润", "利润", "净利", "Net Profit"],
  "成本": ["成本", "费用", "支出", "Cost"],
  "同比增长": ["同比增长", "同比", "YOY", "增长率"],
  "环比增长": ["环比增长", "环比", "MOM"],
  "人数": ["人数", "员工数", "人员", "编制"],
  "完成比例": ["完成比例", "完成率", "达成率", "进度"],
  "序号": ["序号", "编号", "No"],
  "部门": ["部门", "科室", "团队", "Division"],
  "类别": ["类别", "分类", "类型", "Category"],
  "金额": ["金额", "总额", "合计", "Total"],
  "单价": ["单价", "价格", "Price"],
  "数量": ["数量", "件数", "Quantity", "Qty"],
  "备注": ["备注", "说明", "注释", "Remark", "Note"],
};

/** 根据列名匹配标准字段名 */
export function matchFieldName(
  columnName: string,
  knownFields: string[] = Object.keys(FIELD_SYNONYMS)
): string | null {
  const lower = columnName.toLowerCase().trim();

  // 精确匹配
  for (const field of knownFields) {
    if (FIELD_SYNONYMS[field]?.some((syn) => syn.toLowerCase() === lower)) {
      return field;
    }
  }

  // 包含匹配
  for (const field of knownFields) {
    if (FIELD_SYNONYMS[field]?.some((syn) => lower.includes(syn.toLowerCase()))) {
      return field;
    }
  }

  return null;
}

/** 获取字段的所有同义词 */
export function getSynonyms(fieldName: string): string[] {
  return FIELD_SYNONYMS[fieldName] || [];
}
