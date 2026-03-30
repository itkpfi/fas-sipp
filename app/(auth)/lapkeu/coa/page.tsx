"use client";

import { FormInput } from "@/components";
import { TypeAccount } from "@/components/utils/CompUtils";
import {
  IActionTable,
  ICategoryOfAccount,
  IPageProps,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  SnippetsOutlined,
} from "@ant-design/icons";
import { AccountType, CategoryOfAccount } from "@prisma/client";
import {
  App,
  Button,
  Card,
  Input,
  Modal,
  Select,
  Table,
  TableProps,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import { useEffect, useState } from "react";

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<ICategoryOfAccount>>({
    page: 1,
    limit: 50,
    total: 0,
    data: [],
    search: "",
    type: "",
  });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IActionTable<ICategoryOfAccount>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/lapkeu/coa");

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) params.append("search", pageProps.search);
    if (pageProps.type) params.append("type", pageProps.type);

    const res = await fetch(`/api/coa?${params.toString()}`);
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
  }, [pageProps.page, pageProps.limit, pageProps.search, pageProps.type]);

  const columns: TableProps<ICategoryOfAccount>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      render(value, record, index) {
        return (
          <div>
            <div>{(pageProps.page - 1) * pageProps.limit + index + 1}</div>
            <div className="opacity-80 text-xs">{record.id}</div>
          </div>
        );
      },
    },
    {
      title: "Account",
      dataIndex: "name",
      key: "name",
      render(value, record, index) {
        return (
          <div>
            <span className="opacity-70">
              (
              {record.type === "ASSET"
                ? "D"
                : record.type === "KEWAJIBAN"
                  ? "K"
                  : record.type === "PENDAPATAN"
                    ? "K"
                    : record.type === "MODAL"
                      ? "K"
                      : record.type === "BEBAN"
                        ? "D"
                        : ""}
              -{record.id})
            </span>
            {record.parentId && (
              <span className="opacity-70">({record.Parent?.name})</span>
            )}{" "}
            {record.name}
          </div>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
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
              size="small"
              type="primary"
              onClick={() =>
                setSelected({ ...selected, selected: record, upsert: true })
              }
            ></Button>
          )}
          {hasAccess("delete") && (
            <Button
              icon={<DeleteOutlined />}
              size="small"
              type="primary"
              danger
              onClick={() =>
                setSelected({ ...selected, delete: true, selected: record })
              }
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
          <SnippetsOutlined /> Chart Of Account
        </div>
      }
      styles={{ body: { padding: 5 } }}
    >
      <div className="flex justify-between my-1 gap-2 overflow-auto">
        <div className="flex gap-2">
          {hasAccess("write") && (
            <Button
              size="small"
              icon={<PlusCircleOutlined />}
              type="primary"
              onClick={() =>
                setSelected({ ...selected, selected: undefined, upsert: true })
              }
            >
              Add New
            </Button>
          )}
          <Select
            size="small"
            placeholder="Pilih Status..."
            options={[
              { label: "ASSET", value: "ASSET" },
              { label: "KEWAJIBAN", value: "KEWAJIBAN" },
              { label: "MODAL", value: "MODAL" },
              { label: "PENDAPATAN", value: "PENDAPATAN" },
              { label: "BEBAN", value: "BEBAN" },
            ]}
            onChange={(e) => setPageProps({ ...pageProps, type: e })}
            allowClear
            style={{ width: 170 }}
          />
        </div>
        <div className="flex gap-2">
          <Input.Search
            size="small"
            style={{ width: 170 }}
            placeholder="Cari nama..."
            onChange={(e) =>
              setPageProps({ ...pageProps, search: e.target.value })
            }
          />
        </div>
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

      <UpsertData
        open={selected.upsert}
        setOpen={(val: boolean) =>
          setSelected({ ...selected, upsert: val, selected: undefined })
        }
        record={selected.selected}
        getData={getData}
        hook={modal}
        key={selected.selected ? "upsert" + selected.selected.id : "create"}
        lists={pageProps.data.filter((d) => !d.parentId)}
      />
      {selected.selected && (
        <DeleteData
          open={selected.delete}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, delete: val, selected: undefined })
          }
          record={selected.selected}
          getData={getData}
          hook={modal}
          key={selected.selected ? "delete" + selected.selected.id : "delete"}
        />
      )}
    </Card>
  );
}

const UpsertData = ({
  open,
  setOpen,
  getData,
  hook,
  record,
  lists,
}: {
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
  record?: CategoryOfAccount;
  lists: CategoryOfAccount[];
}) => {
  const [data, setData] = useState<CategoryOfAccount>(record || defaultdata);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    if ("Parent" in data) delete data.Parent;
    if ("Children" in data) delete data.Children;
    if ("JournalEntry" in data) delete data.JournalEntry;
    await fetch("/api/coa?id=" + record?.id, {
      method: record ? "PUT" : "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          setOpen(false);
          await getData();
        } else {
          hook.error({ title: "ERROR!!", content: res.msg });
        }
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title="Chart Of Account"
      loading={loading}
      onOk={handleSubmit}
    >
      <div className="my-4 flex flex-col gap-3">
        <FormInput
          data={{
            label: "ID/No Akun",
            value: data.id,
            onChange: (e: string) => setData({ ...data, id: e }),
            type: "text",
          }}
        />
        <FormInput
          data={{
            label: "Nama Akun",
            value: data.name,
            onChange: (e: string) => setData({ ...data, name: e }),
            type: "text",
          }}
        />
        <FormInput
          data={{
            label: "Tipe Akun",
            value: data.type,
            onChange: (e: string) =>
              setData({ ...data, type: e as AccountType }),
            type: "select",
            options: [
              { label: "D - ASSET", value: "ASSET" },
              { label: "K - KEWAJIBAN", value: "KEWAJIBAN" },
              { label: "K - MODAL", value: "MODAL" },
              { label: "K - PENDAPATAN", value: "PENDAPATAN" },
              { label: "D - BEBAN", value: "BEBAN" },
            ],
          }}
        />
        <FormInput
          data={{
            label: "Parent Akun",
            value: data.parentId,
            onChange: (e: any) => setData({ ...data, parentId: e ? e : null }),
            type: "select",
            options: lists.map((d) => ({
              label: `(${TypeAccount(d)}-${d.id}) ${d.name}`,
              value: d.id,
            })),
          }}
        />
      </div>
    </Modal>
  );
};

const DeleteData = ({
  open,
  setOpen,
  record,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  record: CategoryOfAccount;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch("/api/coa?id=" + record.id, { method: "DELETE" })
      .then((res) => res.json())
      .then(async (res) => {
        const { msg, status } = res;
        if (status === 200) {
          await getData();
          setOpen(false);
        } else {
          hook.error({ content: msg });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({
          content: `Internal Server Error!!. Hapus data COA ${record.id}) gagal`,
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title="Konfirmasi Hapus"
      loading={loading}
      onOk={handleDelete}
    >
      <p className="my-3">
        Konfirmasi penghapusan COA {record.name} ({record.id})?
      </p>
    </Modal>
  );
};

const defaultdata: CategoryOfAccount = {
  id: "001",
  name: "",
  type: "ASSET",
  parentId: null,
  status: true,
};
