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
          <div>
            <div>
              <CalendarOutlined />{" "}
              {moment(record.birthdate, "YYYY-MM-DD").format("DD/MM/YYYY")}
            </div>
            <div>
              <DollarOutlined /> {IDRFormat(record.salary)}
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
        <div className="flex gap-2 font-bold text-xl">
          <BookOutlined /> Data Debitur
        </div>
      }
      styles={{ body: { padding: 5 } }}
    >
      <div className="flex justify-between my-1 gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <Select
            size="small"
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
            size="small"
            style={{ width: 170 }}
            placeholder="Kantor Bayar..."
            onChange={(e) =>
              setPageProps({ ...pageProps, pay_office: e.target.value })
            }
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Input.Search
            size="small"
            style={{ width: 170 }}
            placeholder="Cari nama..."
            onChange={(e) =>
              setPageProps({ ...pageProps, search: e.target.value })
            }
          />
          <Input.Search
            size="small"
            style={{ width: 170 }}
            placeholder="Cari alamat..."
            onChange={(e) =>
              setPageProps({ ...pageProps, address: e.target.value })
            }
          />
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={pageProps.data}
        size="small"
        loading={loading}
        rowKey={"nopen"}
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
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ marginLeft: 10 }}>
              <Table
                bordered
                pagination={false}
                rowKey={"id"}
                columns={columnDapem}
                dataSource={record.Dapem}
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
        <div>
          <p>
            <DollarCircleOutlined />{" "}
            <Tag color={"blue"}>{IDRFormat(record.plafond)}</Tag>
          </p>
          <p>
            <HistoryOutlined /> <Tag color={"blue"}>{record.tenor} Bulan</Tag>
          </p>
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
