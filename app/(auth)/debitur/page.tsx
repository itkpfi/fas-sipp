"use client";

import { GetDroppingStatusTag } from "@/components/utils/CompUtils";
import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";
import { IDapem, IDebitur, IPageProps } from "@/libs/IInterfaces";
import {
  BookOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  DollarOutlined,
  HistoryOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Card,
  Input,
  Progress,
  Select,
  Table,
  TableProps,
  Tag,
  Tooltip,
} from "antd";
import moment from "moment";
import { useEffect, useState } from "react";

export default function Page() {
  const [pageProps, setPageProps] = useState<IPageProps<IDebitur>>({
    page: 1,
    limit: 50,
    total: 0,
    data: [],
    search: "",
    group_skep: "",
    pay_office: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    params.append("aktif", "true");
    if (pageProps.search) params.append("search", pageProps.search);
    if (pageProps.address) params.append("address", pageProps.address);

    if (pageProps.group_skep) params.append("group_skep", pageProps.group_skep);
    if (pageProps.pay_office) params.append("pay_office", pageProps.pay_office);

    const res = await fetch(`/api/debitur?${params.toString()}`);
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
    pageProps.group_skep,
    pageProps.pay_office,
    pageProps.address,
  ]);

  const columns: TableProps<IDebitur>["columns"] = [
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
      title: "Pemohon",
      dataIndex: "pemohon",
      key: "pemohon",
      render(value, record, index) {
        return (
          <div>
            <div>{record.fullname}</div>
            <div className="text-xs opacity-80  ">@{record.nopen}</div>
          </div>
        );
      },
    },
    {
      title: "Tgl Lahir & Gaji",
      dataIndex: "tgl_lahir_penerima",
      key: "tgl_lahir_penerima",
      render(value, record, index) {
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                <CalendarOutlined />
              </span>
              {moment(record.birthdate, "YYYY-MM-DD").format("DD/MM/YYYY")}
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                <DollarOutlined />
              </span>
              {IDRFormat(record.salary)}
            </div>
          </div>
        );
      },
    },
    {
      title: "Kelompok & Pangkat",
      dataIndex: "kelompok_pensiun",
      key: "kelompok_pensiun",
      render(value, record, index) {
        return (
          <div>
            <div>{record.group_skep}</div>
            <div>{record.rank_skep}</div>
          </div>
        );
      },
    },
    {
      title: "Alamat",
      dataIndex: "alamat_penerima",
      key: "alamat_penerima",
      render(value, record, index) {
        return (
          <div style={{ maxWidth: 250 }} className="text-xs">
            {record.address} {record.ward} {record.district} {record.city}{" "}
            {record.province} {record.pos_code} | {record.phone}
          </div>
        );
      },
    },
    {
      title: "Kantor Bayar",
      dataIndex: "pay_office",
      key: "pay_office",
    },
  ];

  return (
    <Card
      title={
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <BookOutlined /> Data Debitur
        </div>
      }
      className="app-master-card"
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-100 pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          <Select
            size="middle"
            className="app-master-select"
            placeholder="Kelompok..."
            options={[
              { label: "TASPEN", value: "TASPEN" },
              { label: "ASABRI", value: "ASABRI" },
              { label: "LAINNYA", value: "LAINNYA" },
            ]}
            onChange={(e) => setPageProps({ ...pageProps, group_skep: e })}
            allowClear
            style={{ width: 170 }}
          />
          <Input.Search
            size="middle"
            className="app-master-search"
            style={{ width: 170 }}
            placeholder="Kantor Bayar..."
            prefix={<SearchOutlined className="text-slate-400" />}
            onChange={(e) =>
              setPageProps({ ...pageProps, pay_office: e.target.value })
            }
          />
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:justify-end">
          <Input.Search
            size="middle"
            className="app-master-search"
            style={{ width: 170 }}
            placeholder="Cari nama..."
            prefix={<SearchOutlined className="text-slate-400" />}
            onChange={(e) =>
              setPageProps({ ...pageProps, search: e.target.value })
            }
          />
          <Input.Search
            size="middle"
            className="app-master-search"
            style={{ width: 170 }}
            placeholder="Cari alamat..."
            prefix={<SearchOutlined className="text-slate-400" />}
            onChange={(e) =>
              setPageProps({ ...pageProps, address: e.target.value })
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
        rowKey={"nopen"}
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
        expandable={{
          expandedRowRender: (record) => (
            <div className="ml-2 rounded-2xl bg-slate-50/90 p-3">
              <Table
                className="app-master-table"
                pagination={false}
                rowKey={"id"}
                columns={columnDapem}
                dataSource={record.Dapem}
                size="middle"
              />
            </div>
          ),
          rowExpandable: (record) => record.Dapem.length !== 0,
        }}
      />
    </Card>
  );
}

const columnDapem: TableProps<IDapem>["columns"] = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "Permohonan",
    dataIndex: "permohonan",
    key: "permohonan",
    render(value, record, index) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <DollarCircleOutlined />
            </span>
            <Tag color={"blue"}>{IDRFormat(record.plafond)}</Tag>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <HistoryOutlined />
            </span>
            <Tag color={"blue"}>{record.tenor} Bulan</Tag>
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
        <div>
          <Tag color={"blue"}>
            {IDRFormat(
              GetAngsuran(
                record.plafond,
                record.tenor,
                record.c_margin + record.c_margin_sumdan,
                record.margin_type,
                record.rounded,
              ).angsuran,
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
            {record.ProdukPembiayaan.id} {record.ProdukPembiayaan.name}
          </div>
          <div className="text-xs opacity-80">
            {record.JenisPembiayaan.name}
          </div>
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
            <span>{record.AO.Cabang.name}</span> |{" "}
            <span>{record.AO.Cabang.Area.name}</span>
          </div>
        </div>
      );
    },
  },
  {
    title: "Status",
    dataIndex: "status_final",
    key: "status_final",
    render: (_, record, i) => (
      <div className="flex gap-1">
        {GetDroppingStatusTag(record.dropping_status)}
      </div>
    ),
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
    title: "Akad",
    dataIndex: "created_at",
    key: "created_at",
    render(value, record, index) {
      return (
        <div>
          <div>{record.no_contract}</div>
          <div className="opacity-80  text-xs">
            {moment(record.date_contract).format("DD/MM/YYYY")}
          </div>
        </div>
      );
    },
  },
];
