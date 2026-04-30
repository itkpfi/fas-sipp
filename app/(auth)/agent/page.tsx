"use client";

import { FormInput } from "@/components";
import { FilterData } from "@/components/utils/CompUtils";
import {
  IActionTable,
  IAgentFronting,
  IPageProps,
  ISumdan,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  DatabaseOutlined,
  DeleteOutlined,
  EditOutlined,
  FileFilled,
  PlusCircleOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Modal,
  Table,
  TableProps,
  Typography,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import { useEffect, useState } from "react";
const { Paragraph } = Typography;
const { RangePicker } = DatePicker;

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<IAgentFronting>>({
    page: 1,
    limit: 50,
    total: 0,
    data: [],
    search: "",
    backdate: "",
  });
  const [action, setAction] = useState<IActionTable<IAgentFronting>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/agent");
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) params.append("search", pageProps.search);

    const res = await fetch(`/api/agent?${params.toString()}`);
    const json = await res.json();
    setPageProps((prev) => ({
      ...prev,
      data: json.data,
      total: json.total,
    }));
    setLoading(false);
  };

  const [sumdanOption, setsumdanOption] = useState<ISumdan[]>([]);
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/sumdan");
      const resJson = await res.json();
      setsumdanOption(resJson.data);
    })();
  }, []);
  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.limit, pageProps.search, pageProps.backdate]);

  const columns: TableProps<IAgentFronting>["columns"] = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      className: "text-center",
      width: 50,
      render(value, record, index) {
        return <>{(pageProps.page - 1) * pageProps.limit + index + 1}</>;
      },
    },
    {
      title: "Agent Fronting",
      dataIndex: "name",
      key: "name",
      render(value, record, index) {
        return (
          <div>
            <div>{record.name}</div>
            <div className="text-xs opacity-80">@{record.code}</div>
          </div>
        );
      },
    },
    {
      title: "Penanggung Jawab",
      dataIndex: "up",
      key: "up",
    },
    {
      title: "Keterangan",
      dataIndex: "description",
      key: "desc",
      render(value, record, index) {
        return (
          <Paragraph
            ellipsis={{
              rows: 2,
              expandable: "collapsible",
            }}
            style={{ fontSize: 11 }}
          >
            {record.description}
          </Paragraph>
        );
      },
    },
    {
      title: "PKS File",
      dataIndex: "file",
      key: "file",
      render(value, record, index) {
        return (
          <Button size="small" icon={<FileFilled />} disabled={!record.file}>
            <a href={record.file || ""} />
          </Button>
        );
      },
    },
    {
      title: "Pencapaian",
      dataIndex: "Dapem",
      key: "Dapem",
    },
    {
      title: "Aksi",
      dataIndex: "id",
      key: "id",
      render(value, record, index) {
        return (
          <div className="flex gap-2">
            {hasAccess("update") && (
              <Button
                icon={<EditOutlined />}
                onClick={() =>
                  setAction({ ...action, upsert: true, selected: record })
                }
                size="small"
                type="primary"
              ></Button>
            )}
            {hasAccess("delete") && (
              <Button
                icon={<DeleteOutlined />}
                onClick={() =>
                  setAction({ ...action, delete: true, selected: record })
                }
                size="small"
                type="primary"
                danger
              ></Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Card
      title={
        <div className="flex gap-2 font-bold text-xl">
          <DatabaseOutlined /> Agent Fronting
        </div>
      }
      styles={{ body: { padding: 5 } }}
    >
      <div className="flex gap-4 justify-between">
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          className="app-master-action"
          onClick={() =>
            setAction({ ...action, upsert: true, selected: undefined })
          }
        >
          Add New
        </Button>
        <div className="flex justify-end gap-4 items-center">
          <FilterData
            buttonSize="small"
            buttonClassName="app-master-action"
            title="Filter Monitoring"
            bodyClassName="space-y-4"
            children={
              <>
                <div className="app-report-panel space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Filter utama
                      </p>
                    </div>
                    <Button
                      size="small"
                      onClick={() =>
                        setPageProps({ ...pageProps, search: "", backdate: "" })
                      }
                    >
                      Reset
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div className="app-filter-field">
                      <p>Periode</p>
                      <RangePicker
                        size="small"
                        className="app-master-picker"
                        onChange={(date, dateStr) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            backdate: dateStr,
                          })
                        }
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              </>
            }
          />
          <Input.Search
            size="small"
            className="md:w-65"
            placeholder="Cari nama..."
            onChange={(e) =>
              setPageProps({ ...pageProps, search: e.target.value })
            }
          />
        </div>
      </div>
      <div className="bg-white p-2">
        <Table
          className="app-table-modern"
          columns={columns}
          dataSource={pageProps.data}
          size="middle"
          loading={loading}
          rowKey={"id"}
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
      </div>
      <AgentFrontingModal
        action={action}
        setAction={setAction}
        sumdanOptions={sumdanOption}
        refreshData={getData}
      />
      <DeleteAgent
        record={action.selected}
        open={action.delete}
        setOpen={(val: boolean) => setAction({ ...action, delete: val })}
        getData={getData}
        modal={modal}
      ></DeleteAgent>
    </Card>
  );
}

export const AgentFrontingModal = ({
  action,
  setAction,
  sumdanOptions,
  refreshData,
}: {
  action: IActionTable<IAgentFronting>;
  setAction: Function;
  sumdanOptions: ISumdan[];
  refreshData: Function;
}) => {
  const [data, setData] = useState<IAgentFronting>(
    action.selected || defaultData,
  );

  const handleSave = async () => {
    try {
      const url = action.selected
        ? `/api/agent?id=${action.selected?.id}`
        : "/api/agent";
      const method = action.selected ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        message.success(
          `Data berhasil ${action.selected ? "diperbarui" : "disimpan"}`,
        );
        setAction({ ...action, upsert: false, selected: undefined });
        refreshData();
      } else {
        throw new Error("Gagal menyimpan data");
      }
    } catch (error) {
      console.error(error);
      message.error("Terjadi kesalahan pada server");
    }
  };

  return (
    <Modal
      title={action.selected ? "Edit Agent Fronting" : "Tambah Agent Fronting"}
      open={action.upsert}
      onOk={handleSave}
      onCancel={() =>
        setAction({ ...action, upsert: false, selected: undefined })
      }
      style={{ top: 20 }}
      okText="Simpan"
      cancelText="Batal"
      destroyOnHidden
      styles={{ body: { display: "flex", flexDirection: "column", gap: 4 } }}
    >
      <FormInput
        data={{
          label: "Nama Agent Fronting",
          value: data.name,
          onChange: (e: string) => setData({ ...data, name: e }),
          required: true,
          type: "text",
        }}
      />
      <FormInput
        data={{
          label: "Kode",
          value: data.code,
          onChange: (e: string) => setData({ ...data, code: e }),
          required: true,
          type: "text",
        }}
      />
      <FormInput
        data={{
          label: "Penanggung Jawab",
          value: data.up,
          onChange: (e: string) => setData({ ...data, up: e }),
          required: true,
          type: "text",
        }}
      />
      <FormInput
        data={{
          label: "Deskripsi",
          value: data.description,
          onChange: (e: string) => setData({ ...data, description: e }),
          required: true,
          type: "textarea",
        }}
      />
      <FormInput
        data={{
          label: "Logo",
          value: data.file,
          onChange: (e: string) => setData({ ...data, file: e }),
          required: true,
          type: "upload",
        }}
      />
    </Modal>
  );
};
export function DeleteAgent({
  record,
  open,
  setOpen,
  getData,
  modal,
}: {
  record?: IAgentFronting;
  open: boolean;
  setOpen: Function;
  getData?: Function;
  modal: HookAPI;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await fetch(`/api/agent?id=${record?.id}`, {
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
      title={"Delete User Agent " + record?.name}
    >
      <p>Are you sure you want to delete this user agent?</p>
      <div className="flex justify-end gap-4 mt-4">
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button danger onClick={handleDelete} loading={loading}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}

const defaultData: IAgentFronting = {
  id: "",
  name: "",
  code: "",
  up: "",
  description: "",
  file: "",
  SumdanAgentFronting: [],
  User: [],
  Dapem: [],

  status: true,
  created_at: new Date(),
  updated_at: new Date(),
};
