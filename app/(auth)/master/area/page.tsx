"use client";

import { FormInput } from "@/components";
import { IActionTable, IArea, IPageProps } from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  PlusCircleOutlined,
  SaveOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Cabang } from "@prisma/client";
import { App, Button, Card, Input, Modal, Table, TableProps, Tag } from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import moment from "moment";
import { useEffect, useState } from "react";

export default function Page() {
  const [upsert, setUpsert] = useState<IActionTable<IArea>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [pageProps, setPageProps] = useState<IPageProps<IArea>>({
    page: 1,
    limit: 10,
    total: 0,
    data: [],
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/master/area");

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) {
      params.append("search", pageProps.search);
    }
    const res = await fetch(`/api/area?${params.toString()}`);
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

  const columns: TableProps<IArea>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Area",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Cabang",
      dataIndex: "Cabang",
      key: "cabang",
      className: "text-center",
      render(value, record, index) {
        return record.Cabang.length;
      },
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

  return (
    <Card
      title={
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <EnvironmentOutlined /> Unit Pelayanan
        </div>
      }
      className="app-master-card"
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <Button
          size="middle"
          type="primary"
          icon={<PlusCircleOutlined />}
          className="app-master-action"
          onClick={() =>
            setUpsert({ ...upsert, upsert: true, selected: undefined })
          }
        >
          Add Area
        </Button>
        <div className="app-master-toolbar-search">
          <Input
            size="middle"
            className="app-master-search"
            placeholder="Cari area/cabang..."
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
              <div className="ms-15">
                <TableCabang
                  record={record.Cabang}
                  areaId={record.id}
                  getData={getData}
                  modal={modal}
                  hasAccess={hasAccess}
                />
              </div>
            );
          },
        }}
      />
      <UpsertArea
        open={upsert.upsert}
        setOpen={(v: boolean) => setUpsert({ ...upsert, upsert: v })}
        getData={getData}
        record={upsert.selected}
        key={upsert.selected ? "upsertarea" + upsert.selected.id : "createarea"}
        modal={modal}
      />
      <DeleteArea
        open={upsert.delete}
        setOpen={(v: boolean) => setUpsert({ ...upsert, delete: v })}
        getData={getData}
        record={upsert.selected}
        key={upsert.selected ? "deletearea" + upsert.selected.id : "deletearea"}
        modal={modal}
      />
    </Card>
  );
}

function UpsertArea({
  open,
  setOpen,
  record,
  getData,
  modal,
}: {
  open: boolean;
  setOpen: Function;
  record?: IArea;
  getData: Function;
  modal: HookAPI;
}) {
  const [data, setData] = useState(record || defaultData);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const { Cabang, ...saved } = data;
    await fetch("/api/area", {
      method: record ? "PUT" : "POST",
      body: JSON.stringify(saved),
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

  return (
    <Modal
      title={record ? "Update Area " + record.name : "Add New Area"}
      open={open}
      onCancel={() => setOpen(false)}
      footer={[]}
      loading={loading}
    >
      <div className="flex flex-col gap-3">
        <FormInput
          data={{
            label: "Nama Area",
            mode: "horizontal",
            required: true,
            type: "text",
            value: data.name,
            onChange: (e: string) => setData({ ...data, name: e }),
          }}
        />
        <div className="flex justify-end gap-4">
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            icon={<SaveOutlined />}
            type="primary"
            onClick={() => handleSave()}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function DeleteArea({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: IArea;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/area?id=${record?.id}`, {
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
      title={"Delete Area " + record?.name}
    >
      <p>Are you sure you want to delete this data?</p>
      <div className="flex justify-end gap-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button danger onClick={handleDelete} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

function TableCabang({
  record,
  areaId,
  getData,
  modal,
  hasAccess,
}: {
  record: Cabang[];
  areaId: string;
  getData: Function;
  modal: HookAPI;
  hasAccess: Function;
}) {
  const [upsert, setUpsert] = useState<IActionTable<Cabang>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const columns: TableProps<Cabang>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Cabang",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Kontak",
      dataIndex: "address",
      key: "address",
      render(value, record, index) {
        return (
          <div className="text-xs">
            <p>
              <EnvironmentOutlined /> {record.address}
            </p>
            <p>
              <PhoneOutlined /> {record.phone}
            </p>
          </div>
        );
      },
    },
    {
      title: "Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date) => moment(date).format("DD-MM-YYYY"),
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

  return (
    <div className="space-y-3">
      {hasAccess("write") && (
        <Button
          icon={<PlusCircleOutlined />}
          size="middle"
          type="primary"
          className="app-master-action"
          onClick={() =>
            setUpsert({ ...upsert, upsert: true, selected: undefined })
          }
        >
          Add Cabang
        </Button>
      )}
      <Table
        className="app-master-table"
        columns={columns}
        dataSource={record}
        rowKey={"id"}
        pagination={false}
        size="middle"
      />
      <UpsertCabang
        open={upsert.upsert}
        record={upsert.selected}
        setOpen={(v: boolean) => setUpsert({ ...upsert, upsert: v })}
        getData={getData}
        areaId={areaId}
        modal={modal}
        key={
          upsert.selected ? "upsertcabang" + upsert.selected.id : "createCabang"
        }
      />
      <DeleteCabang
        open={upsert.delete}
        setOpen={(v: boolean) => setUpsert({ ...upsert, delete: v })}
        getData={getData}
        modal={modal}
        record={upsert.selected}
        key={
          upsert.selected ? "deletecabang" + upsert.selected.id : "deleteCabang"
        }
      />
    </div>
  );
}

function UpsertCabang({
  record,
  open,
  setOpen,
  getData,
  areaId,
  modal,
}: {
  record?: Cabang;
  open: boolean;
  setOpen: Function;
  getData: Function;
  areaId: string;
  modal: HookAPI;
}) {
  const [data, setData] = useState(
    record || { ...defaultCabang, areaId: areaId },
  );
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/unit", {
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

  return (
    <Modal
      title={record ? "Update Cabang " + record.name : "Add New Cabang"}
      open={open}
      onCancel={() => setOpen(false)}
      footer={[]}
      loading={loading}
    >
      <div className="flex flex-col gap-3">
        <FormInput
          data={{
            label: "Nama Cabang",
            mode: "horizontal",
            required: true,
            type: "text",
            value: data.name,
            onChange: (e: string) => setData({ ...data, name: e }),
          }}
        />
        <FormInput
          data={{
            label: "No Telepon",
            mode: "horizontal",
            type: "text",
            value: data.phone,
            onChange: (e: string) => setData({ ...data, phone: e }),
          }}
        />
        <FormInput
          data={{
            label: "Alamat",
            mode: "horizontal",
            type: "textarea",
            value: data.address,
            onChange: (e: string) => setData({ ...data, address: e }),
          }}
        />
        <div className="flex justify-end gap-4">
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            icon={<SaveOutlined />}
            type="primary"
            onClick={() => handleSave()}
          >
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function DeleteCabang({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: Cabang;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/unit?id=${record?.id}`, {
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
      title={"Delete Cabang " + record?.name}
    >
      <p>Are you sure you want to delete this data?</p>
      <div className="flex justify-end gap-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button danger onClick={handleDelete} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

const defaultData: IArea = {
  id: "",
  name: "",
  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  Cabang: [],
};

const defaultCabang: Cabang = {
  id: "",
  name: "",
  address: "",
  phone: "",

  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  areaId: "",
};
