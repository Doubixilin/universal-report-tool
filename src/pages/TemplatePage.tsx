import { useState, useEffect } from "react";
import {
  Card,
  Button,
  List,
  Typography,
  Tag,
  message,
  Empty,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useProjectStore } from "@/stores/projectStore";
import { useTemplateStore } from "@/stores/templateStore";
import { parsePlaceholders } from "@/utils/templateMigrator";
import { getDatabase } from "@/database";
import { open } from "@tauri-apps/plugin-dialog";
import type { Template } from "@/types";

const { Title } = Typography;

export default function TemplatePage() {
  const { currentProject } = useProjectStore();
  const { templates, setTemplates, setCurrentTemplate } = useTemplateStore();
  const [loading, setLoading] = useState(false);

  // 加载模板列表
  useEffect(() => {
    if (currentProject) {
      loadTemplates();
    }
  }, [currentProject?.id]);

  const loadTemplates = async () => {
    if (!currentProject) return;
    try {
      const db = await getDatabase();
      const result = await db.select<Template[]>(
        "SELECT * FROM templates WHERE project_id = $1 ORDER BY created_at DESC",
        [currentProject.id]
      );
      setTemplates(result || []);
    } catch (error) {
      console.error("加载模板失败:", error);
    }
  };

  const handleUploadTemplate = async (file: File) => {
    if (!currentProject) {
      message.error("请先选择一个项目");
      return false;
    }

    setLoading(true);
    try {
      // 使用 Tauri 文件对话框选择模板文件
      const templatePath = await open({
        filters: [{ name: "Word 模板", extensions: ["docx"] }],
        title: "选择 Word 模板文件",
      });

      if (!templatePath) {
        setLoading(false);
        return false;
      }

      const finalPath = templatePath.endsWith(".docx")
        ? templatePath
        : `${templatePath}.docx`;

      // 解析占位符
      const placeholders = await parsePlaceholders(finalPath);

      // 写入 SQLite
      const db = await getDatabase();
      const id = `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO templates (id, project_id, name, file_path, placeholders, bindings, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          currentProject.id,
          file.name || finalPath.split(/[/\\]/).pop() || "未命名模板",
          finalPath,
          JSON.stringify(placeholders),
          "{}",
          now,
          now,
        ]
      );

      message.success(
        `模板已上传，解析到 ${placeholders.length} 个占位符`
      );
      await loadTemplates();
    } catch (error) {
      message.error(
        `模板上传失败: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setLoading(false);
    }

    return false; // 阻止 AntD Upload 默认行为
  };

  const handleSelectTemplate = (template: Template) => {
    setCurrentTemplate(template);
    message.success(`已选择模板: ${template.name}`);
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const db = await getDatabase();
      await db.execute("DELETE FROM templates WHERE id = $1", [id]);
      message.success("模板已删除");
      await loadTemplates();
    } catch (error) {
      message.error("删除失败");
    }
  };

  if (!currentProject) {
    return <Empty description="请先选择一个项目" />;
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          模板管理
        </Title>
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={() => handleUploadTemplate({} as File)}
          loading={loading}
        >
          上传模板
        </Button>
      </div>

      {templates.length === 0 ? (
        <Empty
          description="暂无模板，请点击「上传模板」选择Word文件"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
          dataSource={templates}
          renderItem={(template) => {
            const placeholderCount =
              typeof template.placeholders === "string"
                ? JSON.parse(template.placeholders).length
                : (template.placeholders as any[])?.length || 0;

            return (
              <List.Item>
                <Card
                  title={template.name}
                  hoverable
                  onClick={() => handleSelectTemplate(template)}
                  actions={[
                    <Button
                      type="link"
                      danger
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(template.id);
                      }}
                    >
                      删除
                    </Button>,
                  ]}
                >
                  <p>占位符: {placeholderCount} 个</p>
                  <Tag color="blue">.docx</Tag>
                </Card>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
}
