"use client";

import {
  BellOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Badge, Button, Drawer, Dropdown, Layout, Menu, Modal } from "antd";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "./UserContext";
import { listMenuUI, MenuPermission } from "./IMenu";
import { useAccess } from "@/libs/Permission";
import styles from "./ILayout.module.css";

const { Header, Content, Sider } = Layout;

export default function ILayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openMenuKeys, setOpenMenuKeys] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
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
  const appLogoSrc = process.env.NEXT_PUBLIC_APP_LOGO || "/logsvg.svg";

  const isMobileViewport = typeof window !== "undefined" && window.innerWidth < 600;
  const isDesktopViewport = typeof window !== "undefined" && window.innerWidth >= 600;

  const getNotif = async () => {
    await fetch("/api/notif")
      .then((res) => res.json())
      .then((res) => {
        let c = 0;
        if (user && res.data) {
          if (crossAccess("update", "/monitoring")) c += res.data.draft + res.data.akad;
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
    let timer: ReturnType<typeof setInterval> | undefined;

    (async () => {
      await getNotif();
      timer = setInterval(async () => {
        await getNotif();
      }, 1000 * 30);
    })();

    return () => {
      if (timer) clearInterval(timer);
    };
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

  const menuItems = useMemo(() => {
    if (!user) return [];

    return MenuPermission(
      listMenuUI,
      JSON.parse(user.Role.permission || "[]").map((p: { path: string }) => p.path),
    );
  }, [user]);

  const selectedMenuKey = useMemo(() => {
    const keys: string[] = [];

    const collectKeys = (items: { key: string; children?: unknown[] }[]) => {
      items.forEach((item) => {
        keys.push(item.key);
        if (Array.isArray(item.children) && item.children.length > 0) {
          collectKeys(
            item.children.filter(
              (child): child is { key: string; children?: unknown[] } =>
                typeof child === "object" && child !== null && "key" in child,
            ),
          );
        }
      });
    };

    collectKeys(menuItems);

    return (
      keys
        .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
        .sort((a, b) => b.length - a.length)[0] || pathname
    );
  }, [menuItems, pathname]);

  const defaultOpenMenuKeys = useMemo(() => {
    const segments = selectedMenuKey.split("/").filter(Boolean);

    return segments
      .slice(0, -1)
      .map((_, index) => `/${segments.slice(0, index + 1).join("/")}`);
  }, [selectedMenuKey]);

  useEffect(() => {
    setOpenMenuKeys(defaultOpenMenuKeys);
  }, [defaultOpenMenuKeys]);

  return (
    <Layout className="app-shell">
      <Sider
        breakpoint="xs"
        collapsedWidth={80}
        collapsed={collapsed}
        onCollapse={(value: boolean) => setCollapsed(value)}
        width={collapsed ? 80 : 250}
        className={styles.sidebar}
        hidden={isMobileViewport}
        theme="light"
      >
        <div
          className={styles.profilePanel}
          style={{ ...(collapsed ? { display: "none" } : { display: "flex" }) }}
        >
          <div className={styles.profileGlowTop} />
          <div className={styles.profileGlowBottom} />

          <div className={styles.avatarFrame}>
            <img
              src="https://www.svgrepo.com/show/384674/account-avatar-profile-user-11.svg"
              alt="profile_picture"
              className={styles.avatarImage}
            />
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{user?.fullname}</div>
            <div className={styles.profileUsername}>@{user?.username}</div>
            <div className={styles.profileBadge}>
              {user?.position} &middot; {user?.cabang}
            </div>
          </div>

          <Button
            size="small"
            type="primary"
            ghost
            icon={<DoubleLeftOutlined />}
            onClick={() => setCollapsed(true)}
            className={styles.collapseButton}
          />
        </div>

        {collapsed && isDesktopViewport && (
          <div className="flex justify-center">
            <Button
              size="small"
              icon={<DoubleRightOutlined />}
              onClick={() => setCollapsed(false)}
              className="my-2"
              type="primary"
            />
          </div>
        )}

        {user && (
          <Menu
            theme="light"
            inlineCollapsed={collapsed}
            mode="inline"
            className={`${styles.sidebarMenu} ${collapsed ? styles.sidebarMenuCollapsed : ""}`}
              style={{
                width: collapsed ? (isDesktopViewport ? 80 : 0) : 250,
                height: collapsed ? "calc(100vh - 72px)" : "calc(100vh - 208px)",
                overflow: "auto",
              }}
            items={menuItems}
            selectedKeys={[selectedMenuKey]}
            openKeys={openMenuKeys}
            onOpenChange={(keys) => setOpenMenuKeys(keys)}
            onClick={(e) => router.push(e.key)}
          />
        )}
      </Sider>

      <Layout className={styles.workspace}>
        <Header className={styles.header}>
          <div className={styles.headerPanel}>
            <div className={styles.headerLead}>
              <img
                src={appLogoSrc}
                alt="Logo KOPJAS FAS"
                className={styles.headerBrandLogo}
              />
              <div>
                <p className={styles.headerBrandName}>{process.env.NEXT_PUBLIC_APP_SHORTNAME}</p>
                <p className={styles.headerBrandMeta}>Workspace operasional pembiayaan pensiunan</p>
              </div>
            </div>

            <div className={styles.headerActions}>
              {notif.count > 0 && (
                <div className="app-soft-pill hidden md:inline-flex">Notifikasi aktif {notif.count}</div>
              )}
              <Dropdown
                trigger={["hover"]}
                placement="bottomRight"
                popupRender={() => (
                  <div className={styles.notificationPanel}>
                    <Notify crossAccess={crossAccess("update", "/monitoring")} url="/monitoring" name="DRAFT" count={notif.draft} />
                    <Notify crossAccess={crossAccess("update", "/monitoring")} url="/monitoring" name="AKAD" count={notif.akad} />
                    <Notify crossAccess={crossAccess("read", "/proses/verif")} url="/proses/verif" name="VERIF" count={notif.verif} />
                    <Notify crossAccess={crossAccess("read", "/proses/slik")} url="/proses/slik" name="SLIK" count={notif.slik} />
                    <Notify crossAccess={crossAccess("read", "/proses/approv")} url="/proses/approv" name="APPROV" count={notif.approv} />
                    <Notify crossAccess={crossAccess("read", "/pencairan/print")} url="/pencairan/print" name="CETAK SI" count={notif.printSI} />
                    <Notify crossAccess={crossAccess("read", "/pencairan/dropping")} url="/pencairan/dropping" name="DROPPING" count={notif.SI} />
                    <Notify crossAccess={crossAccess("read", "/ttpb/print")} url="/ttpb/print" name="CETAK SD" count={notif.printSD} />
                    <Notify crossAccess={crossAccess("read", "/ttpb/dropping")} url="/ttpb/dropping" name="Penyerahan Document" count={notif.SD} />
                    <Notify crossAccess={crossAccess("read", "/ttpj/print")} url="/ttpj/print" name="CETAK TTPJ" count={notif.printTTPJ} />
                    <Notify crossAccess={crossAccess("read", "/ttpj/dropping")} url="/ttpj/dropping" name="Penyerahan Jaminan" count={notif.TTPJ} />
                    <Notify crossAccess={crossAccess("read", "/pelunasan")} url="/pelunasan" name="Pelunasan" count={notif.pelunasan} />
                  </div>
                )}
              >
                <Button
                  className={styles.iconButton}
                  icon={
                    <Badge count={notif.count} size="small">
                      <BellOutlined style={{ cursor: "pointer" }} />
                    </Badge>
                  }
                />
              </Dropdown>

              <Button
                className={styles.iconButton}
                icon={<LogoutOutlined />}
                danger
                onClick={() => setOpen(true)}
              />

              <Button
                className={styles.iconButton}
                icon={<MenuOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                hidden={isDesktopViewport}
              />
            </div>
          </div>
        </Header>

        <Content className={styles.content} style={{ overflow: "auto" }}>
          <div className={styles.contentInner}>
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

      {isMobileViewport && (
        <Drawer
          className={styles.mobileDrawer}
          placement="left"
          size={"70vw"}
          open={!collapsed}
          onClose={() => setCollapsed(!collapsed)}
          title="MAIN MENU"
        >
          {user && (
            <Menu
              mode="inline"
              className={styles.sidebarMenu}
              items={menuItems}
              selectedKeys={[selectedMenuKey]}
              openKeys={openMenuKeys}
              onOpenChange={(keys) => setOpenMenuKeys(keys)}
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
        <Link href={url} className={styles.notifyItem}>
          <span className="text-xs italic opacity-80">{name}</span>
          <span className={styles.notifyCount}>{count}</span>
        </Link>
      )}
    </>
  );
};
