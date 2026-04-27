import { useState } from "react";
import { Card, Button, Upload, List, Empty, Typography, Tag } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useProjectStore } from "@/stores/projectStore";

const { Title } = Typography;

export default function TemplatePage() {
  const { currentProject } = useProjectStore();
  const [templates] = useState<any[]>([]);

  const handleUploadTemplate = (file: File) => {
    // TODO: 保存模板文件并解析占位符
    console.log("上传模板:", file.name);
    return false;
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
          模板管理
        </Title>
        <Upload
          beforeUpload={handleUploadTemplate}
          accept=".docx"
          showUploadList={false}
        >
          <Button type="primary" icon={<UploadOutlined />}>
            上传模板
          </Button>
        </Upload>
      </div>

      {!currentProject ? (
        <Empty description="请先选择一个项目" />
      ) : templates.length === 0 ? (
        <Empty
          description="暂无模板，请上传Word模板文件"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
          dataSource={templates}
          renderItem={(template) => (
            <List.Item>
              <Card title={template.name} hoverable>
                <p>占位符数量: {template.placeholderCount || 0}</p>
                <Tag color="blue">.docx</Tag>
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
