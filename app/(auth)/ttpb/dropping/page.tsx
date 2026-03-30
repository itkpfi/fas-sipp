"use client";

import { FormInput, ViewFiles } from "@/components";
import { printSDStandar } from "@/components/pdfutils/si/SDStandar";
import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";
import {
  IActionTable,
  IDapem,
  IDocument,
  IPageProps,
  IViewFiles,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  DeleteOutlined,
  EditOutlined,
  FileFilled,
  FolderOpenOutlined,
  FormOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { EDocStatus, Sumdan } from "@prisma/client";
import {
  App,
  Button,
  Card,
  DatePicker,
  Input,
  Modal,
  Select,
  Table,
  TableProps,
  Tag,
  Tooltip,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import moment from "moment";
import { useEffect, useState } from "react";
const { RangePicker } = DatePicker;

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<IDocument>>({
    page: 1,
    limit: 50,
    data: [],
    total: 0,
    search: "",
    sumdanId: "",
    backdate: "",
    status: "",
  });
  const [loading, setLoading] = useState(false);
  const [sumdans, setSumdans] = useState<Sumdan[]>([]);
  const [action, setAction] = useState<IActionTable<IDocument>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [views, setViews] = useState<IViewFiles>({
    open: false,
    data: [],
  });
  const { hasAccess } = useAccess("/ttpb/dropping");
  const { modal } = App.useApp();

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) params.append("search", pageProps.search);

    if (pageProps.sumdanId) params.append("sumdanId", pageProps.sumdanId);
    if (pageProps.backdate) params.append("backdate", pageProps.backdate);
    if (pageProps.status) params.append("status", pageProps.status);

    const res = await fetch(`/api/ttpb?${params.toString()}`);
    const json = await res.json();
    setPageProps((prev) => ({
      ...prev,
      data: json.data,
      total: json.total,
    }));
    console.log({ json });
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [
    pageProps.page,
    pageProps.limit,
    pageProps.search,
    pageProps.sumdanId,
    pageProps.backdate,
    pageProps.status,
  ]);

  useEffect(() => {
    (async () => {
      await fetch("/api/sumdan")
        .then((res) => res.json())
        .then((res) => setSumdans(res.data));
    })();
  }, []);

  const columnDropping: TableProps<IDocument>["columns"] = [
    {
      title: "Mitra",
      key: "sumdan",
      dataIndex: ["Sumdan", "name"],
    },
    {
      title: "Nomor SI",
      key: "id",
      dataIndex: "id",
    },
    {
      title: "End User",
      key: "enduser",
      dataIndex: "enduser",
      className: "text-center",
      render(value, record, index) {
        return <>{record.Dapem.length}</>;
      },
    },
    {
      title: "Plafond & Angsuran",
      key: "plafond",
      dataIndex: "plafond",
      render(value, record, index) {
        const total = record.Dapem.reduce((acc, curr) => acc + curr.plafond, 0);
        const angsuran = record.Dapem.reduce(
          (acc, curr) =>
            acc +
            GetAngsuran(
              curr.plafond,
              curr.tenor,
              curr.c_margin + curr.c_margin_sumdan,
              curr.margin_type,
              curr.rounded,
            ).angsuran,
          0,
        );
        return (
          <div>
            <div>
              <span className="text-xs opacity-80">Plafond:</span>{" "}
              <Tag color={"blue"}>{IDRFormat(total)}</Tag>
            </div>
            <div>
              <span className="text-xs opacity-80">Angsuran:</span>{" "}
              <Tag color={"blue"}>{IDRFormat(angsuran)}</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Status Berkas",
      dataIndex: "status",
      key: "status",
      width: 180,
      render: (_, record, i) => (
        <div className="flex gap-2">
          <Tag
            color={
              record.status === "MITRA"
                ? "green"
                : record.status === "DELIVERY"
                  ? "blue"
                  : "orange"
            }
            variant="solid"
          >
            {record.status}
          </Tag>
          <span className="text-xs opacity-80">
            {record.process_at
              ? moment(record.process_at).format("DD-MM-YYYY HH:mm")
              : ""}
          </span>
        </div>
      ),
    },
    {
      title: "Created",
      key: "created_at",
      dataIndex: "created_at",
      render(value, record, index) {
        return <>{moment(record.created_at).format("DD/MM/YYYY")}</>;
      },
    },
    {
      title: "Berkas",
      key: "berkas",
      dataIndex: "berkas",
      render(value, record, index) {
        return (
          <div className="flex gap-2">
            <Tooltip title="Cetak SD">
              <Button
                icon={<PrinterOutlined />}
                size="small"
                type="primary"
                onClick={() => printSDStandar(record)}
              ></Button>
            </Tooltip>
            <Tooltip title="Berkas Akad & SD">
              <Button
                icon={<FileFilled />}
                size="small"
                onClick={() =>
                  setViews({
                    open: true,
                    data: [
                      { name: "Berkas SD", url: record.file_sub || "" },
                      { name: "Tanda Terima", url: record.file_proof || "" },
                      ...record.Dapem.map((d) => ({
                        name: "PK " + d.id,
                        url: d.file_contract || "",
                      })),
                    ],
                  })
                }
              ></Button>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "Aksi",
      key: "proses",
      dataIndex: "proses",
      render(value, record, index) {
        return (
          <div className="flex justify-center gap-2">
            {hasAccess("update") && (
              <Button
                icon={<EditOutlined />}
                type="primary"
                size="small"
                onClick={() =>
                  setAction({ ...action, upsert: true, selected: record })
                }
              ></Button>
            )}
            {hasAccess("proses") && (
              <Button
                icon={<FormOutlined />}
                type="primary"
                size="small"
                onClick={() =>
                  setAction({ ...action, proses: true, selected: record })
                }
              ></Button>
            )}
            {hasAccess("delete") && (
              <Button
                icon={<DeleteOutlined />}
                danger
                size="small"
                onClick={() =>
                  setAction({ ...action, delete: true, selected: record })
                }
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
          <FolderOpenOutlined /> Sending Document
        </div>
      }
      styles={{ body: { padding: 5 } }}
    >
      <div className="flex justify-between items-center my-1 gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <RangePicker
            size="small"
            onChange={(date, dateStr) =>
              setPageProps({ ...pageProps, backdate: dateStr })
            }
            style={{ width: 170 }}
          />
          <Select
            size="small"
            placeholder="Pilih Status..."
            options={[
              { label: "PUSAT", value: "PUSAT" },
              { label: "DELIVERY", value: "DELIVERY" },
              { label: "MITRA", value: "MITRA" },
            ]}
            style={{ width: 170 }}
            onChange={(e) => setPageProps({ ...pageProps, status: e })}
            allowClear
          />
          {hasAccess("update") && (
            <Select
              size="small"
              onChange={(e: string) =>
                setPageProps({ ...pageProps, sumdanId: e })
              }
              allowClear
              placeholder="Pilih Sumdan..."
              options={sumdans.map((s) => ({ label: s.code, value: s.id }))}
              style={{ width: 170 }}
            />
          )}
        </div>
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
        columns={columnDropping}
        dataSource={pageProps.data}
        size="small"
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
        loading={loading}
        expandable={{
          expandedRowRender: (record) => <TableDapem data={record.Dapem} />,
          rowExpandable: (record) => record.Dapem.length !== 0,
        }}
      />
      <ViewFiles
        setOpen={(v: boolean) => setViews({ ...views, open: v })}
        data={{ ...views }}
      />
      {action.selected && action.upsert && (
        <UpsertDropping
          getData={getData}
          record={action.selected}
          open={action.upsert}
          setOpen={(e: boolean) =>
            setAction({ ...action, selected: undefined, upsert: false })
          }
          hook={modal}
          key={"update" + action.selected.id}
        />
      )}
      {action.selected && action.proses && (
        <ProsesDropping
          getData={getData}
          record={action.selected}
          open={action.proses}
          setOpen={(e: boolean) =>
            setAction({ ...action, selected: undefined, proses: false })
          }
          hook={modal}
          key={"proses" + action.selected.id}
        />
      )}
      {action.selected && action.delete && (
        <DeleteData
          getData={getData}
          data={action.selected}
          open={action.delete}
          setOpen={(e: boolean) =>
            setAction({ ...action, selected: undefined, delete: false })
          }
          hook={modal}
          key={"delete" + action.selected.id}
        />
      )}
    </Card>
  );
}

const UpsertDropping = ({
  open,
  setOpen,
  record,
  hook,
  getData,
}: {
  open: boolean;
  setOpen: Function;
  record: IDocument;
  hook: HookAPI;
  getData: Function;
}) => {
  const [data, setData] = useState<IDocument>(record);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/ttpb?id=" + record.id, {
      method: "PUT",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          hook.success({ title: "BEHASIL", content: res.msg });
          setOpen(false);
          await getData();
        } else {
          hook.error({ title: "ERROR!", content: res.msg });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({ title: "ERROR!", content: "Internal Server Error!" });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={"Update SD " + data.id}
      style={{ top: 20 }}
      loading={loading}
      onOk={handleSubmit}
    >
      <div className="m-2 flex flex-col gap-2">
        <FormInput
          data={{
            label: "Pemohon",
            type: data.Dapem.length > 2 ? "textarea" : "text",
            required: true,
            value: data.Dapem.flatMap((d) => d.Debitur.fullname).join(" | "),
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "ID/Nomor SD",
            type: "text",
            required: true,
            value: data.id,
            disabled: record.status === "DELIVERY",
            onChange: (e: string) => setData({ ...data, id: e }),
          }}
        />
        <FormInput
          data={{
            label: "Tanggal Permohonan",
            type: "date",
            required: true,
            disabled: record.status === "DELIVERY",
            value: moment(data.created_at).format("YYYY-MM-DD"),
            onChange: (e: string) =>
              setData({ ...data, created_at: new Date(e) }),
          }}
        />
        <FormInput
          data={{
            label: "Berkas SD",
            type: "upload",
            accept: "application/pdf",
            required: true,
            value: data.file_sub,
            onChange: (e: string) => setData({ ...data, file_sub: e }),
          }}
        />
      </div>
    </Modal>
  );
};
const ProsesDropping = ({
  open,
  setOpen,
  record,
  hook,
  getData,
}: {
  open: boolean;
  setOpen: Function;
  record: IDocument;
  hook: HookAPI;
  getData: Function;
}) => {
  const [data, setData] = useState<IDocument>(record);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    if (record.status !== data.status) {
      data.Dapem = data.Dapem.map((d) => ({
        ...d,
        document_status: data.status,
      }));
    }
    if (record.status !== data.status) data.process_at = new Date();

    await fetch("/api/ttpb", {
      method: "PUT",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          hook.success({ title: "BEHASIL", content: res.msg });
          setOpen(false);
          await getData();
        } else {
          hook.error({ title: "ERROR!", content: res.msg });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({ title: "ERROR!", content: "Internal Server Error!" });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={"Proses SD " + data.id}
      style={{ top: 20 }}
      loading={loading}
      onOk={handleSubmit}
    >
      <div className="m-2 flex flex-col gap-2">
        <FormInput
          data={{
            label: "Pemohon",
            type: data.Dapem.length > 2 ? "textarea" : "text",
            required: true,
            value: data.Dapem.flatMap((d) => d.Debitur.fullname).join(" | "),
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "Status Proses",
            type: "select",
            required: true,
            disabled: record.status === "MITRA",
            options: [
              { label: "PUSAT", value: "PUSAT" },
              { label: "DELIVERY", value: "DELIVERY" },
              { label: "MITRA", value: "MITRA" },
            ],
            value: data.status,
            onChange: (e: string) =>
              setData({ ...data, status: e as EDocStatus }),
          }}
        />
        <FormInput
          data={{
            label: "Tanda Terima",
            type: "upload",
            accept: "application/pdf",
            required: true,
            value: data.file_proof,
            onChange: (e: string) => setData({ ...data, file_proof: e }),
          }}
        />
      </div>
    </Modal>
  );
};

const DeleteData = ({
  data,
  open,
  setOpen,
  getData,
  hook,
}: {
  data: IDocument;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await fetch("/api/ttpb?id=" + data.id, { method: "DELETE" })
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
          content: `Internal Server Error!!. Hapus data sending document ${data.id}) gagal`,
        });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title="Konfirmasi Permohonan"
      loading={loading}
      onOk={handleDelete}
    >
      <div className="my-4">
        <p>
          Konfirmasi Hapus Data Sending Document ini{" "}
          <span className="font-bold">*{data.id}*</span>?
        </p>
      </div>
    </Modal>
  );
};

const TableDapem = ({ data }: { data: IDapem[] }) => {
  const [views, setViews] = useState<IViewFiles>({
    open: false,
    data: [],
  });

  const columnDapem: TableProps<IDapem>["columns"] = [
    {
      title: "ID",
      key: "id",
      dataIndex: "id",
    },
    {
      title: "Pemohon",
      key: "pemohon",
      dataIndex: "pemohon",
      render(value, record, index) {
        return (
          <div>
            <div>{record.Debitur.fullname}</div>
            <div className="opacity-80 text-xs">@{record.nopen}</div>
          </div>
        );
      },
    },
    {
      title: "ProdukPembiayaan",
      key: "produk",
      dataIndex: "produk",
      render(value, record, index) {
        return (
          <div>
            <div>{record.ProdukPembiayaan.name}</div>
            <div className="opacity-80 text-xs">
              {record.JenisPembiayaan.name}
            </div>
          </div>
        );
      },
    },
    {
      title: "Plafond",
      key: "plafond",
      dataIndex: "plafond",
      render(value, record, index) {
        return (
          <div>
            <div>{IDRFormat(record.plafond)}</div>
            <div>{record.tenor} Bulan</div>
          </div>
        );
      },
    },
    {
      title: "Tgl Realisasi",
      key: "tgl",
      dataIndex: "tgl",
      render(value, record, index) {
        return (
          <div className="text-xs italic opacity-80">
            <div>Akad {moment(record.date_contract).format("DD/MM/YYYY")}</div>
            <div>
              Realisai{" "}
              {moment(record.Dropping?.process_at).format("DD/MM/YYYY")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Akad",
      dataIndex: "akad",
      key: "akad",
      render(value, record, index) {
        return (
          <div className="flex gap-2">
            <Button
              icon={<FileFilled />}
              size="small"
              disabled={!record.file_contract}
              onClick={() =>
                setViews({
                  open: true,
                  data: [
                    { name: "Berkas Akad", url: record.file_contract || "" },
                  ],
                })
              }
            ></Button>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ marginLeft: 10 }}>
      <Table
        bordered
        pagination={false}
        rowKey={"id"}
        columns={columnDapem}
        dataSource={data}
      />
      <ViewFiles
        setOpen={(v: boolean) => setViews({ ...views, open: v })}
        data={{ ...views }}
      />
    </div>
  );
};
