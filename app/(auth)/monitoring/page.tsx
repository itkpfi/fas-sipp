"use client";

import { FormInput, ViewFiles } from "@/components";
import { printContract } from "@/components/pdfutils/akad/Akad";
import { printForm } from "@/components/pdfutils/etc/printForm";
import { printMonitoring } from "@/components/pdfutils/etc/printMonitoring";
import { useUser } from "@/components/UserContext";
import {
  ExportToExcel,
  FilterData,
  GetDroppingStatusTag,
  GetStatusTag,
  MappingToExcelDapem,
} from "@/components/utils/CompUtils";
import { DetailDapem } from "@/components/utils/LayoutUtils";
import {
  GetAngsuran,
  GetRoman,
  IDRFormat,
} from "@/components/utils/PembiayaanUtil";
import {
  IActionTable,
  IDapem,
  IDesc,
  IPageProps,
  IViewFiles,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";

import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  FileFilled,
  FolderOutlined,
  PayCircleOutlined,
  PlusCircleOutlined,
  PrinterOutlined,
  ReadOutlined,
  RobotOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { JenisPembiayaan, Sumdan } from "@prisma/client";
import {
  App,
  Button,
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
import Link from "next/link";
import { useEffect, useState } from "react";
const { Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface IActionTableAkad<T> extends IActionTable<T> {
  cetakAkad: boolean;
}

const getEffectiveDroppingStatus = (item: IDapem) => {
  if (item.approv_status !== "APPROVED") {
    if (["PROCCESS", "APPROVED", "PAID_OFF"].includes(item.dropping_status)) {
      return "PENDING";
    }
  }

  return item.dropping_status;
};

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<IDapem>>({
    page: 1,
    limit: 50,
    total: 0,
    data: [],
    search: "",
    sumdanId: "",
    jenisPembiayaanId: "",
    dropping_status: "",
    backdate: "",
  });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IActionTableAkad<IDapem>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
    cetakAkad: false,
  });
  const [sumdans, setSumdans] = useState<Sumdan[]>([]);
  const [jeniss, setJeniss] = useState<JenisPembiayaan[]>([]);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/monitoring");
  const user = useUser();
  const [views, setViews] = useState<IViewFiles>({
    open: false,
    data: [],
  });

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    params.append("currmont", "ya");
    if (pageProps.search) params.append("search", pageProps.search);

    if (pageProps.sumdanId) params.append("sumdanId", pageProps.sumdanId);
    if (pageProps.jenisPembiayaanId)
      params.append("jenisPembiayaanId", pageProps.jenisPembiayaanId);
    if (pageProps.dropping_status)
      params.append("dropping_status", pageProps.dropping_status);
    if (pageProps.backdate) params.append("backdate", pageProps.backdate);

    const res = await fetch(`/api/dapem?${params.toString()}`);
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
    pageProps.jenisPembiayaanId,
    pageProps.dropping_status,
    pageProps.backdate,
  ]);

  useEffect(() => {
    (async () => {
      await fetch("/api/sumdan")
        .then((res) => res.json())
        .then((res) => setSumdans(res.data));
      await fetch("/api/jenis")
        .then((res) => res.json())
        .then((res) => setJeniss(res.data));
    })();
  }, []);

  const columns: TableProps<IDapem>["columns"] = [
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
      title: "Pemohon",
      dataIndex: "pemohon",
      key: "pemohon",
      render(value, record, index) {
        return (
          <div>
            <p className="font-bold">{record.Debitur.fullname}</p>
            <div className="text-xs opacity-80">
              <p>@{record.Debitur.nopen}</p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Permohonan",
      dataIndex: "permohonan",
      key: "permohonan",
      render(value, record, index) {
        return (
          <div>
            <div>
              Plafond : <Tag color={"blue"}>{IDRFormat(record.plafond)}</Tag>
            </div>
            <div>
              Tenor : <Tag color={"blue"}>{record.tenor} Bulan</Tag>
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
        const total = GetAngsuran(
          record.plafond,
          record.tenor,
          record.c_margin + record.c_margin_sumdan,
          record.margin_type,
          record.rounded,
        ).angsuran;
        const mitra = GetAngsuran(
          record.plafond,
          record.tenor,
          record.c_margin_sumdan,
          record.margin_type,
          record.rounded_sumdan,
        ).angsuran;
        return (
          <div className="text-xs">
            <div>
              Total : <Tag color={"blue"}>{IDRFormat(total)}</Tag>
            </div>
            <div>
              Mitra : <Tag color={"blue"}> {IDRFormat(mitra)}</Tag>
            </div>
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
            <p>
              {record.ProdukPembiayaan.name}{" "}
              <span>({record.ProdukPembiayaan.Sumdan.code})</span>
            </p>
            <p className="opacity-80 text-xs">{record.JenisPembiayaan.name}</p>
          </div>
        );
      },
    },
    {
      title: "AO & UP",
      dataIndex: "aoup",
      key: "aoup",
      render(value, record, index) {
        return (
          <div>
            <div>{record.AO.fullname}</div>
            <div className="text-xs opacity-80">
              {record.AO.Cabang.name} | {record.AO.Cabang.Area.name}
            </div>
          </div>
        );
      },
    },
    {
      title: "Status VERIFIKASI",
      dataIndex: "verif_status",
      key: "verif_status",
      width: 250,
      onHeaderCell: () => ({
        style: {
          background: 'linear-gradient(135deg, #16a34a, #22c55e)' as string,
          color: '#ffffff',
          borderBottom: '2px solid #15803d',
          textShadow: '0 1px 2px rgba(0,0,0,0.15)',
        } as React.CSSProperties,
      }),
      render: (_, record, i) => {
        const temp = record.verif_desc
          ? (JSON.parse(record.verif_desc) as IDesc)
          : null;
        return (
          <div className="flex gap-1">
            {GetStatusTag(record.verif_status)}
            {temp && (
              <Paragraph
                ellipsis={{
                  rows: 2,
                  expandable: "collapsible",
                }}
                style={{ fontSize: 11 }}
              >
                {temp.desc}
                <p>
                  (By {temp.name} at {moment(temp.date).format("DD/MM/YYYY")})
                </p>
              </Paragraph>
            )}
          </div>
        );
      },
    },
    {
      title: "Status SLIK",
      dataIndex: "slik_status",
      key: "slik_status",
      width: 250,
      onHeaderCell: () => ({
        style: {
          background: 'linear-gradient(135deg, #0284c7, #0ea5e9)' as string,
          color: '#ffffff',
          borderBottom: '2px solid #0369a1',
          textShadow: '0 1px 2px rgba(0,0,0,0.15)',
        } as React.CSSProperties,
      }),
      render: (_, record, i) => {
        const temp = record.slik_desc
          ? (JSON.parse(record.slik_desc) as IDesc)
          : null;
        return (
          <div className="flex gap-1">
            {GetStatusTag(record.slik_status)}
            {temp && (
              <Paragraph
                ellipsis={{
                  rows: 2,
                  expandable: "collapsible",
                }}
                style={{ fontSize: 11 }}
              >
                {temp.desc}
                <p>
                  (By {temp.name} at {moment(temp.date).format("DD/MM/YYYY")})
                </p>
              </Paragraph>
            )}
          </div>
        );
      },
    },
    {
      title: "Status APPROVAL",
      dataIndex: "approvel_status",
      key: "approvel_status",
      width: 250,
      onHeaderCell: () => ({
        style: {
          background: 'linear-gradient(135deg, #475569, #64748b)' as string,
          color: '#ffffff',
          borderBottom: '2px solid #334155',
          textShadow: '0 1px 2px rgba(0,0,0,0.15)',
        } as React.CSSProperties,
      }),
      render: (_, record, i) => {
        const temp = record.approv_desc
          ? (JSON.parse(record.approv_desc) as IDesc)
          : null;
        return (
          <div className="flex gap-1">
            {GetStatusTag(record.approv_status)}
            {temp && (
              <Paragraph
                ellipsis={{
                  rows: 2,
                  expandable: "collapsible",
                }}
                style={{ fontSize: 11 }}
              >
                {temp.desc}
                <p>
                  (By {temp.name} at {moment(temp.date).format("DD/MM/YYYY")})
                </p>
              </Paragraph>
            )}
          </div>
        );
      },
    },
    {
      title: "Status Dropping",
      dataIndex: "dropping_status",
      key: "dropping_status",
      width: 180,
      onHeaderCell: () => ({
        style: {
          background: 'linear-gradient(135deg, #db2777, #ec4899)' as string,
          color: '#ffffff',
          borderBottom: '2px solid #be185d',
          textShadow: '0 1px 2px rgba(0,0,0,0.15)',
        } as React.CSSProperties,
      }),
      render: (_, record, i) => {
        const effectiveDroppingStatus = getEffectiveDroppingStatus(record);
        return (
          <div className="flex gap-1">
            {GetDroppingStatusTag(effectiveDroppingStatus)}
            {effectiveDroppingStatus !== "PENDING" && record.Dropping && record.Dropping.process_at && (
              <div className="text-xs">
                {moment(record.Dropping.process_at).format("DD/MM/YYYY HH:mm")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Berkas Akad",
      dataIndex: "akad",
      key: "akad",
      render(value, record, index) {
        return (
          <div>
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
              {hasAccess("update") && (
                <Button
                  icon={<PrinterOutlined />}
                  type="primary"
                  size="small"
                  onClick={() =>
                    setSelected({
                      ...selected,
                      selected: record,
                      cetakAkad: true,
                    })
                  }
                ></Button>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Nomor Akad",
      dataIndex: "dataakad",
      key: "dataakad",
      render(value, record, index) {
        return (
          <div>
            {record.no_contract && <div>{record.no_contract}</div>}
            {record.date_contract && (
              <div className="text-xs opacity-80">
                {moment(record.date_contract).format("DD/MM/YYYY")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Mutasi & Takeover",
      dataIndex: "produk",
      key: "produk",
      width: 350,
      render(value, record, index) {
        return (
          <div>
            {record.JenisPembiayaan.status_mutasi && (
              <div style={{ fontSize: 9 }}>
                <SwapOutlined />{" "}
                <Tag style={{ fontSize: 9 }} color={"red"}>
                  {record.mutasi_from}
                </Tag>{" "}
                <ArrowRightOutlined style={{ fontSize: 9 }} />{" "}
                <Tag style={{ fontSize: 9 }} color={"blue"}>
                  {record.mutasi_to}
                </Tag>
              </div>
            )}
            {record.JenisPembiayaan.status_takeover && (
              <div style={{ fontSize: 9 }}>
                <PayCircleOutlined />{" "}
                <Tag color={"blue"} style={{ fontSize: 9 }}>
                  {record.takeover_from} (
                  {moment(record.takeover_date).format("DD/MM/YYYY")})
                </Tag>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render(value, record, index) {
        return (
          <div>
            <div>{record.CreatedBy.fullname}</div>
            <div className="opacity-80 text-xs">
              {moment(record.created_at).format("DD/MM/YYYY")}
            </div>
          </div>
        );
      },
    },
    {
      title: "Aksi",
      key: "action",
      width: 100,
      render: (_, record) => (
        <div className="flex gap-1 flex-wrap justify-center">
          {hasAccess("write") && (
            <Button
              icon={<PrinterOutlined />}
              type="primary"
              size="small"
              onClick={() => printForm(record)}
            ></Button>
          )}
          {hasAccess("update") && (
            <Link href={`/monitoring/upsert/${record.id}`}>
              <Button
                icon={<EditOutlined />}
                size="small"
                type="primary"
              ></Button>
            </Link>
          )}
          {hasAccess("update") &&
            ["DRAFT", "CANCEL"].includes(record.dropping_status) && (
              <Tooltip title={"Ajukan permohonan ini? (Naikan ke verifikasi)"}>
                <Button
                  icon={<CheckCircleOutlined />}
                  size="small"
                  type="primary"
                  onClick={() =>
                    setSelected({ ...selected, proses: true, selected: record })
                  }
                ></Button>
              </Tooltip>
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
              disabled={["APPROVED", "PAID_OFF"].includes(
                record.dropping_status,
              )}
            ></Button>
          )}
          <Tooltip
            title={`Detail Data ${record.Debitur.fullname} (${record.nopen})`}
          >
            <Button
              icon={<FolderOutlined />}
              type="primary"
              size="small"
              onClick={() =>
                setSelected({ ...selected, upsert: true, selected: record })
              }
            ></Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const totalPlafond = pageProps.data.reduce((acc, item) => acc + item.plafond, 0);
  const totalQueue = pageProps.data.filter((item) =>
    ["DRAFT", "PENDING"].includes(getEffectiveDroppingStatus(item)),
  ).length;
  const totalFinal = pageProps.data.filter(
    (item) =>
      item.approv_status === "APPROVED" &&
      ["PROCCESS", "APPROVED", "PAID_OFF"].includes(getEffectiveDroppingStatus(item)),
  ).length;

  return (
    <div className="space-y-5">
      <section className="app-page-hero grid gap-5 p-6 md:p-7 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
            Monitoring Pembiayaan
          </h1>
        </div>

        <div className="relative z-10 grid gap-3 self-end sm:grid-cols-2">
          <div className="rounded-[24px] border border-white/16 bg-white/12 p-4 backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-100/82">Total plafon</div>
            <div className="mt-2 text-2xl font-bold text-white">Rp. {IDRFormat(totalPlafond)}</div>
          </div>
          <div className="rounded-[24px] border border-white/16 bg-white/12 p-4 backdrop-blur">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-100/82">Hasil filter</div>
            <div className="mt-2 text-2xl font-bold text-white">{pageProps.total || pageProps.data.length} data</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="app-stat-tile">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Total Antrian</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{totalQueue}</div>
        </div>
        <div className="app-stat-tile">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Total Final</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{totalFinal}</div>
        </div>
      </section>

      <section className="app-toolbar-panel p-4 md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            {hasAccess("write") && (
              <Link href={"/monitoring/upsert"}>
                <Button icon={<PlusCircleOutlined />} type="primary" className="!rounded-2xl !px-5">
                  Add New
                </Button>
              </Link>
            )}
            <FilterData
              buttonSize="large"
              buttonClassName="!rounded-2xl !px-5"
              children={
                <div className="space-y-3 p-1">
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">Periode</p>
                    <RangePicker
                      size="middle"
                      onChange={(date, dateStr) => setPageProps({ ...pageProps, backdate: dateStr })}
                      style={{ width: "100%" }}
                    />
                  </div>
                  {user && !user.sumdanId && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-slate-700">Mitra pembiayaan</p>
                      <Select
                        size="middle"
                        placeholder="Pilih Mitra..."
                        options={sumdans.map((s) => ({
                          label: s.code,
                          value: s.id,
                        }))}
                        onChange={(e) => setPageProps({ ...pageProps, sumdanId: e })}
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                  )}
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">Jenis pembiayaan</p>
                    <Select
                      size="middle"
                      placeholder="Pilih Jenis..."
                      options={jeniss.map((s) => ({
                        label: s.name,
                        value: s.id,
                      }))}
                      onChange={(e) => setPageProps({ ...pageProps, jenisPembiayaanId: e })}
                      allowClear
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-700">Status pembiayaan</p>
                    <Select
                      size="middle"
                      placeholder="Pilih Status..."
                      options={[
                        { label: "Saved", value: "DRAFT" },
                        { label: "Antri", value: "PENDING" },
                        { label: "Proses", value: "PROCCESS" },
                        { label: "Dropping", value: "APPROVED" },
                        { label: "Batal", value: "CANCEL" },
                        { label: "Lunas", value: "PAID_OFF" },
                        { label: "Final", value: "final" },
                      ]}
                      onChange={(e) => setPageProps({ ...pageProps, dropping_status: e })}
                      allowClear
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              }
            />
            <Button
              icon={<PrinterOutlined />}
              onClick={() =>
                ExportToExcel(
                  [
                    {
                      sheetname: "alldata",
                      data: MappingToExcelDapem(pageProps.data),
                    },
                    {
                      sheetname: "antri",
                      data: MappingToExcelDapem(
                        pageProps.data.filter((d) => ["DRAFT", "PENDING"].includes(getEffectiveDroppingStatus(d))),
                      ),
                    },
                    {
                      sheetname: "final",
                      data: MappingToExcelDapem(
                        pageProps.data.filter(
                          (d) =>
                            d.approv_status === "APPROVED" &&
                            ["PROCCESS", "APPROVED", "PAID_OFF"].includes(getEffectiveDroppingStatus(d)),
                        ),
                      ),
                    },
                    {
                      sheetname: "dropping",
                      data: MappingToExcelDapem(
                        pageProps.data.filter(
                          (d) => d.approv_status === "APPROVED" && getEffectiveDroppingStatus(d) === "APPROVED",
                        ),
                      ),
                    },
                  ],
                  "monitoring",
                )
              }
              className="!rounded-2xl"
            >
              Excel
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => printMonitoring(pageProps.data, sumdans, pageProps.backdate)}
              className="!rounded-2xl"
            >
              PDF
            </Button>
            {hasAccess("write") && (
              <Button icon={<PrinterOutlined />} onClick={() => printForm()} className="!rounded-2xl">
                Form
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <Input.Search
              size="large"
              className="md:w-[260px]"
              placeholder="Cari nama..."
              onChange={(e) => setPageProps({ ...pageProps, search: e.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="app-card p-3 md:p-4">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="app-section-title text-xl">Daftar monitoring</h2>
            </div>
            <div className="app-soft-pill">Periode: {pageProps.backdate ? pageProps.backdate.toString() : "bulan berjalan"}</div>
          </div>

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
        summary={(pageData) => {
          const angsuran = pageData.reduce(
            (acc, item) =>
              acc +
              GetAngsuran(
                item.plafond,
                item.tenor,
                item.c_margin + item.c_margin_sumdan,
                item.margin_type,
                item.rounded,
              ).angsuran,
            0,
          );
          const angssudan = pageData.reduce(
            (acc, item) =>
              acc +
              GetAngsuran(
                item.plafond,
                item.tenor,
                item.c_margin_sumdan,
                item.margin_type,
                item.rounded_sumdan,
              ).angsuran,
            0,
          );

          return (
            <Table.Summary.Row className="bg-slate-100 text-xs">
              <Table.Summary.Cell index={0} colSpan={2} className="text-center">
                <b>SUMMARY</b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} className="text-center">
                <b>
                  {IDRFormat(
                    pageData.reduce((acc, item) => acc + item.plafond, 0),
                  )}{" "}
                </b>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} className="text-center font-bold">
                <div>
                  {IDRFormat(angsuran)} - {IDRFormat(angssudan)}
                </div>
                <div className="border-t border-gray-500">
                  {IDRFormat(angsuran - angssudan)}
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
      </section>

      {selected.selected && selected.proses && (
        <SendSubmission
          data={selected.selected}
          open={selected.proses}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, proses: val, selected: undefined })
          }
          getData={getData}
          hook={modal}
          key={"send" + selected.selected.id}
        />
      )}
      {selected.selected && selected.delete && (
        <DeleteSubmission
          open={selected.delete}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, selected: undefined, delete: val })
          }
          getData={getData}
          data={selected.selected}
          hook={modal}
          key={"delete" + selected.selected.id}
        />
      )}
      {selected.selected && selected.cetakAkad && (
        <PrintContractSubmission
          open={selected.cetakAkad}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, selected: undefined, cetakAkad: val })
          }
          getData={getData}
          data={selected.selected}
          hook={modal}
          key={"contract" + selected.selected.id}
        />
      )}
      {selected.selected && selected.upsert && (
        <DetailDapem
          open={selected.upsert}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, selected: undefined, upsert: val })
          }
          data={selected.selected}
          key={"detail" + selected.selected.id}
          allowprogres
        />
      )}
      <ViewFiles
        setOpen={(v: boolean) => setViews({ ...views, open: v })}
        data={{ ...views }}
      />
    </div>
  );
}

const SendSubmission = ({
  data,
  open,
  setOpen,
  getData,
  hook,
}: {
  data: IDapem;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/dapem?id=" + data.id, {
      method: "PUT",
      body: JSON.stringify({
        ...data,
        verif_status: "PENDING",
        dropping_status: "PENDING",
      }),
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
      title="Konfirmasi Permohonan"
      loading={loading}
      onOk={handleSubmit}
    >
      <div className="my-4">
        <p>
          Ajukan permohonan ini ke verifikasi{" "}
          <span className="font-bold">*{data.id}*</span>?
        </p>
        <p className="italic text-xs text-blue-500 mt-4">
          Mohon cek kembali data yang telah diinput, pastikan sudah lengkap dan
          siap di verifikasi!
        </p>
      </div>
    </Modal>
  );
};

const DeleteSubmission = ({
  data,
  open,
  setOpen,
  getData,
  hook,
}: {
  data: IDapem;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
}) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await fetch("/api/dapem?id=" + data.id, { method: "DELETE" })
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
          content: `Internal Server Error!!. Hapus data permohonan kredit ${data.id}) gagal`,
        });
      });
    setLoading(false);
  };

  const handleCancel = async () => {
    setLoading(true);
    await fetch("/api/dapem?id=" + data.id, {
      method: "PUT",
      body: JSON.stringify({ ...data, dropping_status: "CANCEL" }),
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
      title="Konfirmasi Hapus Permohonan"
      loading={loading}
      footer={[]}
    >
      <div className="my-4">
        <p>
          Hapus Data Pembiayaan ini{" "}
          <span className="font-bold">*{data.id}*</span>?
        </p>
        <div className="mt-4 text-xs italic text-blue-500">
          <p>Hapus : Hapus dari monitoring!</p>
          <p>Batalkan : Update status menjadi CANCEL!</p>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button danger onClick={() => handleDelete()}>
          Hapus Pengajuan
        </Button>
        <Button danger onClick={() => handleCancel()}>
          Batalkan Pengajuan
        </Button>
        <Button onClick={() => setOpen(false)}>Tutup</Button>
      </div>
    </Modal>
  );
};

const PrintContractSubmission = ({
  open,
  setOpen,
  data,
  getData,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  data: IDapem;
  getData: Function;
  hook: HookAPI;
}) => {
  const [temp, setTemp] = useState<IDapem>(data);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await fetch("/api/akad", {
      method: "POST",
      body: JSON.stringify({
        id: data.id,
        date_contract: temp.date_contract,
        no_contract: temp.no_contract,
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        const { msg, status, data } = res;
        if (status === 200) {
          await getData();
          printContract({ ...temp, Angsuran: data } as IDapem);
        } else {
          hook.error({ content: msg });
        }
      })
      .catch((err) => {
        console.log(err);
        hook.error({ content: `Internal Server Error!!. Generate PK gagal` });
      });
    setLoading(false);
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      title={"Cetak Akad " + data.id}
      loading={loading}
      onOk={handleSubmit}
      okButtonProps={{
        disabled: !temp.date_contract || !temp.no_contract,
      }}
    >
      <div className="flex flex-col gap-2">
        <FormInput
          data={{
            label: "Pemohon",
            type: "text",
            required: true,
            value: `${data.Debitur.fullname} (${data.nopen})`,
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "Tanggal Akad",
            type: "date",
            required: true,
            value: moment(temp.date_contract).format("YYYY-MM-DD"),
            onChange: (e: string) =>
              setTemp({ ...temp, date_contract: new Date(e) }),
          }}
        />
        <FormInput
          data={{
            label: "Nomor Akad",
            type: "text",
            required: true,
            value: temp.no_contract,
            onChange: (e: string) => setTemp({ ...temp, no_contract: e }),
            suffix: (
              <Button
                size="small"
                icon={<RobotOutlined />}
                type="primary"
                onClick={() =>
                  setTemp({
                    ...temp,
                    no_contract: `${data.id}/FAS-PKPP/${GetRoman(new Date(temp.date_contract || new Date()).getMonth() + 1)}/${moment(temp.date_contract || new Date()).format("YYYY")}`,
                  })
                }
              ></Button>
            ),
          }}
        />
        <FormInput
          data={{
            label: "Jenis Margin",
            type: "text",
            required: true,
            value: `${data.c_margin + data.c_margin_sumdan}% (${data.margin_type})`,
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "Mitra",
            type: "text",
            required: true,
            value: data.ProdukPembiayaan.Sumdan.name,
            disabled: true,
          }}
        />
      </div>
    </Modal>
  );
};
