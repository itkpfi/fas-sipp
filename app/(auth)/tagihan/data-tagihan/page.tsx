"use client";

import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { useAccess } from "@/libs/Permission";
import {
  EyeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
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
          <h1 className="text-xl font-bold mb-2">📋 Data Tagihan</h1>
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
  const angsuranBelumBayarList = data.angsuranList.filter((a) => !a.date_paid);

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
      render: (_, record) =>
        record.date_paid ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            LUNAS
          </Tag>
        ) : (
          <Tag icon={<ClockCircleOutlined />} color="error">
            OVERDUE
          </Tag>
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
      <Card className="mb-4" title="Informasi Debitur">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">NOPEN</span>
              <span>{data.nopen}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">Nama Debitur</span>
              <span>{data.fullname}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-semibold">No Kontrak</span>
              <span>{data.noKontrak}</span>
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
              <span className="font-semibold">Tenor</span>
              <span>{data.tenor} Bulan</span>
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

      {/* TABEL JADWAL YANG BELUM DIBAYAR */}
      {angsuranBelumBayarList.length > 0 && (
        <Card className="mb-4" title="📌 TAGIHAN YANG JATUH TEMPO">
          <Table
            columns={angsuranColumns}
            dataSource={angsuranBelumBayarList}
            rowKey="id"
            size="small"
            pagination={false}
            bordered
            scroll={{ x: 600 }}
            summary={() => {
              const totalPokok = angsuranBelumBayarList.reduce(
                (sum, a) => sum + a.principal,
                0,
              );
              const totalMargin = angsuranBelumBayarList.reduce(
                (sum, a) => sum + a.margin,
                0,
              );
              const totalAngsuran = totalPokok + totalMargin;

              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2} align="center">
                      <strong>TOTAL</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right">
                      <strong>{IDRFormat(totalPokok)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="right">
                      <strong>{IDRFormat(totalMargin)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4} align="right">
                      <strong className="text-red-600">
                        {IDRFormat(totalAngsuran)}
                      </strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={5} />
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          />
        </Card>
      )}

      {/* TABEL JADWAL SEMUA */}
      <Card className="mb-4" title="📊 JADWAL LENGKAP ANGSURAN">
        <Table
          columns={angsuranColumns}
          dataSource={data.angsuranList}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} angsuran`,
          }}
          bordered
          scroll={{ x: 600 }}
        />
      </Card>
    </Modal>
  );
};
