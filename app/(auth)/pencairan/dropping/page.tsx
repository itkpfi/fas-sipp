"use client";

import { FormInput, ViewFiles } from "@/components";
import { printSIStandar } from "@/components/pdfutils/si/SIStandar";
import { FilterData } from "@/components/utils/CompUtils";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import {
  IActionTable,
  IDapem,
  IDropping,
  IPageProps,
  IViewFiles,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  DeleteOutlined,
  EditOutlined,
  FileFilled,
  FormOutlined,
  PrinterOutlined,
  SearchOutlined,
  TransactionOutlined,
} from "@ant-design/icons";
import { Sumdan } from "@prisma/client";
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
  const [pageProps, setPageProps] = useState<IPageProps<IDropping>>({
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
  const [action, setAction] = useState<IActionTable<IDropping>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [views, setViews] = useState<IViewFiles>({
    open: false,
    data: [],
  });
  const { hasAccess } = useAccess("/pencairan/dropping");
  const { modal } = App.useApp();

  const handleResetFilters = () => {
    setPageProps((prev) => ({
      ...prev,
      page: 1,
      sumdanId: "",
      backdate: "",
      status: "",
    }));
  };

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) params.append("search", pageProps.search);

    if (pageProps.sumdanId) params.append("sumdanId", pageProps.sumdanId);
    if (pageProps.backdate) params.append("backdate", pageProps.backdate);
    if (pageProps.status) params.append("status", pageProps.status);

    const res = await fetch(`/api/dropping?${params.toString()}`);
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

  const columnDropping: TableProps<IDropping>["columns"] = [
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
      title: "Plafond & Dropping",
      key: "plafond",
      dataIndex: "plafond",
      render(value, record, index) {
        const total = record.Dapem.reduce((acc, curr) => acc + curr.plafond, 0);
        const biaya = record.Dapem.reduce(
          (acc, curr) =>
            acc + (curr.plafond * (curr.c_adm_sumdan / 100) + curr.c_account),
          0,
        );
        return (
          <div>
            <div className="flex justify-between gap-2">
              <span className="text-xs opacity-80">Plafond:</span>{" "}
              <Tag color={"blue"}>{IDRFormat(total)}</Tag>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-xs opacity-80">Dropping:</span>{" "}
              <Tag color={"blue"}>{IDRFormat(total - biaya)}</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Adm Mitra & Rekening",
      key: "adm",
      dataIndex: "adm",
      render(value, record, index) {
        const adm = record.Dapem.reduce(
          (acc, curr) => acc + curr.plafond * (curr.c_adm_sumdan / 100),
          0,
        );
        const rek = record.Dapem.reduce((acc, curr) => acc + curr.c_account, 0);
        const prov = record.Dapem.reduce(
          (acc, curr) => acc + curr.c_provisi,
          0,
        );
        return (
          <div className="text-xs">
            <div className="flex justify-between gap-4s">
              <span className="w-20">Admin :</span>
              <span>{IDRFormat(adm)}</span>
            </div>
            <div className="flex justify-between gap-4s">
              <span className="w-20">Rek :</span>
              <span>{IDRFormat(rek)}</span>
            </div>
            <div className="flex justify-between gap-4s">
              <span className="w-20">Provisi :</span>
              <span>{IDRFormat(prov)}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Status Dropping",
      dataIndex: "pencairan_status",
      key: "pencairan_status",
      width: 180,
      render: (_, record, i) => (
        <div className="flex gap-2">
          <Tag color={record.status ? "green" : "orange"} variant="solid">
            {record.status ? "PAID" : "PENDING"}
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
            <Tooltip title="Cetak SI">
              <Button
                icon={<PrinterOutlined />}
                size="small"
                type="primary"
                className="app-table-action-btn"
                onClick={() => printSIStandar(record)}
              ></Button>
            </Tooltip>
            <Tooltip title="Berkas Akad & Dropping">
              <Button
                icon={<FileFilled />}
                size="small"
                type="primary"
                className="app-table-action-btn"
                onClick={() =>
                  setViews({
                    open: true,
                    data: [
                      { name: "Berkas SI", url: record.file_sub || "" },
                      { name: "Bukti Transfer", url: record.file_proof || "" },
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
                className="app-table-action-btn"
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
                className="app-table-action-btn"
                onClick={() =>
                  setAction({ ...action, proses: true, selected: record })
                }
              ></Button>
            )}
            {hasAccess("delete") && (
              <Button
                icon={<DeleteOutlined />}
                danger
                type="primary"
                size="small"
                className="app-table-action-btn"
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
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <TransactionOutlined /> Permohonan Dropping
        </div>
      }
      className="app-master-card"
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2 flex-wrap">
          <FilterData
            buttonSize="middle"
            buttonClassName="app-master-action"
            title="Filter Dropping"
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
                    <Button size="small" onClick={handleResetFilters}>
                      Reset
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    <div className="app-filter-field">
                      <p>Periode</p>
                      <RangePicker
                        size="middle"
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
                    <div className="app-filter-field">
                      <p>Status dropping</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Pilih Status..."
                        options={[
                          { label: "PENDING", value: "false" },
                          { label: "PAID", value: "true" },
                        ]}
                        value={pageProps.status || undefined}
                        style={{ width: "100%" }}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            status: e || "",
                          })
                        }
                        allowClear
                      />
                    </div>
                    {hasAccess("update") && (
                      <div className="app-filter-field">
                        <p>Mitra pembiayaan</p>
                        <Select
                          size="middle"
                          className="app-master-select"
                          onChange={(e: string) =>
                            setPageProps({
                              ...pageProps,
                              page: 1,
                              sumdanId: e || "",
                            })
                          }
                          value={pageProps.sumdanId || undefined}
                          allowClear
                          placeholder="Pilih Sumdan..."
                          options={sumdans.map((s) => ({
                            label: s.code,
                            value: s.id,
                          }))}
                          style={{ width: "100%" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            }
          />
        </div>
        <div className="app-master-toolbar-search md:max-w-xs">
          <Input
            size="middle"
            className="app-master-search"
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Cari nama..."
            allowClear
            onChange={(e) =>
              setPageProps({ ...pageProps, search: e.target.value })
            }
          />
        </div>
      </div>
      <Table
        className="app-master-table"
        columns={columnDropping}
        dataSource={pageProps.data}
        size="middle"
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
        loading={loading}
        expandable={{
          expandedRowRender: (record) => <TableDapem data={record.Dapem} />,
          rowExpandable: (record) => record.Dapem.length !== 0,
        }}
        summary={(pageData) => {
          const plaf = pageData
            .flatMap((p) => p.Dapem)
            .reduce((acc, curr) => acc + curr.plafond, 0);
          const drop = pageData
            .flatMap((p) => p.Dapem)
            .reduce(
              (acc, curr) =>
                acc +
                (curr.plafond -
                  (curr.plafond * (curr.c_adm_sumdan / 100) +
                    curr.c_account +
                    curr.c_provisi)),
              0,
            );
          const adm = pageData
            .flatMap((p) => p.Dapem)
            .reduce(
              (acc, curr) => acc + curr.plafond * (curr.c_adm_sumdan / 100),
              0,
            );
          const rek = pageData
            .flatMap((p) => p.Dapem)
            .reduce((acc, curr) => acc + curr.c_account, 0);
          const prov = pageData
            .flatMap((p) => p.Dapem)
            .reduce((acc, curr) => acc + curr.c_provisi, 0);

          return (
            <Table.Summary.Row className="text-xs bg-blue-400">
              <Table.Summary.Cell index={0} colSpan={4} className="text-center">
                <b>SUMMARY</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} className="text-right font-bold">
                <div>{IDRFormat(plaf)}</div>
                <div>{IDRFormat(drop)}</div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} className="text-right font-bold">
                <div className="flex justify-between gap-2">
                  <div>Admin :</div>
                  <div className="text-right">{IDRFormat(adm)}</div>
                </div>
                <div className="flex justify-between gap-2">
                  <div>Rek :</div>
                  <div className="text-right">{IDRFormat(rek)}</div>
                </div>
                <div className="flex justify-between gap-2">
                  <div>Provisi :</div>
                  <div className="text-right">{IDRFormat(prov)}</div>
                </div>
                <div className="border-t border-dashed">
                  {IDRFormat(adm + rek + prov)}
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
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
  record: IDropping;
  hook: HookAPI;
  getData: Function;
}) => {
  const [data, setData] = useState<IDropping>(record);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/dropping?id=" + record.id, {
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
      title={"Update Dropping " + data.id}
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
            label: "ID/Nomor SI",
            type: "text",
            required: true,
            value: data.id,
            disabled: record.status,
            onChange: (e: string) => setData({ ...data, id: e }),
          }}
        />
        <FormInput
          data={{
            label: "Tanggal Permohonan",
            type: "date",
            required: true,
            disabled: record.status,
            value: moment(data.created_at).format("YYYY-MM-DD"),
            onChange: (e: string) =>
              setData({ ...data, created_at: new Date(e) }),
          }}
        />
        <FormInput
          data={{
            label: "Berkas SI",
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
  record: IDropping;
  hook: HookAPI;
  getData: Function;
}) => {
  const [data, setData] = useState<IDropping>(record);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const nextStatus = true;
    const nextData: IDropping = {
      ...data,
      status: nextStatus,
      Dapem:
        record.status === nextStatus
          ? data.Dapem
          : data.Dapem.map((d) => ({
              ...d,
              dropping_status: "APPROVED",
            })),
      process_at: !record.status ? new Date() : data.process_at,
    };

    await fetch("/api/dropping", {
      method: "PUT",
      body: JSON.stringify(nextData),
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
      title={"Proses Dropping " + data.id}
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
            label: "Bukti Dropping",
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
  data: IDropping;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await fetch("/api/dropping?id=" + data.id, { method: "DELETE" })
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
          content: `Internal Server Error!!. Hapus data dropping ${data.id}) gagal`,
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
          Konfirmasi Hapus Data Dropping ini{" "}
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
      title: "Produk Pembiayaan",
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
      title: "Pembiayaan",
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
      title: "Adm Mitra & Rekening",
      key: "admsumdan",
      dataIndex: "admsumdan",
      render(value, record, index) {
        return (
          <div>
            <div>
              <span className="text-xs opacity-80">Adm:</span>
              <Tag color={"blue"}>
                {IDRFormat(record.plafond * (record.c_adm_sumdan / 100))}
              </Tag>
            </div>
            <div>
              <span className="text-xs opacity-80">Rek:</span>
              <Tag color={"blue"}>{IDRFormat(record.c_account)}</Tag>
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
              type="primary"
              className="app-table-action-btn"
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
        className="app-master-table"
        pagination={false}
        size="middle"
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
