import { Card, Form, Select, Switch, Button, Input, Typography, message } from "antd";
import { SaveOutlined } from "@ant-design/icons";

const { Title } = Typography;
const { TextArea } = Input;

export default function SettingsPage() {
  const [form] = Form.useForm();

  const handleSave = () => {
    message.success("配置已保存");
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
      </Form>
    </div>
  );
}
