"use client";

import { FormInput } from "@/components";
import { IDRFormat, IDRToNumber } from "@/components/utils/PembiayaanUtil";
import { IActionTable, IPageProps } from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  DeleteOutlined,
  DropboxOutlined,
  EditOutlined,
  PlusCircleFilled,
  SaveOutlined,
} from "@ant-design/icons";
import { JenisPembiayaan } from "@prisma/client";
import {
  App,
  Button,
  Card,
  Checkbox,
  Input,
  Modal,
  Table,
  TableProps,
  Tag,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import moment from "moment";
import { useEffect, useState } from "react";

export default function Page() {
  const [upsert, setUpsert] = useState<IActionTable<JenisPembiayaan>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [pageProps, setPageProps] = useState<IPageProps<JenisPembiayaan>>({
    page: 1,
    limit: 10,
    total: 0,
    data: [],
    search: "",
  });
  const [loading, setLoading] = useState(false);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/master/jenis");

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) {
      params.append("search", pageProps.search);
    }
    const res = await fetch(`/api/jenis?${params.toString()}`);
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

  const columns: TableProps<JenisPembiayaan>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 100,
    },
    {
      title: "Jenis Pembiayaan",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Biaya Biaya",
      dataIndex: "biaya",
      key: "biaya",
      render(value, record, index) {
        return (
          <div className="text-xs">
            <p>Blokir : {record.c_blokir}x</p>
            <p>Biaya Mutasi : {IDRFormat(record.c_mutasi)}</p>
          </div>
        );
      },
    },
    {
      title: "Status Permohonan",
      dataIndex: "statusPermohonan",
      key: "statusPermohonan",
      render(value, record, index) {
        return (
          <div className="text-xs">
            <p>
              Pelunasan :{" "}
              {record.status_takeover ? (
                <Tag color={"blue"}>YA</Tag>
              ) : (
                <Tag color={"red"}>Tidak</Tag>
              )}
            </p>
            <p>
              Mutasi :{" "}
              {record.status_mutasi ? (
                <Tag color={"blue"}>YA</Tag>
              ) : (
                <Tag color={"red"}>Tidak</Tag>
              )}
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
    <Card
      title={
        <div className="flex gap-2 font-bold text-xl">
          <DropboxOutlined /> Jenis Pembiayaan
        </div>
      }
      styles={{ body: { padding: 5 } }}
    >
      <div className="flex justify-between my-1">
        {hasAccess("write") && (
          <Button
            size="small"
            type="primary"
            icon={<PlusCircleFilled />}
            onClick={() =>
              setUpsert({ ...upsert, upsert: true, selected: undefined })
            }
          >
            Add New
          </Button>
        )}
        <Input.Search
          size="small"
          style={{ width: 170 }}
          placeholder="Cari nama..."
          onChange={(e) =>
            setPageProps({ ...pageProps, search: e.target.value })
          }
        />
      </div>

      <Table
        columns={columns}
        dataSource={pageProps.data}
        size="small"
        loading={loading}
        rowKey={"id"}
        bordered
        scroll={{ x: "max-content", y: "60vh" }}
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
      />
      <UpsertJenis
        open={upsert.upsert}
        record={upsert.selected}
        setOpen={(v: boolean) => setUpsert({ ...upsert, upsert: v })}
        getData={getData}
        modal={modal}
        key={upsert.selected ? upsert.selected.id : "create"}
      />
      <DeleteJenis
        open={upsert.delete}
        setOpen={(v: boolean) => setUpsert({ ...upsert, delete: v })}
        getData={getData}
        record={upsert.selected}
        key={upsert.selected ? upsert.selected.id : "delete"}
        modal={modal}
      />
    </Card>
  );
}

function UpsertJenis({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: JenisPembiayaan;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [data, setData] = useState(record ? record : defaultJenis);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await fetch("/api/jenis", {
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
      title={
        record
          ? "Update Jenis Pembiayaan " + record.name
          : "Add New Jenis Pembiayaan"
      }
      open={open}
      onCancel={() => setOpen(false)}
      footer={[]}
      loading={loading}
      // style={{ top: 20 }}
    >
      <div className="flex flex-col gap-3">
        <div className="hidden">
          <FormInput
            data={{
              label: "Jenis ID",
              mode: "horizontal",
              type: "text",
              value: data.id,
              onChange: (e: string) => setData({ ...data, id: e }),
            }}
          />
        </div>
        <FormInput
          data={{
            label: "Jenis Pembiayaan",
            mode: "horizontal",
            required: true,
            type: "text",
            value: data.name,
            onChange: (e: string) => setData({ ...data, name: e }),
          }}
        />
        <FormInput
          data={{
            label: "Blokir Angsuran",
            mode: "horizontal",
            required: true,
            type: "number",
            value: data.c_blokir,
            onChange: (e: any) => setData({ ...data, c_blokir: parseInt(e) }),
          }}
        />
        <FormInput
          data={{
            label: "Biaya Mutasi",
            mode: "horizontal",
            required: true,
            type: "text",
            value: IDRFormat(data.c_mutasi || 0),
            onChange: (e: any) =>
              setData({ ...data, c_mutasi: IDRToNumber(e || "0") }),
          }}
        />
        <Checkbox
          checked={data.status_takeover}
          onChange={(e) =>
            setData({ ...data, status_takeover: e.target.checked })
          }
        >
          Ada Takeover Pembiayaan?
        </Checkbox>
        <Checkbox
          checked={data.status_mutasi}
          onChange={(e) =>
            setData({ ...data, status_mutasi: e.target.checked })
          }
        >
          Ada Mutasi Gaji?
        </Checkbox>
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

export function DeleteJenis({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: JenisPembiayaan;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/jenis?id=${record?.id}`, {
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
      title={"Delete Jenis Pembiayaan " + record?.name}
    >
      <p>Are you sure you want to delete this jenis pembiayaan?</p>
      <div className="flex justify-end gap-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button danger onClick={handleDelete} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

const defaultJenis: JenisPembiayaan = {
  id: "",
  name: "",
  c_blokir: 0,
  c_mutasi: 0,
  status_takeover: false,
  status_mutasi: false,

  status: true,
  created_at: new Date(),
  updated_at: new Date(),
};
