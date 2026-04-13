"use client";

import { listMenuUI } from "@/components/IMenu";
import { IActionTable, IPageProps, IPermission } from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  PlusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Role } from "@prisma/client";
import {
  App,
  Button,
  Card,
  Checkbox,
  Input,
  Modal,
  Space,
  Table,
  TableProps,
  Tag,
} from "antd";
import moment from "moment";
import { useEffect, useState } from "react";

export default function Page() {
  const [upsert, setUpsert] = useState<IActionTable<Role>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [pageProps, setPageProps] = useState<IPageProps<Role>>({
    page: 1,
    limit: 10,
    total: 0,
    data: [],
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const { hasAccess } = useAccess("/master/roles");

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) {
      params.append("search", pageProps.search);
    }
    const res = await fetch(`/api/roles?${params.toString()}`);
    const json = await res.json();
    setPageProps((prev) => ({
      ...prev,
      data: json.data,
      total: json.total,
    }));
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.limit, pageProps.search]);

  const columns: TableProps<Role>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Nama Role",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status ? "success" : "error"}>
          {status ? "Aktif" : "Tidak Aktif"}
        </Tag>
      ),
      sorter: (a, b) => (a.status === b.status ? 0 : a.status ? 1 : -1),
    },
    {
      title: "Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date) => moment(date).format("DD-MM-YYYY HH:mm:ss"),
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-2">
          {hasAccess("update") && (
            <Button
              icon={<EditOutlined />}
              onClick={() =>
                setUpsert({ ...upsert, upsert: true, selected: record })
              }
              size="small"
              type="primary"
            ></Button>
          )}
          {hasAccess("delete") && (
            <Button
              icon={<DeleteOutlined />}
              onClick={() =>
                setUpsert({ ...upsert, delete: true, selected: record })
              }
              size="small"
              type="primary"
              danger
            ></Button>
          )}
        </div>
      ),
    },
  ];

  const nestedColumns = [
    { title: "Menu", dataIndex: "path", key: "path" },
    {
      title: "Hak Akses",
      dataIndex: "access",
      key: "access",
      render: (akses: string[]) => (
        <Space size={[0, 8]} wrap>
          {akses.map((a) => (
            <Tag key={a} color="blue">
              {a}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <KeyOutlined /> Role Management
        </div>
      }
      className="app-master-card"
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        {hasAccess("write") && (
          <Button
            size="middle"
            type="primary"
            icon={<PlusCircleOutlined />}
            className="app-master-action"
            onClick={() =>
              setUpsert({ ...upsert, upsert: true, selected: undefined })
            }
          >
            Add Role
          </Button>
        )}
        <div className="app-master-toolbar-search">
          <Input
            size="middle"
            className="app-master-search"
            placeholder="Cari role..."
            prefix={<SearchOutlined className="text-slate-400" />}
            allowClear
            onChange={(e) =>
              setPageProps({ ...pageProps, search: e.target.value })
            }
          />
        </div>
      </div>

      <Table
        className="app-master-table"
        columns={columns}
        dataSource={pageProps.data}
        size="middle"
        loading={loading}
        rowKey={"id"}
        pagination={{
          current: pageProps.page,
          pageSize: pageProps.limit,
          total: pageProps.total,
          onChange: (page, pageSize) => {
            setPageProps((prev) => ({
              ...prev,
              page,
              limit: pageSize,
            }));
          },
          pageSizeOptions: [50, 100, 500, 1000],
        }}
        expandable={{
          expandedRowRender: (record) => {
            return (
              <Table
                className="app-master-table"
                columns={nestedColumns}
                dataSource={JSON.parse(record.permission)}
                pagination={false}
                size="middle"
                rowKey={"path"}
              />
            );
          },
        }}
      />

      <UpsertRole
        open={upsert.upsert}
        setOpen={(v: boolean) => setUpsert({ ...upsert, upsert: v })}
        record={upsert.selected}
        key={upsert.selected ? "upsert" + upsert.selected.id : "create"}
        getData={getData}
      />
      <DeleteRole
        open={upsert.delete}
        setOpen={(v: boolean) => setUpsert({ ...upsert, delete: v })}
        record={upsert.selected}
        getData={getData}
        key={upsert.selected ? "delete" + upsert.selected.id : "delete"}
      />
    </Card>
  );
}

export function UpsertRole({
  record,
  open,
  setOpen,
  getData,
}: {
  record?: Role;
  open: boolean;
  setOpen: Function;
  getData?: Function;
}) {
  const [data, setData] = useState(record ? record : defaultRole);
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<IPermission[]>(
    record
      ? MergeMenu(defaultMenu, JSON.parse(record.permission))
      : defaultMenu,
  );
  const { modal } = App.useApp();

  useEffect(() => {
    const newMenu = menus
      .filter((m) => m.access.length !== 0)
      .map((m) => ({ ...m }));

    setData((prev: Role) => ({
      ...prev,
      permission: JSON.stringify(newMenu),
    }));
  }, [menus]);

  const handleSubmit = async () => {
    if (!data.name) {
      modal.error({
        title: "ERROR",
        content: "Mohon lengkapi data terlebih dahulu!",
      });
      return;
    }
    // data.permission = JSON.stringify(
    //   (
    //     data.permission as unknown as {
    //       name: string;
    //       path: string;
    //       access: string[];
    //     }[]
    //   ).map((d) => {
    //     const { name, ...saved } = d;
    //     return saved;
    //   }),
    // );
    setLoading(true);
    await fetch("/api/roles", {
      method: record ? "PUT" : "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 201 || res.status === 200) {
          modal.success({
            title: "BERHASIL",
            content: `Data berhasil ${record ? "di Update" : "ditambahkan"}!`,
          });
          setOpen(false);
          getData && (await getData());
        } else {
          modal.error({
            title: "ERROR",
            content: res.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content: "Internal Server Error",
        });
      });
    setLoading(false);
  };

  const allAccessOptions = ["read", "write", "update", "delete", "proses"];

  const isAllGlobalChecked = menus.every(
    (m) => allAccessOptions.every((a) => m.access.includes(a))
  );
  const isSomeGlobalChecked = !isAllGlobalChecked && menus.some(
    (m) => m.access.length > 0
  );

  const handleToggleAll = (checked: boolean) => {
    setMenus((prev: IPermission[]) =>
      prev.map((p) => ({
        ...p,
        access: checked ? [...allAccessOptions] : [],
      }))
    );
  };

  const columns: TableProps<IPermission>["columns"] = [
    {
      title: "Menu",
      dataIndex: "menu",
      key: "menu",
      width: 100,
      className: "text-xs",
      onHeaderCell: () => {
        return {
          ["style"]: {
            textAlign: "center",
            fontSize: 12,
          },
        };
      },
      render(value, record, index) {
        return <>{record.path}</>;
      },
    },
    {
      title: (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span>Access</span>
          <Checkbox
            checked={isAllGlobalChecked}
            indeterminate={isSomeGlobalChecked}
            onChange={(e) => handleToggleAll(e.target.checked)}
            style={{ marginLeft: 4 }}
          >
            <span style={{ fontSize: 11 }}>Semua</span>
          </Checkbox>
        </div>
      ),
      dataIndex: "access",
      key: "access",
      width: 200,
      className: "text-xs",
      onHeaderCell: () => {
        return {
          ["style"]: {
            textAlign: "center",
            fontSize: 12,
          },
        };
      },
      render(value, record, index) {
        const isAllChecked = allAccessOptions.every((a) =>
          record.access.includes(a)
        );
        const isSomeChecked =
          !isAllChecked && record.access.length > 0;

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div>
              <Checkbox
                checked={isAllChecked}
                indeterminate={isSomeChecked}
                onChange={(e) => {
                  const newAccess = e.target.checked
                    ? [...allAccessOptions]
                    : [];
                  setMenus((prev: IPermission[]) =>
                    prev.map((p) =>
                      p.path === record.path
                        ? { ...p, access: newAccess }
                        : p
                    )
                  );
                }}
                style={{ fontWeight: 600, fontSize: 11 }}
              >
                Pilih Semua
              </Checkbox>
            </div>
            <Checkbox.Group
              options={allAccessOptions}
              value={record.access}
              onChange={(e) => {
                setMenus((prev: IPermission[]) =>
                  prev.map((p) =>
                    p.path === record.path
                      ? { ...p, access: e }
                      : p
                  )
                );
              }}
            />
          </div>
        );
      },
    },
  ];
  return (
    <Modal
      loading={loading}
      footer={[]}
      open={open}
      onCancel={() => setOpen(false)}
      width={800}
      style={{ top: 20 }}
      title={record ? "Update Role " + record.name : "Add New Role"}
    >
      <div className="p-2">
        <div className="flex gap-5 my-3 items-center">
          <p className="w-32">
            <span className="text-red-500">*</span>Nama Role
          </p>
          <Input
            required
            value={data.name}
            onChange={(e) =>
              setData((prev: Role) => ({ ...prev, name: e.target.value }))
            }
          />
        </div>
        <div className="my-2">
          <p>Role Permissions</p>
          <Table
            rowKey={"path"}
            columns={columns}
            dataSource={menus}
            size="small"
            pagination={false}
            scroll={{ x: "max-content", y: "50vh" }}
            loading={loading}
            bordered
          />
        </div>
        <div className="flex justify-end m-4 gap-4">
          <Button
            type="primary"
            onClick={() => handleSubmit()}
            loading={loading}
          >
            Submit
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function DeleteRole({
  record,
  open,
  setOpen,
  getData,
}: {
  record?: Role;
  open: boolean;
  setOpen: Function;
  getData?: Function;
}) {
  const [loading, setLoading] = useState(false);
  const { modal } = App.useApp();
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/roles?id=${record?.id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          modal.success({
            title: "SUCCESS",
            content: data.msg,
          });
          setOpen(false);
          getData && (await getData());
        } else {
          modal.error({
            title: "ERROR",
            content: data.msg,
          });
        }
      })
      .catch((err) => {
        console.log(err);
        modal.error({
          title: "ERROR",
          content: "Internal Server Error",
        });
      });
    setLoading(false);
  };
  return (
    <Modal
      loading={loading}
      footer={[]}
      open={open}
      onCancel={() => setOpen(false)}
      width={400}
      style={{ top: 20 }}
      title={"Delete Role " + record?.name}
    >
      <p>Are you sure you want to delete this role?</p>
      <div className="flex justify-end gap-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button danger onClick={handleDelete} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

const defaultRole: Role = {
  id: "",
  name: "",
  permission: "",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
};

const defaultMenu: IPermission[] = listMenuUI
  .filter((u) => u.needaccess)
  .flatMap((m) => {
    if (m.children && m.children.length > 0) {
      return m.children.map((c) => ({
        path: c.key,
        // name: String(c.label),
        access: [],
      }));
    } else {
      return {
        path: m.key,
        // name: String(m.label),
        access: [],
      };
    }
  });

function MergeMenu(menuItems: IPermission[], data: IPermission[]) {
  const mergedMenu = menuItems.map((item) => {
    const found = data.find((r) => r.path === item.path);
    return {
      ...item,
      access: found ? found.access : [],
    };
  });
  return mergedMenu;
}
