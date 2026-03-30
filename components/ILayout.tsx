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
          className="flex gap-3 bg-linear-to-br from-green-500 to-gray-500 rounded p-2"
          style={{
            margin: 3,
            color: "rgba(255, 255, 255, 0.85)",
            ...(collapsed ? { display: "none" } : { display: "flex" }),
          }}
        >
          <img
            src="https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
            alt="profile_picture"
            className="w-18 h-18 rounded-full border-2 border-white overflow-hidden"
          />
          <div className="flex-1">
            <div style={{ lineHeight: 1 }}>
              <div className="font-bold">{user?.fullname}</div>
              <div className="opacity-60 text-xs">
                <div>@{user?.username}</div>
                <div>
                  @{user?.position} | {user?.cabang}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="small"
                    type="primary"
                    icon={<DoubleLeftOutlined />}
                    onClick={() => setCollapsed(true)}
                  ></Button>
                </div>
              </div>
            </div>
          </div>
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
