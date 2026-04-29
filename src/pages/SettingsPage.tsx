import { useState } from "react";
import { Card, Form, Select, Switch, Button, Input, Typography, message, Space, Statistic, Row, Col } from "antd";
import { SaveOutlined, ExperimentOutlined, DeleteOutlined } from "@ant-design/icons";
import { generateTestData, clearTestData } from "@/utils/testDataGenerator";

const { Title } = Typography;
const { TextArea } = Input;

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ datasets: number; chartConfigs: number; records: number } | null>(null);

  const handleSave = () => {
    message.success("配置已保存");
  };

  const handleGenerateTestData = async () => {
    setTestLoading(true);
    try {
      const result = await generateTestData();
      setTestResult(result);
      message.success(`测试数据已生成：${result.datasets} 个数据集，${result.chartConfigs} 个图表配置，${result.records} 条记录`);
    } catch (err) {
      message.error("生成失败: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setTestLoading(false);
    }
  };

  const handleClearTestData = async () => {
    setTestLoading(true);
    try {
      await clearTestData();
      setTestResult(null);
      message.success("测试数据已清理");
    } catch (err) {
      message.error("清理失败: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setTestLoading(false);
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
          配置中心
        </Title>
        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
          保存配置
        </Button>
      </div>

      <Form form={form} layout="vertical">
        <Card title="存储设置" style={{ marginBottom: 16 }}>
          <Form.Item label="默认存储方案" name="storageType" initialValue="sqlite">
            <Select style={{ width: 200 }}>
              <Select.Option value="sqlite">SQLite 数据库（推荐）</Select.Option>
              <Select.Option value="json">JSON 文件</Select.Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title="导入设置" style={{ marginBottom: 16 }}>
          <Form.Item label="自动识别表头" name="autoDetectHeader" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item label="启用同义词匹配" name="enableSynonym" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Card>

        <Card title="图表设置" style={{ marginBottom: 16 }}>
          <Form.Item label="默认主题" name="defaultTheme" initialValue="default">
            <Select style={{ width: 200 }}>
              <Select.Option value="default">默认</Select.Option>
              <Select.Option value="dark">暗色</Select.Option>
              <Select.Option value="macarons">马卡龙</Select.Option>
              <Select.Option value="vintage">复古</Select.Option>
            </Select>
          </Form.Item>
        </Card>

        <Card title="映射词典">
          <Form.Item label="自定义字段映射（JSON格式）" name="customMappings">
            <TextArea
              rows={8}
              placeholder='{"营业收入": ["收入", "营收", "Revenue"]}'
            />
          </Form.Item>
        </Card>

        <Card title="测试数据" style={{ marginTop: 16 }}>
          <p style={{ color: "#666", marginBottom: 16 }}>
            一键生成虚拟数据（3个数据集 + 15种图表配置），用于全流程功能验证。
          </p>
          <Space>
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              onClick={handleGenerateTestData}
              loading={testLoading}
            >
              生成测试数据
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleClearTestData}
              loading={testLoading}
            >
              清理测试数据
            </Button>
          </Space>
          {testResult && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Statistic title="数据集" value={testResult.datasets} suffix="个" />
              </Col>
              <Col span={8}>
                <Statistic title="图表配置" value={testResult.chartConfigs} suffix="种" />
              </Col>
              <Col span={8}>
                <Statistic title="数据记录" value={testResult.records} suffix="条" />
              </Col>
            </Row>
          )}
        </Card>
      </Form>
    </div>
  );
}
