import { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Popconfirm, message, Empty, Typography } from 'antd';
import { DeleteOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ImportHistoryRecord } from '@/services/importHistory';
import { getImportHistory, deleteImportHistory } from '@/services/importHistory';

const { Text } = Typography;

interface ImportHistoryPanelProps {
  projectId: string;
  onReuse?: (record: ImportHistoryRecord) => void;
}

export default function ImportHistoryPanel({ projectId, onReuse }: ImportHistoryPanelProps) {
  const [history, setHistory] = useState<ImportHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const records = await getImportHistory(projectId);
      setHistory(records);
    } catch (err) {
      console.error("Failed to load import history:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [projectId]);

  const handleDelete = async (id: string) => {
    try {
      await deleteImportHistory(id);
      message.success('已删除');
      fetchHistory();
    } catch {
      message.error('删除失败');
    }
  };

  const handleReuse = (record: ImportHistoryRecord) => {
    onReuse?.(record);
    message.success('已复用历史配置');
  };

  if (history.length === 0 && !loading) {
    return <Empty description="暂无导入历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'filename',
      key: 'filename',
      render: (text: string, record: ImportHistoryRecord) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            工作表: {record.sheetName}
          </Text>
        </div>
      ),
    },
    {
      title: '数据统计',
      key: 'summary',
      render: (_: unknown, record: ImportHistoryRecord) => (
        <div>
          <Tag color="blue">{record.dataSummary.rowCount} 行</Tag>
          <Tag color="green">{record.dataSummary.columns} 列</Tag>
        </div>
      ),
    },
    {
      title: '列映射',
      key: 'mapping',
      render: (_: unknown, record: ImportHistoryRecord) => {
        const count = Object.keys(record.columnMapping).length;
        return <Tag icon={<CheckCircleOutlined />} color="success">{count} 列已映射</Tag>;
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          <ClockCircleOutlined style={{ marginRight: 4 }} />
          {new Date(text).toLocaleString('zh-CN')}
        </Text>
      ),
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: ImportHistoryRecord) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="link" size="small" onClick={() => handleReuse(record)}>
            一键复用
          </Button>
          <Popconfirm title="确认删除此记录？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>
              <DeleteOutlined />
            </Button>
          </Popconfirm>
        </div>
      ),
      width: 120,
    },
  ];

  return (
    <Card
      title="导入历史"
      size="small"
      extra={
        <Button size="small" onClick={fetchHistory} loading={loading}>
          刷新
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={history}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}
