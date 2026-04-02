"use client";

import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { useAccess } from "@/libs/Permission";
import {
  DeleteOutlined,
  EyeOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Divider,
  Image,
  Modal,
  Popconfirm,
  Table,
  TableProps,
  Tag,
  message,
} from "antd";
import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";

interface IPinjamanData {
  id: string;
  nip: string;
  fullname: string;
  plafond: number;
  tenor: number;
  marginRate: number;
  adminRate: number;
  biayaAdmin: number;
  terimaBersih: number;
  totalMargin: number;
  totalBayar: number;
  angsuranPerBulan: number;
  scheduleJson: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

interface IAngsuranRow {
  no: number;
  tanggal: string;
  angsuran: number;
  margin: number;
  pokok: number;
  sisaPokok: number;
}

export default function Page() {
  const [data, setData] = useState<IPinjamanData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IPinjamanData | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const { hasAccess } = useAccess("/pinkar/data-pinjaman");

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pinjaman");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        message.error("Gagal memuat data pinjaman");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pinjaman/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        message.success("Data pinjaman berhasil dihapus");
        fetchData();
      } else {
        message.error("Gagal menghapus data");
      }
    } catch (error) {
      console.error("Error deleting data:", error);
      message.error("Terjadi kesalahan saat menghapus data");
    }
  };

  const handleView = (record: IPinjamanData) => {
    setSelectedRecord(record);
    setDetailOpen(true);
  };

  const columns: TableProps<IPinjamanData>["columns"] = [
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
      searchable: true,
    },
    {
      title: "Nama Lengkap",
      dataIndex: "fullname",
      width: 180,
      searchable: true,
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
      width: 100,
      align: "center",
      render: (v: number) => `${v} Bulan`,
    },
    {
      title: "Angsuran/Bulan",
      dataIndex: "angsuranPerBulan",
      width: 140,
      align: "right",
      render: (v: number) => IDRFormat(v),
    },
    {
      title: "Tanggal",
      dataIndex: "created_at",
      width: 150,
      align: "center",
      render: (v: string) => moment(v).format("DD-MM-YYYY HH:mm"),
    },
    {
      title: "Aksi",
      width: 150,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <div className="flex gap-2 justify-center items-center">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="Lihat Detail"
          />
          <Popconfirm
            title="Hapus Data"
            description="Apakah Anda yakin ingin menghapus data ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              title="Hapus"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <div className="w-full">
          <h1 className="text-xl font-bold mb-2">📋 Data Pinjaman Karyawan</h1>
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
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* MODAL DETAIL */}
      {selectedRecord && (
        <ModalDetailPinjaman
          data={selectedRecord}
          open={detailOpen}
          setOpen={setDetailOpen}
        />
      )}
    </div>
  );
}

// ====== MODAL DETAIL ======
const ModalDetailPinjaman = ({
  data,
  open,
  setOpen,
}: {
  data: IPinjamanData;
  open: boolean;
  setOpen: Function;
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [schedule, setSchedule] = useState<IAngsuranRow[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(data.scheduleJson);
      setSchedule(parsed);
    } catch (error) {
      console.error("Error parsing schedule:", error);
    }
  }, [data.scheduleJson]);

  const handleDownloadImage = async () => {
    if (printRef.current === null) return;

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(printRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `PinjamanKaryawan-${data.fullname || "Karyawan"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mendownload gambar", err);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      footer={[]}
      width={1000}
      style={{ top: 10 }}
    >
      <div
        ref={printRef}
        style={{ padding: "16px", backgroundColor: "#fff" }}
        className="text-gray-700"
      >
        <div className="flex items-center gap-2 mb-3">
          <Image
            src={process.env.NEXT_PUBLIC_APP_LOGO}
            width={50}
            preview={false}
          />
          <div>
            <p className="font-bold text-lg">
              DATA PINJAMAN KARYAWAN
            </p>
            <p className="text-xs text-gray-500">
              {process.env.NEXT_PUBLIC_APP_FULLNAME}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {/* DATA PINJAMAN */}
          <div className="w-full sm:flex-1">
            <div className="p-2 bg-green-600 font-bold text-white text-center rounded-t">
              DATA PINJAMAN
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>NIP/No Anggota</p>
              <p className="font-semibold">{data.nip || "-"}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Nama Lengkap</p>
              <p className="font-semibold">{data.fullname || "-"}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Tanggal Pinjaman</p>
              <p>{moment(data.created_at).format("DD-MM-YYYY")}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Plafond</p>
              <p className="font-semibold">{IDRFormat(data.plafond)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Tenor</p>
              <p>{data.tenor} Bulan</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Margin Bunga</p>
              <p>{data.marginRate}% / Tahun</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Biaya Admin</p>
              <p>{data.adminRate}%</p>
            </div>
          </div>

          {/* RINCIAN PEMBIAYAAN  */}
          <div className="w-full sm:flex-1">
            <div className="p-2 bg-red-600 font-bold text-white text-center rounded-t">
              RINCIAN PEMBIAYAAN
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Angsuran / Bulan</p>
              <p className="font-semibold">{IDRFormat(data.angsuranPerBulan)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Biaya Admin</p>
              <p>{IDRFormat(data.biayaAdmin)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed font-bold text-green-600">
              <p>Terima Bersih</p>
              <p>{IDRFormat(data.terimaBersih)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Total Margin</p>
              <p>{IDRFormat(data.totalMargin)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed font-bold text-blue-600">
              <p>Total Bayar</p>
              <p>{IDRFormat(data.totalBayar)}</p>
            </div>
          </div>
        </div>

        {/* TABEL JADWAL */}
        <div className="mt-4">
          <div className="p-2 bg-gray-700 font-bold text-white text-center rounded-t">
            JADWAL ANGSURAN
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 text-center">NO</th>
                <th className="border px-2 py-1 text-center">TANGGAL</th>
                <th className="border px-2 py-1 text-right">ANGSURAN</th>
                <th className="border px-2 py-1 text-right">MARGIN</th>
                <th className="border px-2 py-1 text-right">POKOK</th>
                <th className="border px-2 py-1 text-right">SISA POKOK</th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1 text-center">{row.no}</td>
                  <td className="border px-2 py-1 text-center">
                    {row.tanggal}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {IDRFormat(row.angsuran)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {IDRFormat(row.margin)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {IDRFormat(row.pokok)}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {IDRFormat(row.sisaPokok)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td className="border px-2 py-1 text-center" colSpan={2}>
                  TOTAL
                </td>
                <td className="border px-2 py-1 text-right">
                  {IDRFormat(data.totalBayar)}
                </td>
                <td className="border px-2 py-1 text-right">
                  {IDRFormat(data.totalMargin)}
                </td>
                <td className="border px-2 py-1 text-right">
                  {IDRFormat(data.plafond)}
                </td>
                <td className="border px-2 py-1 text-right">0</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <Button onClick={() => setOpen(false)} size="small">
          Tutup
        </Button>
        <Button
          type="primary"
          icon={<FilePdfOutlined />}
          onClick={handleDownloadImage}
          size="small"
        >
          Download Gambar
        </Button>
      </div>
    </Modal>
  );
};
