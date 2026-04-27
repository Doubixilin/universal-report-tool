import { useEffect } from "react";
import { Card, Button, Empty, List, Typography, Tag } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useProjectStore } from "@/stores/projectStore";
import { Project } from "@/types";

const { Title } = Typography;

export default function ProjectPage() {
  const { projects, currentProject, setCurrentProject, setProjects } =
    useProjectStore();

  useEffect(() => {
    // TODO: 从SQLite加载项目列表
    if (projects.length === 0) {
      setProjects([
        {
          id: "demo-1",
          name: "示例项目 - 2024年经营分析报告",
          description: "包含月度经营数据、财务指标和项目进展",
          storageType: "sqlite",
          createdAt: "2024-01-15",
          updatedAt: "2024-03-20",
        },
      ]);
    }
  }, []);

  const handleCreateProject = () => {
    // TODO: 打开创建项目对话框
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
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateProject}>
          新建项目
        </Button>
      </div>

      {projects.length === 0 ? (
        <Empty
          description="暂无项目，点击上方按钮创建"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4 }}
          dataSource={projects}
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
                    {project.updatedAt}
                  </span>
                </div>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
