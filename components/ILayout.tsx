"use client";

import {
  BellOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Badge, Button, Drawer, Dropdown, Layout, Menu, Modal } from "antd";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "./UserContext";
import { listMenuUI, MenuPermission } from "./IMenu";
import { useAccess } from "@/libs/Permission";
import Link from "next/link";

const { Header, Content, Sider } = Layout;

export default function ILayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const user = useUser();
  const { crossAccess } = useAccess("/");
  const [notif, setNotif] = useState({
    draft: 0,
    verif: 0,
    slik: 0,
    approv: 0,
    akad: 0,
    printSI: 0,
    SI: 0,
    printSD: 0,
    SD: 0,
    printTTPJ: 0,
    TTPJ: 0,
    count: 0,
    pelunasan: 0,
  });

  const getNotif = async () => {
    await fetch("/api/notif")
      .then((res) => res.json())
      .then((res) => {
        let c = 0;
        if (user && res.data) {
          if (crossAccess("update", "/monitoring"))
            c += res.data.draft + res.data.akad;
          if (crossAccess("read", "/proses/verif")) c += res.data.verif;
          if (crossAccess("read", "/proses/slik")) c += res.data.slik;
          if (crossAccess("read", "/proses/approv")) c += res.data.approv;
          if (crossAccess("read", "/pencairan/print")) c += res.data.printSI;
          if (crossAccess("read", "/pencairan/dropping")) c += res.data.SI;
          if (crossAccess("read", "/ttpb/print")) c += res.data.printSD;
          if (crossAccess("read", "/ttpb/dropping")) c += res.data.SD;
          if (crossAccess("read", "/ttpj/print")) c += res.data.printTTPJ;
          if (crossAccess("read", "/ttpj/dropping")) c += res.data.TTPJ;
          if (crossAccess("read", "/pelunasan")) c += res.data.pelunasan;
        }
        if (res.data) setNotif({ ...res.data, count: c });
      });
  };

  useEffect(() => {
    (async () => {
      await getNotif();
    })();
    setInterval(async () => {
      await getNotif();
    }, 1000 * 30);
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await fetch("/api/auth", { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        window.location.replace("/");
      });
    setLoading(false);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        breakpoint="xs"
        collapsedWidth={80}
        collapsed={collapsed}
        onCollapse={(value: boolean) => setCollapsed(value)}
        width={collapsed ? 80 : 250}
        className={collapsed ? "flex flex-col justify-center items-center" : ""}
        hidden={window && window.innerWidth < 600}
        theme="light"
      >
        <div
          style={{
            margin: 6,
            padding: 14,
            borderRadius: 12,
            background: "linear-gradient(135deg, #1a7f5a 0%, #2d9b6e 40%, #3a7bd5 100%)",
            color: "#fff",
            boxShadow: "0 4px 15px rgba(26, 127, 90, 0.35)",
            position: "relative",
            overflow: "hidden",
            ...(collapsed ? { display: "none" } : { display: "flex" }),
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Decorative circles */}
          <div style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
          }} />
          <div style={{
            position: "absolute",
            bottom: -15,
            left: -15,
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
          }} />

          {/* Avatar */}
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            padding: 3,
            background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(255,255,255,0.3))",
            boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
          }}>
            <img
              src="https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
              alt="profile_picture"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                background: "#e8f5e9",
              }}
            />
          </div>

          {/* User Info */}
          <div style={{ textAlign: "center", lineHeight: 1.3, zIndex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2, letterSpacing: 0.3 }}>
              {user?.fullname}
            </div>
            <div style={{ opacity: 0.75, fontSize: 11 }}>
              @{user?.username}
            </div>
            <div style={{
              marginTop: 6,
              display: "inline-block",
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(4px)",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: 0.5,
              border: "1px solid rgba(255,255,255,0.2)",
            }}>
              {user?.position} &middot; {user?.cabang}
            </div>
          </div>

          {/* Collapse Button */}
          <Button
            size="small"
            type="primary"
            ghost
            icon={<DoubleLeftOutlined />}
            onClick={() => setCollapsed(true)}
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              borderColor: "rgba(255,255,255,0.4)",
              color: "rgba(255,255,255,0.8)",
              borderRadius: 6,
              fontSize: 10,
              width: 24,
              height: 24,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </div>
        {collapsed && window && window.innerWidth > 600 && (
          <div className="flex justify-center">
            <Button
              size="small"
              icon={<DoubleRightOutlined />}
              onClick={() => setCollapsed(false)}
              className="my-2"
              type="primary"
            ></Button>
          </div>
        )}
        {user && (
          <Menu
            theme="light"
            inlineCollapsed={collapsed}
            mode="inline"
            style={{
              width: collapsed
                ? window && window.innerWidth > 600
                  ? 80
                  : 0
                : 250,
              height: collapsed ? "90vh" : "82vh",
              overflow: "auto",
            }}
            items={MenuPermission(
              listMenuUI,
              JSON.parse(user.Role.permission || "").map((p: any) => p.path),
            )}
            onClick={(e) => router.push(e.key)}
          />
        )}
      </Sider>

      <Layout>
        {/* Header */}
        <Header
          style={{
            padding: 0,
            height: 45,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fff",
          }}
        >
          <div className="flex items-center gap-2 ml-2">
            <img width={30} src={process.env.NEXT_PUBLIC_APP_LOGO || ""} />
            <p className=" font-bold text-xl">
              {process.env.NEXT_PUBLIC_APP_SHORTNAME}
            </p>
          </div>
          <div className="pr-4 flex gap-4 items-center">
            <Dropdown
              trigger={["hover"]}
              placement="bottomRight"
              popupRender={() => (
                <div
                  style={{
                    width: 250,
                    maxHeight: 300,
                    overflowY: "auto",
                    padding: 10,
                    background: "white",
                    borderRadius: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  className="flex flex-wrap gap-2 items-center justify-center italic text-xs"
                >
                  <Notify
                    crossAccess={crossAccess("update", "/monitoring")}
                    url="/monitoring"
                    name="DRAFT"
                    count={notif.draft}
                  />
                  <Notify
                    crossAccess={crossAccess("update", "/monitoring")}
                    url="/monitoring"
                    name="AKAD"
                    count={notif.akad}
                  />
                  <Notify
                    crossAccess={crossAccess("read", "/proses/verif")}
                    url="/proses/verif"
                    name="VERIF"
                    count={notif.verif}
                  />
                  <Notify
                    crossAccess={crossAccess("read", "/proses/slik")}
                    url="/proses/slik"
                    name="SLIK"
                    count={notif.slik}
                  />
                  <Notify
                    crossAccess={crossAccess("read", "/proses/approv")}
                    url="/proses/approv"
                    name="APPROV"
                    count={notif.approv}
                  />
                  <Notify
                    crossAccess={crossAccess("read", "/pencairan/print")}
                    url="/pencairan/print"
                    name="CETAK SI"
                    count={notif.printSI}
                  />
                  <Notify
                    crossAccess={crossAccess("read", "/pencairan/dropping")}
                    url="/pencairan/dropping"
                    name="DROPPING"
                    count={notif.SI}
                  />
                  <Notify
                    crossAccess={crossAccess("read", "/ttpb/print")}
                    url="/ttpb/print"
                    name="CETAK SD"
                    count={notif.printSD}
                  />
                  <Notify
                    crossAccess={crossAccess("read", "/ttpb/dropping")}
                    url="/ttpb/dropping"
                    name="Penyerahan Document"
                    count={notif.SD}
                  />
                  <Notify
                    crossAccess={crossAccess("read", "/ttpj/print")}
                    url="/ttpj/print"
                    name="CETAK TTPJ"
                    count={notif.printTTPJ}
                  />
                  <Notify
                    crossAccess={crossAccess("read", "/ttpj/dropping")}
                    url="/ttpj/dropping"
                    name="Penyerahan Jaminan"
                    count={notif.TTPJ}
                  />
                  <Notify
                    crossAccess={crossAccess("read", "/pelunasan")}
                    url="/pelunasan"
                    name="Pelunasan"
                    count={notif.pelunasan}
                  />
                </div>
              )}
            >
              <Button
                icon={
                  <Badge count={notif.count} size="small" showZero>
                    <BellOutlined style={{ cursor: "pointer" }} />
                  </Badge>
                }
              ></Button>
            </Dropdown>
            <Button
              icon={<LogoutOutlined />}
              danger
              onClick={() => setOpen(true)}
            ></Button>
            <Button
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              hidden={window && window.innerWidth > 600}
            ></Button>
          </div>
        </Header>

        {/* Konten Utama */}
        <Content
          style={{ margin: "5px 5px", height: "90vh", overflow: "auto" }}
        >
          <div
            style={{
              minHeight: 360,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        title={"Konfirmasi Logout?"}
        onOk={() => handleLogout()}
        loading={loading}
      >
        <p>Lanjutkan untuk keluar?</p>
      </Modal>
      {window && window.innerWidth < 600 && (
        <Drawer
          placement="left"
          size={"70vw"}
          open={!collapsed}
          onClose={() => setCollapsed(!collapsed)}
          title="MAIN MENU"
        >
          {user && (
            <Menu
              mode="inline"
              items={MenuPermission(
                listMenuUI,
                JSON.parse(user.Role.permission || "").map((p: any) => p.path),
              )}
              onClick={(e) => router.push(e.key)}
            />
          )}
        </Drawer>
      )}
    </Layout>
  );
}

const Notify = ({
  url,
  name,
  count,
  crossAccess,
}: {
  url: string;
  name: string;
  count: number;
  crossAccess: boolean;
}) => {
  return (
    <>
      {crossAccess && (
        <Link href={url} className="border p-1 rounded flex gap-2">
          <span className="italic opacity-80 text-xs">{name}</span>
          <span className="text-red-500">{count}</span>
        </Link>
      )}
    </>
  );
};
