"use client";

import { FormInput, ViewFiles } from "@/components";
import { useUser } from "@/components/UserContext";
import {
  ExportToExcel,
  FilterData,
  GetBerkasStatusTag,
  GetDroppingStatusTag,
  MappingToExcelDapem,
} from "@/components/utils/CompUtils";
import { DetailDapem } from "@/components/utils/LayoutUtils";
import {
  GetAngsuran,
  GetBiaya,
  IDRFormat,
  IDRToNumber,
} from "@/components/utils/PembiayaanUtil";
import {
  IActionTable,
  ICashDesc,
  IDapem,
  IPageProps,
  IViewFiles,
} from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";

import {
  ArrowRightOutlined,
  EditOutlined,
  FileFilled,
  FileProtectOutlined,
  FolderOutlined,
  PayCircleOutlined,
  PlusCircleOutlined,
  PrinterOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { EDapemStatus, JenisPembiayaan, Sumdan } from "@prisma/client";
import {
  App,
  Button,
  Card,
  DatePicker,
  Input,
  Modal,
  Progress,
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
  const [pageProps, setPageProps] = useState<IPageProps<IDapem>>({
    page: 1,
    limit: 50,
    total: 0,
    data: [],
    search: "",
    sumdanId: "",
    jenisPembiayaanId: "",
    insurance_type: "",
    takeover_status: "",
    mutasi_status: "",
    flagging_status: "",
    cash_status: "",
    document_status: "",
    guarantee_status: "",
    backdate: "",
  });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<IActionTable<IDapem>>({
    upsert: false,
    delete: false,
    proses: false,
    selected: undefined,
  });
  const [sumdans, setSumdans] = useState<Sumdan[]>([]);
  const [jeniss, setJeniss] = useState<JenisPembiayaan[]>([]);
  const { modal } = App.useApp();
  const { hasAccess } = useAccess("/nominatif");
  const user = useUser();
  const [views, setViews] = useState<IViewFiles>({
    open: false,
    data: [],
  });

  const handleResetFilters = () => {
    setPageProps((prev) => ({
      ...prev,
      page: 1,
      sumdanId: "",
      jenisPembiayaanId: "",
      insurance_type: "",
      takeover_status: "",
      mutasi_status: "",
      flagging_status: "",
      cash_status: "",
      document_status: "",
      guarantee_status: "",
      backdate: "",
    }));
  };

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    params.append("nominatif", "APPROVED");
    if (pageProps.search) params.append("search", pageProps.search);

    if (pageProps.sumdanId) params.append("sumdanId", pageProps.sumdanId);
    if (pageProps.jenisPembiayaanId)
      params.append("jenisPembiayaanId", pageProps.jenisPembiayaanId);
    if (pageProps.insurance_type)
      params.append("insurance_type", pageProps.insurance_type);
    if (pageProps.backdate) params.append("backdate", pageProps.backdate);
    if (pageProps.takeover_status)
      params.append("takeover_status", pageProps.takeover_status);
    if (pageProps.mutasi_status)
      params.append("mutasi_status", pageProps.mutasi_status);
    if (pageProps.flagging_status)
      params.append("flagging_status", pageProps.flagging_status);
    if (pageProps.cash_status)
      params.append("cash_status", pageProps.cash_status);
    if (pageProps.document_status)
      params.append("document_status", pageProps.document_status);
    if (pageProps.guarantee_status)
      params.append("guarantee_status", pageProps.guarantee_status);

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
    pageProps.insurance_type,
    pageProps.backdate,
    pageProps.takeover_status,
    pageProps.mutasi_status,
    pageProps.flagging_status,
    pageProps.cash_status,
    pageProps.document_status,
    pageProps.guarantee_status,
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
      fixed: window.innerWidth < 600 ? false : true,
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
      title: "Status Takeover",
      dataIndex: "takeover_status",
      key: "takeover_status",
      width: 250,
      render: (_, record, i) => {
        return (
          <div>
            <div className="flex gap-1">
              {GetDroppingStatusTag(record.takeover_status)}
              <Button
                size="small"
                icon={<FileFilled />}
                disabled={!record.file_takeover}
                onClick={() =>
                  setViews({
                    open: true,
                    data: [
                      {
                        name: "File Takeover",
                        url: record.file_takeover || "",
                      },
                    ],
                  })
                }
              ></Button>
              <span className=" text-xs opacity-80">
                {moment(record.takeover_date_exc).format("DD/MM/YYYY")}
              </span>
            </div>
            <Paragraph
              ellipsis={{
                rows: 2,
                expandable: "collapsible",
              }}
              style={{ fontSize: 11 }}
            >
              {record.takeover_desc}
            </Paragraph>
          </div>
        );
      },
    },
    {
      title: "Status Mutasi",
      dataIndex: "mutasi_status",
      key: "mutasi_status",
      width: 250,
      render: (_, record, i) => {
        return (
          <div>
            <div className="flex gap-1">
              {GetDroppingStatusTag(record.mutasi_status)}
              <Button
                size="small"
                icon={<FileFilled />}
                disabled={!record.file_mutasi}
                onClick={() =>
                  setViews({
                    open: true,
                    data: [
                      {
                        name: "File Mutasi",
                        url: record.file_mutasi || "",
                      },
                    ],
                  })
                }
              ></Button>
              <span className="text-xs opacity-80">
                {moment(record.mutasi_date_exc).format("DD/MM/YYYY")}
              </span>
            </div>
            <Paragraph
              ellipsis={{
                rows: 2,
                expandable: "collapsible",
              }}
              style={{ fontSize: 11 }}
            >
              {record.mutasi_desc}
            </Paragraph>
          </div>
        );
      },
    },
    {
      title: "Status Flagging",
      dataIndex: "flagging_status",
      key: "flagging_status",
      width: 250,
      render: (_, record, i) => {
        return (
          <div>
            <div className="flex gap-1">
              {GetDroppingStatusTag(record.flagging_status)}
              <Button
                size="small"
                icon={<FileFilled />}
                disabled={!record.file_flagging}
                onClick={() =>
                  setViews({
                    open: true,
                    data: [
                      {
                        name: "File Flagging",
                        url: record.file_flagging || "",
                      },
                    ],
                  })
                }
              ></Button>
              <span className="text-xs opacity-80">
                {moment(record.flagging_date_exc).format("DD/MM/YYYY")}
              </span>
            </div>
            <Paragraph
              ellipsis={{
                rows: 2,
                expandable: "collapsible",
              }}
              style={{ fontSize: 11 }}
            >
              {record.flagging_desc}
            </Paragraph>
          </div>
        );
      },
    },
    {
      title: "Status TB",
      dataIndex: "tb_status",
      key: "tb_status",
      width: 320,
      render: (_, record, i) => {
        const desc = record.cash_desc
          ? (JSON.parse(record.cash_desc) as ICashDesc[])
          : [];
        const total = desc.reduce((acc, curr) => acc + curr.amount, 0);
        const angs = GetAngsuran(
          record.plafond,
          record.tenor,
          record.c_margin + record.c_margin_sumdan,
          record.margin_type,
          record.rounded,
        ).angsuran;
        const biaya =
          GetBiaya(record) + record.c_takeover + record.c_blokir * angs;
        return (
          <div>
            <div className="flex gap-1">
              {GetDroppingStatusTag(record.cash_status)}
              <Button
                size="small"
                icon={<FileFilled />}
                disabled={desc.length === 0}
                onClick={() =>
                  setViews({
                    open: true,
                    data: desc.map((d, i) => ({
                      name: "File " + i + 1,
                      url: d.file,
                    })),
                  })
                }
              ></Button>
              <span className="text-xs opacity-80">
                {IDRFormat(total)}/{IDRFormat(record.plafond - biaya)} (
                {((total / (record.plafond - biaya)) * 100).toFixed(2)}%) (
                {IDRFormat(record.plafond - biaya - total)})
              </span>
            </div>
            <Paragraph
              ellipsis={{
                rows: 1,
                expandable: "collapsible",
              }}
              style={{ fontSize: 11 }}
            >
              {desc.map((d, i) => (
                <div key={i}>
                  {d.desc} {moment(d.date).format("DD/MM/YYYY HH:mm")}(
                  {IDRFormat(d.amount)}){/* <br /> */}
                </div>
              ))}
            </Paragraph>
          </div>
        );
      },
    },
    {
      title: "Status Berkas",
      dataIndex: "berkas_status",
      key: "berkas_status",
      width: 250,
      render: (_, record, i) => {
        return (
          <div>
            <div className="flex gap-1">
              {GetBerkasStatusTag(record.document_status)}
              <Button
                size="small"
                icon={<FileFilled />}
                disabled={!record.Berkas || !record.Berkas.file_sub}
                onClick={() =>
                  setViews({
                    open: true,
                    data: [
                      {
                        name: "Pengiriman",
                        url: record.Berkas?.file_sub || "",
                      },
                      {
                        name: "Bukti Terima",
                        url: record.Berkas?.file_proof || "",
                      },
                    ],
                  })
                }
              ></Button>
              {record.Berkas && record.Berkas.process_at && (
                <span className="text-xs opacity-80">
                  Send : {moment(record.Berkas.process_at).format("DD/MM/YYYY")}
                </span>
              )}
            </div>
            <Paragraph
              ellipsis={{
                rows: 2,
                expandable: "collapsible",
              }}
              style={{ fontSize: 11 }}
            >
              {record.document_desc}
            </Paragraph>
          </div>
        );
      },
    },
    {
      title: "Status Jaminan",
      dataIndex: "Jaminan_status",
      key: "Jaminan_status",
      width: 350,
      render: (_, record, i) => {
        const created = moment(record.date_contract).add(record.tbo, "month");
        const isTbo =
          moment().isAfter(created, "date") &&
          (!record.Jaminan || !record.Jaminan.status);
        return (
          <div>
            <div className="flex gap-1">
              {GetBerkasStatusTag(record.guarantee_status)}
              <Tag color={isTbo ? "red" : "blue"} variant="solid">
                {isTbo ? "LEWAT TBO" : "MASA TBO"}
              </Tag>
              <Button
                size="small"
                icon={<FileFilled />}
                disabled={!record.Jaminan || !record.Jaminan.file_sub}
                onClick={() =>
                  setViews({
                    open: true,
                    data: [
                      {
                        name: "Pengiriman",
                        url: record.Jaminan?.file_sub || "",
                      },
                      {
                        name: "Bukti Terima",
                        url: record.Jaminan?.file_proof || "",
                      },
                    ],
                  })
                }
              ></Button>
              <div className="text-xs opacity-80">
                <div>
                  TBO :{" "}
                  {moment(record.date_contract)
                    .add(record.tbo, "month")
                    .format("DD/MM/YYYY")}
                </div>
                {record.Jaminan && record.Jaminan.process_at && (
                  <div>
                    Send :{" "}
                    {moment(record.Jaminan.process_at).format("DD/MM/YYYY")}
                  </div>
                )}
              </div>
            </div>
            <Paragraph
              ellipsis={{
                rows: 2,
                expandable: "collapsible",
              }}
              style={{ fontSize: 11 }}
            >
              {record.guarantee_desc}
            </Paragraph>
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
      title: "Status Dropping",
      dataIndex: "dropping_status",
      key: "dropping_status",
      width: 180,
      render: (_, record, i) => {
        return (
          <div className="flex gap-1">
            {GetDroppingStatusTag(record.dropping_status)}
            {record.Dropping && record.Dropping.process_at && (
              <div className="text-xs">
                {moment(record.Dropping.process_at).format("DD/MM/YYYY HH:mm")}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Progress",
      dataIndex: "progress",
      key: "progress",
      width: 150,
      render: (date, record) => {
        let percent = 40;
        if (record.takeover_status === "APPROVED") percent += 10;
        if (record.mutasi_status === "APPROVED") percent += 10;
        if (record.flagging_status === "APPROVED") percent += 10;
        if (record.cash_status === "APPROVED") percent += 10;
        if (record.document_status === "MITRA") percent += 10;
        if (record.guarantee_status === "MITRA") percent += 10;
        return <Progress percent={percent} />;
      },
    },
    {
      title: "Progres Tagihan",
      dataIndex: "progres",
      key: "progres",
      width: 150,
      render(value, record, index) {
        const filter = record.Angsuran.filter((f) => f.date_paid !== null);
        return (
          <Tooltip title={`${filter.length} / ${record.tenor}`}>
            <Progress
              percent={parseFloat(
                String(((filter.length / record.tenor) * 100).toFixed(2)),
              )}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Biaya Biaya",
      dataIndex: "biaya",
      key: "biaya",
      render(value, record, index) {
        const adm = record.plafond * (record.c_adm / 100);
        const insurance = record.plafond * (record.c_insurance / 100);
        const total =
          adm +
          insurance +
          record.c_gov +
          record.c_stamp +
          record.c_infomation +
          record.c_mutasi;
        return (
          <div className="text-xs">
            <div className="flex justify-between gap-4">
              <span className="w-20">Admin</span>
              <span>{IDRFormat(adm)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="w-20">Asuransi</span>
              <span>{IDRFormat(insurance)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="w-20">Tatalaksana</span>
              <span>{IDRFormat(record.c_gov)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="w-20">Materai</span>
              <span>{IDRFormat(record.c_stamp)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="w-20">Informasi</span>
              <span>{IDRFormat(record.c_infomation)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="w-20">Mutasi</span>
              <span>{IDRFormat(record.c_mutasi)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-dashed">
              <span className="w-20"></span>
              <span>{IDRFormat(total)}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Biaya Mitra",
      dataIndex: "biayamitra",
      key: "biayamitra",
      render(value, record, index) {
        const adm = record.plafond * (record.c_adm_sumdan / 100);
        return (
          <div className="text-xs">
            <div className="flex justify-between gap-4">
              <span className="w-20">Admin</span>
              <span className="text-right">{IDRFormat(adm)}</span>
            </div>
            <div className="flex justify-between">
              <span className="w-20">Rek</span>
              <span className="text-right">{IDRFormat(record.c_account)}</span>
            </div>
            <div className="flex justify-between">
              <span className="w-20">Provisi</span>
              <span className="text-right">{IDRFormat(record.c_provisi)}</span>
            </div>
            <div className="flex justify-between border-t border-dashed">
              <span className="w-20"></span>
              <span className="text-right">
                {IDRFormat(adm + record.c_account + record.c_provisi)}
              </span>
            </div>
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
        <div className="flex gap-2">
          {hasAccess("update") && (
            <Button
              icon={<EditOutlined />}
              type="primary"
              className="app-table-action-btn"
              onClick={() =>
                setSelected({ ...selected, proses: true, selected: record })
              }
            ></Button>
          )}
          <Tooltip
            title={`Detail Data ${record.Debitur.fullname} (${record.nopen})`}
          >
            <Button
              icon={<FolderOutlined />}
              type="primary"
              className="app-table-action-btn"
              onClick={() =>
                setSelected({ ...selected, upsert: true, selected: record })
              }
            ></Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Card
      className="app-master-card"
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
            <FileProtectOutlined />
          </div>
          <div>
            <p className="text-xl font-bold text-slate-900">Daftar Nominatif</p>
          </div>
        </div>
      }
    >
      <div className="app-report-toolbar gap-3 overflow-auto">
        <div className="flex flex-wrap gap-2">
          <FilterData
            buttonSize="middle"
            buttonClassName="app-master-action"
            title="Filter Nominatif"
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
                      <p>Jenis pembiayaan</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Pilih Jenis..."
                        options={jeniss.map((s) => ({
                          label: s.name,
                          value: s.id,
                        }))}
                        value={pageProps.jenisPembiayaanId || undefined}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            jenisPembiayaanId: e || "",
                          })
                        }
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="app-filter-field">
                      <p>Asuransi</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Pilih Asuransi..."
                        options={[
                          { label: "BUMI PUTERA", value: "BUMI PUTERA" },
                          { label: "CIU", value: "CIU" },
                          { label: "VICTORIA", value: "VICTORIA" },
                          { label: "RELIANCE", value: "RELIANCE" },
                        ]}
                        value={pageProps.insurance_type || undefined}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            insurance_type: e || "",
                          })
                        }
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="app-filter-field">
                      <p>Status takeover</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Status Takeover..."
                        options={[
                          { label: "DRAFT", value: "DRAFT" },
                          { label: "PENDING", value: "PENDING" },
                          { label: "PROCCESS", value: "PROCCESS" },
                          { label: "APPROVED", value: "APPROVED" },
                        ]}
                        value={pageProps.takeover_status || undefined}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            takeover_status: e || "",
                          })
                        }
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="app-filter-field">
                      <p>Status mutasi</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Status Mutasi..."
                        options={[
                          { label: "DRAFT", value: "DRAFT" },
                          { label: "PENDING", value: "PENDING" },
                          { label: "PROCCESS", value: "PROCCESS" },
                          { label: "APPROVED", value: "APPROVED" },
                        ]}
                        value={pageProps.mutasi_status || undefined}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            mutasi_status: e || "",
                          })
                        }
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="app-filter-field">
                      <p>Status flagging</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Status Flagging..."
                        options={[
                          { label: "DRAFT", value: "DRAFT" },
                          { label: "PENDING", value: "PENDING" },
                          { label: "PROCCESS", value: "PROCCESS" },
                          { label: "APPROVED", value: "APPROVED" },
                        ]}
                        value={pageProps.flagging_status || undefined}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            flagging_status: e || "",
                          })
                        }
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="app-filter-field">
                      <p>Status terima bersih</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Status TB..."
                        options={[
                          { label: "DRAFT", value: "DRAFT" },
                          { label: "PENDING", value: "PENDING" },
                          { label: "PROCCESS", value: "PROCCESS" },
                          { label: "APPROVED", value: "APPROVED" },
                        ]}
                        value={pageProps.cash_status || undefined}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            cash_status: e || "",
                          })
                        }
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="app-filter-field">
                      <p>Status penyerahan berkas</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Status Berkas..."
                        options={[
                          { label: "UNIT", value: "UNIT" },
                          { label: "PUSAT", value: "PUSAT" },
                          { label: "DELIVERY", value: "DELIVERY" },
                          { label: "MITRA", value: "MITRA" },
                        ]}
                        value={pageProps.document_status || undefined}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            document_status: e || "",
                          })
                        }
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </div>
                    <div className="app-filter-field">
                      <p>Status penyerahan jaminan</p>
                      <Select
                        size="middle"
                        className="app-master-select"
                        placeholder="Status Jaminan..."
                        options={[
                          { label: "UNIT", value: "UNIT" },
                          { label: "PUSAT", value: "PUSAT" },
                          { label: "DELIVERY", value: "DELIVERY" },
                          { label: "MITRA", value: "MITRA" },
                        ]}
                        value={pageProps.guarantee_status || undefined}
                        onChange={(e) =>
                          setPageProps({
                            ...pageProps,
                            page: 1,
                            guarantee_status: e || "",
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
          <Button
            icon={<PrinterOutlined />}
            type="primary"
            className="app-master-action"
            onClick={() =>
              ExportToExcel(
                [
                  {
                    sheetname: "alldata",
                    data: MappingToExcelDapem(pageProps.data),
                  },
                ],
                "nominatif",
              )
            }
          >
            Excel
          </Button>
          <Input.Search
            size="large"
            className="app-master-search md:w-[220px]"
            placeholder="Cari nama..."
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
          const adm = pageData.reduce(
            (acc, curr) => acc + curr.plafond * (curr.c_adm / 100),
            0,
          );
          const asuransi = pageData.reduce(
            (acc, curr) => acc + curr.plafond * (curr.c_insurance / 100),
            0,
          );
          const tatalaksana = pageData.reduce(
            (acc, curr) => acc + curr.c_gov,
            0,
          );
          const materai = pageData.reduce((acc, curr) => acc + curr.c_stamp, 0);
          const inform = pageData.reduce(
            (acc, curr) => acc + curr.c_infomation,
            0,
          );
          const mutasi = pageData.reduce((acc, curr) => acc + curr.c_mutasi, 0);
          const rek = pageData.reduce((acc, curr) => acc + curr.c_account, 0);
          const prov = pageData.reduce((acc, curr) => acc + curr.c_provisi, 0);
          const adm_mitra = pageData.reduce(
            (acc, curr) => acc + curr.plafond * (curr.c_adm_sumdan / 100),
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
              <Table.Summary.Cell
                index={5}
                colSpan={13}
                className="text-center font-bold"
              ></Table.Summary.Cell>

              <Table.Summary.Cell index={18} className="font-bold">
                <div className="flex justify-between">
                  <p className="w-20">Admin</p>
                  <p className="text-right">{IDRFormat(adm)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="w-20">Asuransi</p>
                  <p className="text-right">{IDRFormat(asuransi)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="w-20">Tatalaksana</p>
                  <p className="text-right">{IDRFormat(tatalaksana)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="w-20">Materai</p>
                  <p className="text-right">{IDRFormat(materai)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="w-20">Informasi</p>
                  <p className="text-right">{IDRFormat(inform)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="w-20">Mutasi</p>
                  <p className="text-right">{IDRFormat(mutasi)}</p>
                </div>
                <div className="border-t border-gray-500 text-right">
                  {IDRFormat(
                    adm + asuransi + tatalaksana + materai + inform + mutasi,
                  )}
                </div>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={18} className="font-bold">
                <div className="flex justify-between">
                  <p className="w-20">Admin</p>
                  <p className="text-right">{IDRFormat(adm_mitra)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="w-20">Rek</p>
                  <p className="text-right">{IDRFormat(rek)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="w-20">Provisi</p>
                  <p className="text-right">{IDRFormat(prov)}</p>
                </div>
                <div className="border-t border-gray-500 text-right">
                  {IDRFormat(adm_mitra + rek + prov)}
                </div>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />

      {selected.selected && selected.upsert && (
        <DetailDapem
          open={selected.upsert}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, selected: undefined, upsert: val })
          }
          data={selected.selected}
          key={"detail" + selected.selected.id}
          allowprogres={true}
        />
      )}
      <ViewFiles
        setOpen={(v: boolean) => setViews({ ...views, open: v })}
        data={{ ...views }}
      />
      {selected.selected && selected.proses && (
        <UpdateStatus
          open={selected.proses}
          setOpen={(val: boolean) =>
            setSelected({ ...selected, proses: val, selected: undefined })
          }
          getData={getData}
          dapem={selected.selected}
          key={"upsert" + selected.selected.id}
          hook={modal}
        />
      )}
    </Card>
  );
}

const UpdateStatus = ({
  open,
  setOpen,
  getData,
  dapem,
  hook,
}: {
  open: boolean;
  setOpen: Function;
  getData: Function;
  dapem: IDapem;
  hook: HookAPI;
}) => {
  const [cashdesc, setCashdesc] = useState<ICashDesc[]>(
    dapem.cash_desc
      ? (JSON.parse(dapem.cash_desc) as ICashDesc[])
      : [defaultCashDesc],
  );
  const [data, setData] = useState<IDapem>(dapem);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    data.cash_desc = JSON.stringify(cashdesc);
    await fetch("/api/dapem", {
      method: "PUT",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          hook.success({
            title: "BERHASIL",
            content: "Data Pembiayaan berhasil diupdate",
          });
          await getData();
          setOpen(false);
        } else {
          hook.error({ title: "ERROR!!", content: res.msg });
        }
      });
    setLoading(false);
  };

  return (
    <Modal
      title={"Update Data " + dapem.id}
      open={open}
      onCancel={() => setOpen(false)}
      width={1200}
      loading={loading}
      onOk={handleSubmit}
      style={{ top: 20 }}
    >
      <div className="my-4 flex gap-2 flex-col sm:flex-row">
        <div className="flex-1">
          <FormInput
            data={{
              label: "Pemohon",
              class: "flex-1",
              type: "text",
              disabled: true,
              value: `${dapem.Debitur.fullname} (${dapem.nopen})`,
            }}
          />
          <div className="flex flex-wrap gap-2 border-b py-2">
            <FormInput
              data={{
                label: "Status Takeover",
                required: true,
                class: "flex-1",
                mode: "vertical",
                type: "select",
                options: [
                  { label: "DRAFT", value: "DRAFT" },
                  { label: "PENDING", value: "PENDING" },
                  { label: "PROCCESS", value: "PROCCESS" },
                  { label: "APPROVED", value: "APPROVED" },
                ],
                value: data.takeover_status,
                onChange: (e: string) =>
                  setData({ ...data, takeover_status: e as EDapemStatus }),
              }}
            />
            <FormInput
              data={{
                label: "Tanggal Takeover",
                required: true,
                mode: "vertical",
                type: "date",
                class: "flex-1",
                value: moment(data.takeover_date_exc).format("YYYY-MM-DD"),
                onChange: (e: string) =>
                  setData({ ...data, takeover_date_exc: new Date(e) }),
              }}
            />
            <FormInput
              data={{
                label: "Keterangan",
                required: true,
                class: "flex-1",
                type: "textarea",
                value: data.takeover_desc,
                onChange: (e: string) => setData({ ...data, takeover_desc: e }),
              }}
            />
            <FormInput
              data={{
                label: "File",
                required: true,
                mode: "vertical",
                class: "flex-1",
                type: "upload",
                value: data.file_takeover,
                onChange: (e: string) => setData({ ...data, file_takeover: e }),
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 border-b py-2">
            <FormInput
              data={{
                label: "Status Mutasi",
                required: true,
                mode: "vertical",
                class: "flex-1",
                type: "select",
                options: [
                  { label: "DRAFT", value: "DRAFT" },
                  { label: "PENDING", value: "PENDING" },
                  { label: "PROCCESS", value: "PROCCESS" },
                  { label: "APPROVED", value: "APPROVED" },
                ],
                value: data.mutasi_status,
                onChange: (e: string) =>
                  setData({ ...data, mutasi_status: e as EDapemStatus }),
              }}
            />
            <FormInput
              data={{
                label: "Tanggal Mutasi",
                required: true,
                type: "date",
                mode: "vertical",
                class: "flex-1",
                value: moment(data.mutasi_date_exc).format("YYYY-MM-DD"),
                onChange: (e: string) =>
                  setData({ ...data, mutasi_date_exc: new Date(e) }),
              }}
            />
            <FormInput
              data={{
                label: "Keterangan",
                required: true,
                mode: "vertical",
                class: "flex-1",
                type: "textarea",
                value: data.mutasi_desc,
                onChange: (e: string) => setData({ ...data, mutasi_desc: e }),
              }}
            />
            <FormInput
              data={{
                label: "File",
                required: true,
                mode: "vertical",
                class: "flex-1",
                type: "upload",
                value: data.file_mutasi,
                onChange: (e: string) => setData({ ...data, file_mutasi: e }),
              }}
            />
          </div>
          <div className="flex flex-wrap gap-2 py-2">
            <FormInput
              data={{
                label: "Status Flagging",
                required: true,
                mode: "vertical",
                type: "select",
                class: "flex-1",
                options: [
                  { label: "DRAFT", value: "DRAFT" },
                  { label: "PENDING", value: "PENDING" },
                  { label: "PROCCESS", value: "PROCCESS" },
                  { label: "APPROVED", value: "APPROVED" },
                ],
                value: data.flagging_status,
                onChange: (e: string) =>
                  setData({ ...data, flagging_status: e as EDapemStatus }),
              }}
            />
            <FormInput
              data={{
                label: "Tanggal Flagging",
                required: true,
                type: "date",
                mode: "vertical",
                class: "flex-1",
                value: moment(data.flagging_date_exc).format("YYYY-MM-DD"),
                onChange: (e: string) =>
                  setData({ ...data, flagging_date_exc: new Date(e) }),
              }}
            />
            <FormInput
              data={{
                label: "Keterangan",
                required: true,
                type: "textarea",
                mode: "vertical",
                class: "flex-1",
                value: data.flagging_desc,
                onChange: (e: string) => setData({ ...data, flagging_desc: e }),
              }}
            />
            <FormInput
              data={{
                label: "File",
                required: true,
                mode: "vertical",
                class: "flex-1",
                type: "upload",
                value: data.file_flagging,
                onChange: (e: string) => setData({ ...data, file_flagging: e }),
              }}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <FormInput
            data={{
              label: "Status TB",
              required: true,
              mode: "horizontal",
              type: "select",
              options: [
                { label: "DRAFT", value: "DRAFT" },
                { label: "PENDING", value: "PENDING" },
                { label: "PROCCESS", value: "PROCCESS" },
                { label: "APPROVED", value: "APPROVED" },
              ],
              value: data.cash_status,
              onChange: (e: string) =>
                setData({ ...data, cash_status: e as EDapemStatus }),
            }}
          />
          {cashdesc.map((c, i) => (
            <div
              className="w-full flex flex-wrap gap-2 border-b border-gray-400 py-1"
              key={i}
            >
              <FormInput
                data={{
                  label: `Nominal (${i + 1})`,
                  required: true,
                  type: "text",
                  mode: "vertical",
                  class: "flex-1",
                  value: IDRFormat(cashdesc[i].amount),
                  onChange: (e: string) =>
                    setCashdesc(
                      cashdesc.map((cd, id) => ({
                        ...cd,
                        ...(i === id && { amount: IDRToNumber(e || "0") }),
                      })),
                    ),
                }}
              />
              <FormInput
                data={{
                  label: `Tanggal TB (${i + 1})`,
                  required: true,
                  type: "date",
                  mode: "vertical",
                  class: "flex-1",
                  value: moment(cashdesc[i].date).format("YYYY-MM-DD"),
                  onChange: (e: string) =>
                    setCashdesc(
                      cashdesc.map((cd, id) => ({
                        ...cd,
                        ...(i === id && { date: new Date(e) }),
                      })),
                    ),
                }}
              />
              <FormInput
                data={{
                  label: `Keterangan (${i + 1})`,
                  required: true,
                  type: "textarea",
                  mode: "vertical",
                  class: "flex-1",
                  value: cashdesc[i].desc,
                  onChange: (e: string) =>
                    setCashdesc(
                      cashdesc.map((cd, id) => ({
                        ...cd,
                        ...(i === id && { desc: e }),
                      })),
                    ),
                }}
              />
              <FormInput
                data={{
                  label: "File",
                  required: true,
                  mode: "vertical",
                  class: "flex-1",
                  type: "upload",
                  value: cashdesc[i].file,
                  onChange: (e: string) =>
                    setCashdesc(
                      cashdesc.map((cd, id) => ({
                        ...cd,
                        ...(i === id && { file: e }),
                      })),
                    ),
                }}
              />
            </div>
          ))}
          <div className="w-full">
            <Button
              icon={<PlusCircleOutlined />}
              type="primary"
              block
              onClick={() => setCashdesc([...cashdesc, defaultCashDesc])}
            >
              Add More
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const defaultCashDesc: ICashDesc = {
  amount: 0,
  date: new Date(),
  desc: "",
  file: "",
};
