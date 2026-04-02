"use client";

import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { useAccess } from "@/libs/Permission";
import {
  EyeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Divider,
  Modal,
  Table,
  TableProps,
  Tag,
  message,
  Collapse,
  Statistic,
  Row,
  Col,
  DatePicker,
  Form,
  Popconfirm,
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
  status: string;
}

interface IPelunasanDetail {
  id: string;
  amount: number;
  type: string;
  process_at: string | null;
}

interface ITagihan {
  id: string;
  nip: string;
  fullname: string;
  plafond: number;
  tenor: number;
  totalAngsuran: number;
  angsuranBelumBayar: number;
  angsuranSudahBayar: number;
  angsuranList: IAngsuranDetail[];
  createdAt: string;
}

export default function Page() {
  const [data, setData] = useState<ITagihan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ITagihan | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const { hasAccess } = useAccess("/pinkar/data-tagihan");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pinkar/tagihan-data");
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
      title: "NIP",
      dataIndex: "nip",
      width: 120,
    },
    {
      title: "Nama",
      dataIndex: "fullname",
      width: 180,
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
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div className="w-full">
          <h1 className="text-xl font-bold mb-2">
            📋 Data Tagihan Pinjaman Karyawan
          </h1>
          <Divider style={{ margin: "8px 0" }} />
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} data`,
          }}
          bordered
          scroll={{ x: 1400 }}
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
  const [editAngsuran, setEditAngsuran] = useState<IAngsuranDetail | null>(
    null,
  );
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const angsuranBelumBayarList = data.angsuranList.filter((a) => !a.date_paid);

  const handleEditAngsuran = (angsuran: IAngsuranDetail) => {
    setEditAngsuran(angsuran);
    setEditOpen(true);
  };

  const handleSaveAngsuran = async (angsuran: IAngsuranDetail) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/pinkar/angsuran/${angsuran.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date_paid: new Date().toISOString(),
          status: "PAID",
        }),
      });

      const result = await res.json();
      if (result.success) {
        message.success("Pembayaran berhasil dicatat");
        setEditOpen(false);
        setRefreshKey((prev) => prev + 1);
        // Refresh parent data
        setTimeout(() => window.location.reload(), 500);
      } else {
        message.error(result.message || "Gagal menyimpan");
      }
    } catch (error) {
      console.error("Error saving angsuran:", error);
      message.error("Terjadi kesalahan");
    } finally {
      setEditLoading(false);
    }
  };

  const handleUndoAngsuran = async (angsuran: IAngsuranDetail) => {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/pinkar/angsuran/${angsuran.id}`, {
        method: "DELETE",
      });

      const result = await res.json();
      if (result.success) {
        message.success("Pembayaran berhasil dikembalikan");
        setRefreshKey((prev) => prev + 1);
        // Refresh parent data
        setTimeout(() => window.location.reload(), 500);
      } else {
        message.error(result.message || "Gagal menghapus");
      }
    } catch (error) {
      console.error("Error deleting angsuran:", error);
      message.error("Terjadi kesalahan");
    } finally {
      setEditLoading(false);
    }
  };

  const angsuranColumns: TableProps<IAngsuranDetail>["columns"] = [
    {
      title: "Ke",
      width: 50,
      align: "center",
      render: (_, record) => (
        <span className="font-bold">#{record.counter}</span>
      ),
    },
    {
      title: "Tanggal Jatuh Tempo",
      width: 150,
      align: "center",
      render: (_, record) => (
        <span className="font-semibold">
          {moment(record.date_pay).format("DD-MM-YYYY")}
        </span>
      ),
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
      title: "Total Tagihan",
      width: 130,
      align: "right",
      render: (_, record) => (
        <span className="font-bold text-red-600">
          {IDRFormat(record.principal + record.margin)}
        </span>
      ),
    },
    {
      title: "Status",
      width: 120,
      align: "center",
      render: (_, record) =>
        record.date_paid ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            LUNAS
          </Tag>
        ) : (
          <Tag
            icon={<ClockCircleOutlined />}
            color={new Date(record.date_pay) < new Date() ? "error" : "warning"}
          >
            {new Date(record.date_pay) < new Date() ? "OVERDUE" : "PENDING"}
          </Tag>
        ),
    },
    {
      title: "Aksi",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_, record) =>
        record.date_paid ? (
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleUndoAngsuran(record)}
            loading={editLoading}
          >
            Batalkan
          </Button>
        ) : (
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleSaveAngsuran(record)}
            loading={editLoading}
          >
            Bayar
          </Button>
        ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={[
        <Button key="close" onClick={() => setOpen(false)}>
          Tutup
        </Button>,
      ]}
      width={1200}
      title="Detail Tagihan"
    >
      {/* INFO UMUM */}
      <Card className="mb-4" title="Informasi Pinjaman">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">NIP</span>
              <span>{data.nip}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Nama</span>
              <span>{data.fullname}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Tenor</span>
              <span>{data.tenor} Bulan</span>
            </div>
          </Col>
          <Col xs={24} sm={12}>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Plafond</span>
              <span className="font-bold text-blue-600">
                {IDRFormat(data.plafond)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Tanggal Pinjaman</span>
              <span>{moment(data.createdAt).format("DD-MM-YYYY")}</span>
            </div>
          </Col>
        </Row>
      </Card>

      {/* STATISTIK TAGIHAN */}
      <Card className="mb-4" title="Statistik Tagihan">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Statistic
              title="Total Tagihan"
              value={data.totalAngsuran}
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="Sudah Dibayar"
              value={data.angsuranSudahBayar}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={6}>
            <Statistic
              title="Belum Dibayar"
              value={data.angsuranBelumBayar}
              valueStyle={{ color: "#f5222d" }}
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={6}>
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
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
        </Row>
      </Card>

      {/* TABEL JADWAL SEMUA */}
      <Card className="mb-4" title="📊 JADWAL LENGKAP ANGSURAN">
        <Table
          columns={angsuranColumns}
          dataSource={data.angsuranList}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 12,
            showTotal: (total) => `Total ${total} angsuran`,
          }}
          bordered
          scroll={{ x: 800 }}
        />
      </Card>

      {/* MODAL EDIT ANGSURAN */}
      {editAngsuran && (
        <Modal
          open={editOpen}
          onCancel={() => setEditOpen(false)}
          footer={[
            <Button key="close" onClick={() => setEditOpen(false)}>
              Tutup
            </Button>,
          ]}
          title={`Edit Pembayaran Angsuran Ke-${editAngsuran.counter}`}
        >
          <Card className="mb-4">
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold">Angsuran Ke</span>
                  <span className="font-bold">#{editAngsuran.counter}</span>
                </div>
              </Col>
              <Col xs={24}>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold">Tanggal Jatuh Tempo</span>
                  <span>
                    {moment(editAngsuran.date_pay).format("DD-MM-YYYY")}
                  </span>
                </div>
              </Col>
              <Col xs={24}>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold">Pokok</span>
                  <span>{IDRFormat(editAngsuran.principal)}</span>
                </div>
              </Col>
              <Col xs={24}>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold">Margin</span>
                  <span>{IDRFormat(editAngsuran.margin)}</span>
                </div>
              </Col>
              <Col xs={24}>
                <div className="flex justify-between py-2 border-b bg-red-50 p-2 rounded">
                  <span className="font-bold">Total Tagihan</span>
                  <span className="font-bold text-red-600">
                    {IDRFormat(editAngsuran.principal + editAngsuran.margin)}
                  </span>
                </div>
              </Col>
              <Col xs={24}>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-semibold">Status</span>
                  <Tag color={editAngsuran.date_paid ? "success" : "error"}>
                    {editAngsuran.date_paid ? "LUNAS" : "BELUM BAYAR"}
                  </Tag>
                </div>
              </Col>
              {editAngsuran.date_paid && (
                <Col xs={24}>
                  <div className="flex justify-between py-2 border-b">
                    <span className="font-semibold">Tanggal Bayar</span>
                    <span>
                      {moment(editAngsuran.date_paid).format("DD-MM-YYYY")}
                    </span>
                  </div>
                </Col>
              )}
            </Row>
          </Card>
        </Modal>
      )}
    </Modal>
  );
};
