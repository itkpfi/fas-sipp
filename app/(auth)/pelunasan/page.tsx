"use client";

import { FormInput, ViewFiles } from "@/components";
import { printPelunasan } from "@/components/pdfutils/etc/printPelunasan";
import { useUser } from "@/components/UserContext";
import { FilterData } from "@/components/utils/CompUtils";
import {
  GetAngsuran,
  GetSisaPokokMargin,
  IDRFormat,
  IDRToNumber,
} from "@/components/utils/PembiayaanUtil";
import {
  IActionTable,
  IDapem,
  IPageProps,
  IPelunasan,
  IViewFiles,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  DeleteOutlined,
  DollarCircleOutlined,
  EditOutlined,
  FileFilled,
  FormOutlined,
  HistoryOutlined,
  MoneyCollectOutlined,
  PlusCircleOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  EDocStatus,
  ESettleStatus,
  ESubmissionStatus,
  Sumdan,
} from "@prisma/client";
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
  Typography,
} from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import moment from "moment";
import { useEffect, useState } from "react";
const { Paragraph } = Typography;
const { RangePicker } = DatePicker;

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<IPelunasan>>({
    page: 1,
    limit: 50,
    total: 0,
    data: [],
    search: "",
    sumdanId: "",
    status_paid: "",
    type: "",
    backdate: "",
  });
  const [action, setAction] = useState<IActionTable<IPelunasan>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [views, setViews] = useState<IViewFiles>({
    open: false,
    data: [],
  });

  const handleResetFilters = () => {
    setPageProps((prev) => ({
      ...prev,
      page: 1,
      sumdanId: "",
      status_paid: "",
      type: "",
      backdate: "",
    }));
  };
  const [loading, setLoading] = useState(false);

  const [sumdans, setSumdans] = useState<Sumdan[]>([]);
  const [dapems, setDapems] = useState<IDapem[]>([]);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/pelunasan");
  const user = useUser();

  useEffect(() => {
    (async () => {
      await fetch("/api/pelunasan", { method: "PATCH" })
        .then((res) => res.json())
        .then((res) => setDapems(res.data));
      await fetch("/api/sumdan?limit=1000")
        .then((res) => res.json())
        .then((res) => setSumdans(res.data));
    })();
  }, []);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    if (pageProps.search) params.append("search", pageProps.search);

    if (pageProps.sumdanId) params.append("sumdanId", pageProps.sumdanId);
    if (pageProps.type) params.append("type", pageProps.type);
    if (pageProps.status_paid)
      params.append("status_paid", pageProps.status_paid);
    if (pageProps.backdate) params.append("backdate", pageProps.backdate);

    const res = await fetch(`/api/pelunasan?${params.toString()}`);
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
    pageProps.type,
    pageProps.status_paid,
    pageProps.backdate,
  ]);

  const columns: TableProps<IPelunasan>["columns"] = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      className: "text-center",
      render(value, record, index) {
        return (
          <div>
            <div>{(pageProps.page - 1) * pageProps.limit + index + 1}</div>
            <div className="text-xs opacity-80">{record.id}</div>
          </div>
        );
      },
    },
    {
      title: "Pemohon",
      dataIndex: "pemohon",
      key: "pemohon",
      render(value, record, index) {
        return (
          <div>
            <div>{record.Dapem.Debitur.fullname}</div>
            <div className="text-xs opacity-80">
              @{record.Dapem.Debitur.nopen}
            </div>
          </div>
        );
      },
    },
    {
      title: "Pembiayaan",
      dataIndex: "pembiayaan",
      key: "pembiayaan",
      render(value, record, index) {
        return (
          <div>
            <div>
              <DollarCircleOutlined />{" "}
              <Tag color={"blue"}>{IDRFormat(record.Dapem.plafond)}</Tag>
            </div>
            <div>
              <HistoryOutlined />{" "}
              <Tag color={"blue"}>{record.Dapem.tenor} Bulan</Tag>
            </div>
          </div>
        );
      },
    },
    {
      title: "Angsuran",
      dataIndex: "angsuran",
      key: "angsuran",
      render(value, record, index) {
        return (
          <div className="flex flex-col gap-1">
            <Tag color={"blue"}>
              {IDRFormat(
                GetAngsuran(
                  record.Dapem.plafond,
                  record.Dapem.tenor,
                  record.Dapem.c_margin + record.Dapem.c_margin_sumdan,
                  record.Dapem.margin_type,
                  record.Dapem.rounded,
                ).angsuran,
              )}
            </Tag>
            <Tag color={"blue"} style={{ marginLeft: 2 }}>
              Ke{" "}
              {
                record.Dapem.Angsuran.filter((d) => d.date_paid !== null).sort(
                  (a, b) => b.counter - a.counter,
                )[0].counter
              }{" "}
              |
              {IDRFormat(
                record.Dapem.Angsuran.filter((a) => a.date_paid !== null).sort(
                  (a, b) => b.counter - a.counter,
                )[0].remaining,
              )}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Produk Pembiayaan",
      dataIndex: "produk",
      key: "produk",
      render(value, record, index) {
        return (
          <div>
            <div>
              {record.Dapem.ProdukPembiayaan.id}{" "}
              {record.Dapem.ProdukPembiayaan.name}
            </div>
            <div className="text-xs opacity-80">
              {record.Dapem.JenisPembiayaan.name}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status Jaminan",
      dataIndex: "jaminan",
      key: "jaminan",
      render: (_, record, i) => {
        return (
          <div className="flex gap-1 flex-col">
            <Tag
              color={
                ["UNIT", "PUSAT"].includes(record.guarantee_status)
                  ? "green"
                  : record.guarantee_status === "DELIVERY"
                    ? "blue"
                    : "orange"
              }
              variant="solid"
            >
              {record.guarantee_status}
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Status Pelunasan",
      dataIndex: "status_final",
      key: "status_final",
      render: (_, record, i) => (
        <div className="flex gap-2 flex-col">
          <Tag
            color={
              record.status_paid === "APPROVED"
                ? "green"
                : record.status_paid === "PENDING"
                  ? "orange"
                  : "red"
            }
            variant="solid"
          >
            {record.status_paid}
          </Tag>
          <div className="text-xs opacity-80">
            {record.process_at
              ? moment(record.process_at).format("DD-MM-YYYY")
              : ""}
          </div>
        </div>
      ),
    },
    {
      title: "Alasan",
      dataIndex: "type",
      key: "type",
      width: 200,
      render(value, record, index) {
        return (
          <div>
            <div>{record.type}</div>
            <Paragraph
              ellipsis={{
                rows: 1,
                expandable: "collapsible",
              }}
              style={{ fontSize: 11 }}
            >
              {record.desc}
            </Paragraph>
          </div>
        );
      },
    },
    {
      title: "Nominal Pelunasan",
      dataIndex: "pembiayaan",
      key: "pembiayaan",
      render(value, record, index) {
        return (
          <div className="flex gap-2">
            <Tag color={"blue"}>
              {IDRFormat(record.amount + record.penalty)}
            </Tag>
            <div className="opacity-80 text-xs">
              <div>Pokok: {IDRFormat(record.amount)}</div>
              <div>Penalty: {IDRFormat(record.penalty)}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: "Nominal Mitra",
      dataIndex: "pembiayaan",
      key: "pembiayaan",
      width: 200,
      render(value, record, index) {
        return (
          <div className="flex flex-col gap-1">
            <Tag color={"blue"}>{IDRFormat(record.amount_sumdan)}</Tag>
            <Paragraph
              ellipsis={{
                rows: 1,
                expandable: "collapsible",
              }}
              style={{ fontSize: 11 }}
            >
              {record.desc_sumdan}
            </Paragraph>
          </div>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => moment(date).format("DD-MM-YYYY"),
    },
    {
      title: "Berkas",
      dataIndex: "berkas",
      key: "berkas",
      render(value, record, index) {
        return (
          <div className="flex gap-2">
            <Button
              size="small"
              type="primary"
              icon={<PrinterOutlined />}
              onClick={() => printPelunasan(record)}
            ></Button>
            <Tooltip title={"Berkas Pelunasan"}>
              <Button
                size="small"
                icon={<FileFilled />}
                onClick={() =>
                  setViews({
                    open: true,
                    data: [
                      {
                        name: "Permohonan Pelunasan",
                        url: record.file_sub || "",
                      },
                      { name: "Akad", url: record.Dapem.file_contract || "" },
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
      key: "action",
      render: (_, record) => (
        <div className="flex gap-2">
          {hasAccess("update") && (
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={() =>
                setAction({ ...action, upsert: true, selected: record })
              }
            ></Button>
          )}
          {hasAccess("proses") && (
            <Button
              size="small"
              type="primary"
              icon={<FormOutlined />}
              onClick={() =>
                setAction({ ...action, proses: true, selected: record })
              }
            ></Button>
          )}
          {hasAccess("delete") && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.status_paid === "APPROVED"}
              onClick={() =>
                setAction({ ...action, delete: true, selected: record })
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
          <MoneyCollectOutlined /> Pelunasan Debitur
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
              onClick={() => setAction({ ...action, upsert: true })}
            >
              Add New
            </Button>
          )}
          <FilterData
            buttonSize="middle"
            buttonClassName="app-master-action"
            title="Filter Pelunasan"
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
                    {user && !user.sumdanId && (
                      <div className="app-filter-field">
                        <p>Mitra pembiayaan</p>
                        <Select
                          size="middle"
                          className="app-master-select"
                          placeholder="Pilih Mitra..."
                          options={sumdans.map((s) => ({
                            label: s.code,
                            value: s.id,
                          }))}
                          value={pageProps.sumdanId || undefined}
                          onChange={(e) =>
                            setPageProps({
                              ...pageProps,
                              page: 1,
                              sumdanId: e || "",
                            })
                          }
                          allowClear
                          style={{ width: "100%" }}
                        />
                      </div>
                    )}
                    <div className="app-filter-field">
                      <p>Tipe pelunasan</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Pilih tipe..."
                        options={[
                          { label: "JATUH TEMPO", value: "JATUHTEMPO" },
                          { label: "MENINGGAL", value: "MENINGGAL" },
                          { label: "TOPUP", value: "TOPUP" },
                          { label: "LEPAS", value: "LEPAS" },
                        ]}
                        value={pageProps.type || undefined}
                        onChange={(e) =>
                          setPageProps({ ...pageProps, page: 1, type: e || "" })
                        }
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="app-filter-field">
                      <p>Status pelunasan</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Pilih Status..."
                        options={[
                          { label: "Antri (PENDING)", value: "PENDING" },
                          { label: "Disetujui (APPROVED)", value: "APPROVED" },
                          { label: "Ditolak (REJECTED)", value: "REJECTED" },
                        ]}
                        value={pageProps.status_paid || undefined}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            status_paid: e || "",
                          })
                        }
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              </>
            }
          />
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
        summary={(pageData) => {
          return (
            <Table.Summary.Row className="text-xs bg-blue-400">
              <Table.Summary.Cell index={0} colSpan={2} className="text-center">
                <b>SUMMARY</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} className="text-center">
                <b>
                  {IDRFormat(
                    pageData.reduce((acc, item) => acc + item.Dapem.plafond, 0),
                  )}{" "}
                </b>
              </Table.Summary.Cell>
              <Table.Summary.Cell
                index={4}
                colSpan={5}
                className="text-center"
              ></Table.Summary.Cell>
              <Table.Summary.Cell index={6} className="text-center">
                <b>
                  <div>
                    {IDRFormat(
                      pageData.reduce(
                        (acc, item) => acc + item.amount + item.penalty,
                        0,
                      ),
                    )}
                  </div>
                </b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} className="text-center">
                <b>
                  <div>
                    {IDRFormat(
                      pageData.reduce(
                        (acc, item) => acc + item.amount_sumdan,
                        0,
                      ),
                    )}
                  </div>
                </b>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
      <UpsertData
        dapems={dapems}
        open={action.upsert}
        record={action.selected}
        getData={getData}
        setOpen={(val: boolean) =>
          setAction({ ...action, upsert: val, selected: undefined })
        }
        hook={modal}
        key={"upsert" + action.selected?.id || "upsert"}
      />
      {action.selected && action.proses && (
        <ProsesData
          dapems={dapems}
          open={action.proses}
          record={action.selected}
          getData={getData}
          setOpen={(val: boolean) =>
            setAction({ ...action, proses: val, selected: undefined })
          }
          hook={modal}
          key={"proses" + action.selected.id}
        />
      )}
      {action.selected && action.delete && (
        <DeleteData
          open={action.delete}
          data={action.selected}
          getData={getData}
          setOpen={(val: boolean) =>
            setAction({ ...action, delete: val, selected: undefined })
          }
          hook={modal}
          key={"delete" + action.selected.id}
        />
      )}
      <ViewFiles
        data={views}
        setOpen={(val: boolean) => setViews({ ...views, open: val })}
      />
    </Card>
  );
}

const UpsertData = ({
  record,
  open,
  setOpen,
  getData,
  hook,
  dapems,
}: {
  record?: IPelunasan;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
  dapems: IDapem[];
}) => {
  const [data, setData] = useState<IPelunasan>(record || defaultData);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/pelunasan", {
      method: record ? "PUT" : "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          setOpen(false);
          await getData();
          hook.success({
            title: "BERHASIL",
            content: "Data pelunasan berhasil ditambahkan",
          });
        } else {
          hook.error({ title: "ERROR!!", content: res.msg || "Server Error" });
        }
      })
      .catch((err) => {
        hook.error({ title: "ERROR!!", content: "Server Error" });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={`Data Pelunasan ${record?.id ? record.id : ""}`}
      width={1200}
      loading={loading}
      style={{ top: 20 }}
      onOk={handleSubmit}
      okButtonProps={{ disabled: !data.Dapem || !data.amount || !data.type }}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <FormInput
            data={{
              label: "Pemohon",
              type: "select",
              options: dapems.map((d) => ({
                label: `${d.Debitur.fullname} (${d.nopen})`,
                value: d.id,
              })),
              required: true,
              value: data.Dapem?.Debitur?.fullname,
              onChange: (e: string) => {
                const find = dapems.find((d) => d.id === e);
                if (find) setData({ ...data, dapemId: e, Dapem: find });
              },
            }}
          />
          <FormInput
            data={{
              label: "ID Pembiayaan",
              type: "text",
              required: true,
              disabled: true,
              value: data.Dapem?.id,
            }}
          />
          <FormInput
            data={{
              label: "Nomor Akad",
              type: "text",
              required: true,
              disabled: true,
              value: data.Dapem?.no_contract,
            }}
          />
          <FormInput
            data={{
              label: "Pembiayaan",
              type: "text",
              required: true,
              disabled: true,
              value: `${IDRFormat(data.Dapem.plafond || 0)} / ${data.Dapem.tenor || 0} Bulan`,
            }}
          />
          <FormInput
            data={{
              label: "Alasan",
              type: "select",
              required: true,
              value: data.type,
              onChange: (e: string) =>
                setData({ ...data, type: e as ESettleStatus }),
              options: [
                { label: "LEPAS", value: "LEPAS" },
                { label: "TOPUP", value: "TOPUP" },
                { label: "MENINGGAL", value: "MENINGGAL" },
                { label: "JATUHTEMPO", value: "JATUHTEMPO" },
              ],
            }}
          />
          <FormInput
            data={{
              label: "Nominal Pelunasan",
              type: "text",
              required: true,
              value: IDRFormat(data.amount),
              onChange: (e: string) =>
                setData({ ...data, amount: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Penalty Pelunasan",
              type: "text",
              required: true,
              value: IDRFormat(data.penalty),
              onChange: (e: string) =>
                setData({ ...data, penalty: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Total",
              type: "text",
              disabled: true,
              value: IDRFormat(data.penalty + data.amount),
            }}
          />
          <FormInput
            data={{
              label: "Keterangan",
              type: "textarea",
              required: true,
              value: data.desc,
              onChange: (e: string) => setData({ ...data, desc: e }),
            }}
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <FormInput
            data={{
              label: "Angsuran",
              type: "text",
              required: true,
              disabled: true,
              value: data.dapemId
                ? IDRFormat(
                    GetAngsuran(
                      data.Dapem.plafond,
                      data.Dapem.tenor,
                      data.Dapem.c_margin + data.Dapem.c_margin_sumdan,
                      data.Dapem.margin_type,
                      data.Dapem.rounded,
                    ).angsuran,
                  )
                : 0,
            }}
          />
          <FormInput
            data={{
              label: "Angsuran Ke",
              type: "text",
              required: true,
              disabled: true,
              value: data.dapemId
                ? `${GetSisaPokokMargin(data.Dapem).count} / ${data.Dapem.tenor}`
                : 0,
            }}
          />
          <FormInput
            data={{
              label: "Sisa Pokok",
              type: "text",
              required: true,
              disabled: true,
              value: IDRFormat(
                data.dapemId ? GetSisaPokokMargin(data.Dapem).principal : 0,
              ),
            }}
          />
          <FormInput
            data={{
              label: "Tunggakan",
              type: "text",
              required: true,
              disabled: true,
              value: data.dapemId
                ? (() => {
                    const val = GetSisaPokokMargin(data.Dapem);
                    return `(${val.prevcount}) P: ${IDRFormat(val.prevvalueprincipal)} | All: ${IDRFormat(val.prevvalueall)}`;
                  })()
                : 0,
            }}
          />
          <FormInput
            data={{
              label: "Penalty (5%)",
              type: "text",
              required: true,
              disabled: true,
              value: data.dapemId
                ? (() => {
                    const val = GetSisaPokokMargin(data.Dapem);
                    return `${IDRFormat(val.principal * (5 / 100))}`;
                  })()
                : 0,
            }}
          />
          <FormInput
            data={{
              label: "Est Total",
              type: "text",
              required: true,
              disabled: true,
              value: data.dapemId
                ? (() => {
                    const val = GetSisaPokokMargin(data.Dapem);
                    const penalty = val.principal * (5 / 100);
                    return `${IDRFormat(val.principal + penalty + val.prevvalueall)}`;
                  })()
                : 0,
            }}
          />
          <FormInput
            data={{
              label: "Status Jaminan",
              type: "select",
              required: true,
              options: [
                { label: "UNIT", value: "UNIT" },
                { label: "PUSAT", value: "PUSAT" },
                { label: "DELIVERY", value: "DELIVERY" },
                { label: "MITRA", value: "MITRA" },
              ],
              value: data.guarantee_status,
              onChange: (e: string) =>
                setData({
                  ...data,
                  guarantee_status: e as EDocStatus,
                }),
            }}
          />
          <FormInput
            data={{
              label: "Upload Berkas",
              type: "upload",
              required: true,
              value: data.file_sub,
              onChange: (e: string) => setData({ ...data, file_sub: e }),
            }}
          />
        </div>
      </div>
    </Modal>
  );
};
const ProsesData = ({
  record,
  open,
  setOpen,
  getData,
  hook,
  dapems,
}: {
  record: IPelunasan;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
  dapems: IDapem[];
}) => {
  const [data, setData] = useState<IPelunasan>(record);
  const [temp, setTemp] = useState({
    sisaAngsuran: 0,
    pokok: 0,
    margin: 0,
    angsuranbulan: 0,
    angsuranmitra: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/pelunasan", {
      method: "PUT",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          setOpen(false);
          await getData();
          hook.success({
            title: "BERHASIL",
            content: "Data pelunasan berhasil diperbarui",
          });
        } else {
          hook.error({ title: "ERROR!!", content: res.msg || "Server Error" });
        }
      })
      .catch((err) => {
        hook.error({ title: "ERROR!!", content: "Server Error" });
      });
    setLoading(false);
  };

  useEffect(() => {
    if (data.Dapem && data.Dapem.Angsuran) {
      const sisaangsuran = data.Dapem.Angsuran.filter(
        (d) => d.date_paid === null,
      );
      const nom = sisaangsuran.reduce((acc, curr) => acc + curr.principal, 0);
      const margin = sisaangsuran.reduce((acc, curr) => acc + curr.margin, 0);
      const angsuranbulan = GetAngsuran(
        data.Dapem.plafond,
        data.Dapem.tenor,
        data.Dapem.c_margin + data.Dapem.c_margin_sumdan,
        data.Dapem.margin_type,
        data.Dapem.rounded,
      ).angsuran;
      const angsuranmitra = GetAngsuran(
        data.Dapem.plafond,
        data.Dapem.tenor,
        data.Dapem.c_margin_sumdan,
        data.Dapem.margin_type,
        data.Dapem.rounded_sumdan,
      ).angsuran;
      setData((prev) => ({ ...prev, amount: nom, penalty: nom * (5 / 100) }));
      setTemp((prev) => ({
        ...prev,
        pokok: nom,
        margin: margin,
        angsuranbulan,
        angsuranmitra,
        sisaAngsuran: sisaangsuran.length,
      }));
    }
  }, [data.dapemId]);

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={`Data Pelunasan ${record.id}`}
      width={1200}
      style={{ top: 20 }}
      loading={loading}
      onOk={handleSubmit}
      okButtonProps={{ disabled: !data.Dapem || !data.amount_sumdan }}
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-2">
          <FormInput
            data={{
              label: "Pemohon",
              type: "select",
              options: dapems.map((d) => ({
                label: d.Debitur.fullname,
                value: d.id,
              })),
              required: true,
              disabled: true,
              value: data.Dapem?.Debitur?.fullname,
              onChange: (e: string) => {
                const find = dapems.find((d) => d.id === e);
                if (find) setData({ ...data, dapemId: e, Dapem: find });
              },
            }}
          />
          <FormInput
            data={{
              label: "ID Pembiayaan",
              type: "text",
              required: true,
              disabled: true,
              value: data.Dapem?.id,
            }}
          />
          <FormInput
            data={{
              label: "Nomor Akad",
              type: "text",
              required: true,
              disabled: true,
              value: data.Dapem?.no_contract,
            }}
          />
          <FormInput
            data={{
              label: "Alasan",
              type: "select",
              required: true,
              disabled: true,
              value: data.type,
              onChange: (e: string) =>
                setData({ ...data, type: e as ESettleStatus }),
              options: [
                { label: "LEPAS", value: "LEPAS" },
                { label: "TOPUP", value: "TOPUP" },
                { label: "MENINGGAL", value: "MENINGGAL" },
                { label: "JATUHTEMPO", value: "JATUHTEMPO" },
              ],
            }}
          />
          <FormInput
            data={{
              label: "Nominal Pelunasan",
              type: "text",
              required: true,
              disabled: true,
              value: IDRFormat(data.amount),
              onChange: (e: string) =>
                setData({ ...data, amount: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Penalty Pelunasan",
              type: "text",
              required: true,
              disabled: true,
              value: IDRFormat(data.penalty),
              onChange: (e: string) =>
                setData({ ...data, penalty: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Keterangan",
              type: "textarea",
              required: true,
              disabled: true,
              value: data.desc,
              onChange: (e: string) => setData({ ...data, desc: e }),
            }}
          />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <FormInput
            data={{
              label: "Sisa Angsuran",
              type: "number",
              required: true,
              disabled: true,
              value: temp.sisaAngsuran,
            }}
          />
          <FormInput
            data={{
              label: "Sisa Pokok",
              type: "text",
              required: true,
              disabled: true,
              value: IDRFormat(temp.pokok),
            }}
          />
          <FormInput
            data={{
              label: "Sisa Margin",
              type: "text",
              required: true,
              disabled: true,
              value: IDRFormat(temp.margin),
            }}
          />
          <FormInput
            data={{
              label: "Angsuran",
              type: "text",
              required: true,
              disabled: true,
              value: `Total: ${IDRFormat(temp.angsuranbulan)} | Mitra: ${IDRFormat(temp.angsuranmitra)}`,
            }}
          />
          <FormInput
            data={{
              label: "Nominal Pelunasan Mitra",
              type: "text",
              required: true,
              disabled: record.status_paid === "APPROVED",
              value: IDRFormat(data.amount_sumdan),
              onChange: (e: string) =>
                setData({ ...data, amount_sumdan: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Keterangan Mitra",
              type: "textarea",
              required: true,
              value: data.desc_sumdan,
              onChange: (e: string) => setData({ ...data, desc_sumdan: e }),
            }}
          />
          <FormInput
            data={{
              label: "Status Jaminan",
              type: "select",
              required: true,
              options: [
                { label: "UNIT", value: "UNIT" },
                { label: "PUSAT", value: "PUSAT" },
                { label: "DELIVERY", value: "DELIVERY" },
                { label: "MITRA", value: "MITRA" },
              ],
              value: data.guarantee_status,
              onChange: (e: string) =>
                setData({
                  ...data,
                  guarantee_status: e as EDocStatus,
                }),
            }}
          />
          <FormInput
            data={{
              label: "Status Pelunasan",
              type: "select",
              required: true,
              disabled: record.status_paid === "APPROVED",
              value: data.status_paid,
              options: [
                { label: "APPROVED", value: "APPROVED" },
                { label: "PENDING", value: "PENDING" },
                { label: "REJECTED", value: "REJECTED" },
              ],
              onChange: (e: string) =>
                setData({
                  ...data,
                  status_paid: e as ESubmissionStatus,
                  ...(e === "APPROVED" && {
                    Dapem: { ...data.Dapem, dropping_status: "PAID_OFF" },
                    process_at: new Date(),
                  }),
                }),
            }}
          />
        </div>
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
  data: IPelunasan;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await fetch("/api/pelunasan?id=" + data.id, { method: "DELETE" })
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
          content: `Internal Server Error!!. Hapus data peluansan ${data.id}) gagal`,
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
          KonfirmasiHapus Data Pelunasan ini{" "}
          <span className="font-bold">*{data.id}*</span>?
        </p>
      </div>
    </Modal>
  );
};

const defaultData: IPelunasan = {
  id: "",
  amount: 0,
  amount_sumdan: 0,
  penalty: 0,
  file_sub: null,
  type: "LEPAS",
  status_paid: "PENDING",
  created_at: new Date(),
  process_at: new Date(),
  Dapem: {} as IDapem,
  dapemId: "",
  desc: "",
  desc_sumdan: "",
  guarantee_status: "MITRA",
};
