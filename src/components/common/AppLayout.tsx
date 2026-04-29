import { useState } from "react";
import { Layout, Menu, theme } from "antd";
import {
  FolderOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  BarChartOutlined,
  FileWordOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/project", icon: <FolderOutlined />, label: "项目管理" },
  { key: "/data", icon: <DatabaseOutlined />, label: "数据管理" },
  { key: "/template", icon: <FileTextOutlined />, label: "模板管理" },
  { key: "/chart", icon: <BarChartOutlined />, label: "图表设计" },
  { key: "/report", icon: <FileWordOutlined />, label: "报告生成" },
  { key: "/settings", icon: <SettingOutlined />, label: "配置中心" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: "2px 0 8px rgba(0,0,0,0.06)",
          zIndex: 10,
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: collapsed ? 14 : 18,
            fontWeight: "bold",
            color: "#1677ff",
            borderBottom: "1px solid #f0f0f0",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {collapsed ? "报告" : "万能报告工具"}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            zIndex: 5,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 500 }}>
            {collapsed ? (
              <MenuUnfoldOutlined
                onClick={() => setCollapsed(false)}
                style={{ cursor: "pointer", marginRight: 12 }}
              />
            ) : (
              <MenuFoldOutlined
                onClick={() => setCollapsed(true)}
                style={{ cursor: "pointer", marginRight: 12 }}
              />
            )}
            {menuItems.find((item) => item.key === location.pathname)?.label ||
              "万能报告工具"}
          </span>
          <span style={{ color: "#999", fontSize: 12 }}>
            v0.1.0 · 离线模式
          </span>
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "auto",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
