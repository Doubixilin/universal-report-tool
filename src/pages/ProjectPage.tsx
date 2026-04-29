import { useState, useEffect } from "react";
import { Card, Button, Empty, List, Typography, Tag, Modal, Form, Input, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useProjectStore } from "@/stores/projectStore";
import { getDatabase } from "@/database";
import type { Project } from "@/types";

const { Title } = Typography;

export default function ProjectPage() {
  const { projects, currentProject, setCurrentProject, setProjects, addProject } =
    useProjectStore();
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  // 从 SQLite 加载项目列表
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const rows = await db.select<Array<Record<string, unknown>>>(
        "SELECT * FROM projects ORDER BY created_at DESC"
      );
      const mapped: Project[] = (rows || []).map((r) => ({
        id: r.id as string,
        name: r.name as string,
        description: (r.description as string) || "",
        storageType: (r.storage_type as "sqlite" | "json") || "sqlite",
        createdAt: r.created_at as string,
        updatedAt: r.updated_at as string,
      }));
      setProjects(mapped);
    } catch (err) {
      console.error("加载项目列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const values = await form.validateFields();
      const db = await getDatabase();
      const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date().toISOString();

      await db.execute(
        `INSERT INTO projects (id, name, description, storage_type, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, values.name, values.description || "", "sqlite", now, now]
      );

      const newProject: Project = {
        id,
        name: values.name,
        description: values.description || "",
        storageType: "sqlite",
        createdAt: now,
        updatedAt: now,
      };
      addProject(newProject);
      setCurrentProject(newProject);
      message.success("项目已创建");
      setCreateOpen(false);
      form.resetFields();
    } catch (err) {
      if (err && typeof err === "object" && "errorFields" in err) return; // form validation
      message.error("创建失败: " + (err instanceof Error ? err.message : String(err)));
    }
  };

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
          项目管理
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建项目
        </Button>
      </div>

      {projects.length === 0 && !loading ? (
        <Empty
          description="暂无项目，点击上方按钮创建"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
          dataSource={projects}
          loading={loading}
          renderItem={(project: Project) => (
            <List.Item>
              <Card
                hoverable
                title={project.name}
                extra={
                  currentProject?.id === project.id ? (
                    <Tag color="blue">当前</Tag>
                  ) : null
                }
                onClick={() => setCurrentProject(project)}
                style={{
                  borderColor:
                    currentProject?.id === project.id ? "#1677ff" : undefined,
                }}
              >
                <p style={{ color: "#666", minHeight: 44 }}>
                  {project.description || "暂无描述"}
                </p>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  <Tag>{project.storageType === "sqlite" ? "SQLite" : "JSON"}</Tag>
                  <span style={{ color: "#999", fontSize: 12 }}>
                    {new Date(project.updatedAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}

      <Modal
        title="新建项目"
        open={createOpen}
        onOk={handleCreateProject}
        onCancel={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="项目名称"
            rules={[{ required: true, message: "请输入项目名称" }]}
          >
            <Input placeholder="例如：2024年经营分析报告" />
          </Form.Item>
          <Form.Item name="description" label="项目描述">
            <Input.TextArea rows={3} placeholder="可选描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
