"use client";

import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { useAccess } from "@/libs/Permission";
import {
  EyeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ProfileOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Modal,
  Table,
  TableProps,
  Tag,
  message,
  Statistic,
  Row,
  Col,
} from "antd";
import moment from "moment";
import { useEffect, useState } from "react";

interface IAngsuranDetail {
  id: string;
  counter: number;
  principal: number;
  margin: number;
  date_pay: string;
  date_paid: string | null;
  remaining: number;
  inst_sumdan: number;
  fee_banpot: number;
}

interface IPelunasanDetail {
  id: string;
  amount: number;
  type: string;
  process_at: string | null;
}

interface ITagihan {
  id: string;
  nopen: string;
  fullname: string;
  plafond: number;
  tenor: number;
  noKontrak: string;
  totalAngsuran: number;
  angsuranBelumBayar: number;
  angsuranSudahBayar: number;
  angsuranList: IAngsuranDetail[];
  pelunasan: IPelunasanDetail | null;
  createdAt: string;
}

export default function Page() {
  const [data, setData] = useState<ITagihan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ITagihan | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { hasAccess } = useAccess("/tagihan/data-tagihan");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tagihan-data");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        message.error("Gagal memuat data tagihan");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (record: ITagihan) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const columns: TableProps<ITagihan>["columns"] = [
    {
      title: "No",
      width: 50,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "NOPEN",
      dataIndex: "nopen",
      width: 120,
    },
    {
      title: "Nama Debitur",
      dataIndex: "fullname",
      width: 180,
    },
    {
      title: "No Kontrak",
      dataIndex: "noKontrak",
      width: 150,
    },
    {
      title: "Plafond",
      dataIndex: "plafond",
      width: 140,
      align: "right",
      render: (v: number) => IDRFormat(v),
    },
    {
      title: "Tenor",
      dataIndex: "tenor",
      width: 80,
      align: "center",
      render: (v: number) => `${v} Bln`,
    },
    {
      title: "Total Tagihan",
      dataIndex: "totalAngsuran",
      width: 100,
      align: "center",
    },
    {
      title: "Sudah Bayar",
      dataIndex: "angsuranSudahBayar",
      width: 100,
      align: "center",
      render: (v: number) => <Tag color="green">{v}</Tag>,
    },
    {
      title: "Belum Bayar",
      dataIndex: "angsuranBelumBayar",
      width: 100,
      align: "center",
      render: (v: number) => <Tag color={v > 0 ? "red" : "blue"}>{v}</Tag>,
    },
    {
      title: "Aksi",
      width: 100,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          className="app-table-action-btn"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Card
        className="app-master-card"
        title={
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <FileTextOutlined /> Data Tagihan
          </div>
        }
      >
        <div className="mb-4 flex flex-col gap-2 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Ringkasan tagihan dan detail angsuran aktif per debitur.
          </p>
          <div className="app-soft-pill w-fit !bg-slate-50 !text-slate-600 !shadow-none">
            Total data {data.length}
          </div>
        </div>
        <Table
          className="app-master-table"
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} data`,
          }}
          scroll={{ x: "max-content" }}
        />
      </Card>

      {selectedRecord && (
        <ModalDetailTagihan
          data={selectedRecord}
          open={detailOpen}
          setOpen={setDetailOpen}
        />
      )}
    </div>
  );
}

// ====== MODAL DETAIL TAGIHAN ======
const ModalDetailTagihan = ({
  data,
  open,
  setOpen,
}: {
  data: ITagihan;
  open: boolean;
  setOpen: Function;
}) => {
  const getAngsuranStatus = (record: IAngsuranDetail) => {
    if (record.date_paid) {
      return {
        label: "LUNAS",
        color: "success" as const,
        icon: <CheckCircleOutlined />,
      };
    }

    const isOverdue = moment().startOf("day").isAfter(moment(record.date_pay).startOf("day"));

    if (isOverdue) {
      return {
        label: "OVERDUE",
        color: "error" as const,
        icon: <ClockCircleOutlined />,
      };
    }

    return {
      label: "BELUM JATUH TEMPO",
      color: "processing" as const,
      icon: <CalendarOutlined />,
    };
  };

  const angsuranColumns: TableProps<IAngsuranDetail>["columns"] = [
    {
      title: "Ke",
      width: 50,
      align: "center",
      render: (_, record) => record.counter,
    },
    {
      title: "Tanggal Jatuh Tempo",
      width: 150,
      align: "center",
      render: (_, record) => moment(record.date_pay).format("DD-MM-YYYY"),
    },
    {
      title: "Pokok",
      width: 130,
      align: "right",
      render: (_, record) => IDRFormat(record.principal),
    },
    {
      title: "Margin",
      width: 130,
      align: "right",
      render: (_, record) => IDRFormat(record.margin),
    },
    {
      title: "Angsuran",
      width: 130,
      align: "right",
      render: (_, record) => IDRFormat(record.principal + record.margin),
    },
    {
      title: "Status",
      width: 120,
      align: "center",
      render: (_, record) => {
        const status = getAngsuranStatus(record);

        return (
          <Tag icon={status.icon} color={status.color}>
            {status.label}
          </Tag>
        );
      },
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={[
        <Button
          key="close"
          onClick={() => setOpen(false)}
          size="middle"
          className="app-master-action"
        >
          Tutup
        </Button>,
      ]}
      width={1080}
      title={
        <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <ProfileOutlined /> Detail Tagihan
        </div>
      }
    >
      <div className="space-y-4">
      <Card
        className="app-card-muted !rounded-2xl !shadow-none"
        title={
          <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <ProfileOutlined /> Informasi Debitur
          </div>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
              <span className="font-semibold text-slate-600">NOPEN</span>
              <span className="text-right font-medium text-slate-900">{data.nopen}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
              <span className="font-semibold text-slate-600">Nama Debitur</span>
              <span className="text-right font-medium text-slate-900">{data.fullname}</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
              <span className="font-semibold text-slate-600">No Kontrak</span>
              <span className="text-right font-medium text-slate-900">{data.noKontrak}</span>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
              <span className="font-semibold text-slate-600">Plafond</span>
              <span className="text-right font-bold text-emerald-600">
                {IDRFormat(data.plafond)}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
              <span className="font-semibold text-slate-600">Tenor</span>
              <span className="text-right font-medium text-slate-900">{data.tenor} Bulan</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-200 py-2 text-sm">
              <span className="font-semibold text-slate-600">Tanggal Pinjaman</span>
              <span className="text-right font-medium text-slate-900">
                {moment(data.createdAt).format("DD-MM-YYYY")}
              </span>
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        className="app-card-muted !rounded-2xl !shadow-none"
        title={
          <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <BarChartOutlined /> Statistik Tagihan
          </div>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <Statistic
                title="Total Tagihan"
                value={data.totalAngsuran}
                valueStyle={{ color: "#0f172a" }}
              />
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3">
              <Statistic
                title="Sudah Dibayar"
                value={data.angsuranSudahBayar}
                valueStyle={{ color: "#059669" }}
                prefix={<CheckCircleOutlined />}
              />
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3">
              <Statistic
                title="Belum Dibayar"
                value={data.angsuranBelumBayar}
                valueStyle={{ color: "#e11d48" }}
                prefix={<ClockCircleOutlined />}
              />
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 px-4 py-3">
              <Statistic
                title="Progress"
                value={
                  data.totalAngsuran > 0
                    ? Math.round(
                        (data.angsuranSudahBayar / data.totalAngsuran) * 100,
                      )
                    : 0
                }
                suffix="%"
                valueStyle={{ color: "#0284c7" }}
                prefix={<CalendarOutlined />}
              />
            </div>
          </Col>
        </Row>
      </Card>

      <Card
        className="app-card-muted !rounded-2xl !shadow-none"
        title={
          <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <BarChartOutlined /> Jadwal Lengkap Angsuran
          </div>
        }
      >
        <Table
          className="app-master-table"
          columns={angsuranColumns}
          dataSource={data.angsuranList}
          rowKey="id"
          size="middle"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} angsuran`,
          }}
          scroll={{ x: 600 }}
        />
      </Card>
      </div>
    </Modal>
  );
};
