"use client";

import { FormInput } from "@/components";
import { IDRFormat, IDRToNumber } from "@/components/utils/PembiayaanUtil";
import { useAccess } from "@/libs/Permission";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  HistoryOutlined,
  PrinterOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Checkbox,
  Divider,
  Image,
  Input,
  Modal,
  Table,
  TableProps,
  Tag,
} from "antd";
import moment from "moment";
import { useRef, useState, useMemo } from "react";
import { toPng } from "html-to-image";

// ====== INTERFACES ======
interface IBerkasItem {
  no: number;
  nama: string;
  kategori: string;
  wajib: boolean;
  tersedia: boolean;
  keterangan: string;
}

interface IPemberkasan {
  nip: string;
  fullname: string;
  jabatan: string;
  unitKerja: string;
  plafond: number;
  tenor: number;
  tanggalPengajuan: string;
}

// ====== DEFAULT DATA ======
const defaultBerkas: IBerkasItem[] = [
  { no: 1, nama: "Fotokopi KTP", kategori: "Identitas", wajib: true, tersedia: false, keterangan: "" },
  { no: 2, nama: "Fotokopi Kartu Keluarga (KK)", kategori: "Identitas", wajib: true, tersedia: false, keterangan: "" },
  { no: 3, nama: "Pas Foto 3x4 (2 lembar)", kategori: "Identitas", wajib: true, tersedia: false, keterangan: "" },
  { no: 4, nama: "Slip Gaji 3 Bulan Terakhir", kategori: "Keuangan", wajib: true, tersedia: false, keterangan: "" },
  { no: 5, nama: "Surat Keterangan Kerja", kategori: "Kepegawaian", wajib: true, tersedia: false, keterangan: "" },
  { no: 6, nama: "Fotokopi SK Karyawan Tetap", kategori: "Kepegawaian", wajib: true, tersedia: false, keterangan: "" },
  { no: 7, nama: "Fotokopi NPWP", kategori: "Keuangan", wajib: true, tersedia: false, keterangan: "" },
  { no: 8, nama: "Rekening Koran 3 Bulan Terakhir", kategori: "Keuangan", wajib: true, tersedia: false, keterangan: "" },
  { no: 9, nama: "Surat Persetujuan Suami/Istri", kategori: "Lainnya", wajib: true, tersedia: false, keterangan: "" },
  { no: 10, nama: "Fotokopi Buku Nikah", kategori: "Identitas", wajib: false, tersedia: false, keterangan: "" },
  { no: 11, nama: "Fotokopi BPJS Kesehatan", kategori: "Lainnya", wajib: false, tersedia: false, keterangan: "" },
  { no: 12, nama: "Fotokopi BPJS Ketenagakerjaan", kategori: "Lainnya", wajib: false, tersedia: false, keterangan: "" },
  { no: 13, nama: "Surat Kuasa Potong Gaji", kategori: "Keuangan", wajib: true, tersedia: false, keterangan: "" },
  { no: 14, nama: "Formulir Permohonan Pinjaman", kategori: "Lainnya", wajib: true, tersedia: false, keterangan: "" },
];

const defaultPemberkasan: IPemberkasan = {
  nip: "",
  fullname: "",
  jabatan: "",
  unitKerja: "",
  plafond: 0,
  tenor: 6,
  tanggalPengajuan: moment().format("YYYY-MM-DD"),
};

export default function Page() {
  const [data, setData] = useState<IPemberkasan>(defaultPemberkasan);
  const [berkas, setBerkas] = useState<IBerkasItem[]>(
    defaultBerkas.map((b) => ({ ...b }))
  );
  const [open, setOpen] = useState(false);
  const { hasAccess } = useAccess("/pinkar/pemberkasan");

  // Statistik
  const stats = useMemo(() => {
    const total = berkas.length;
    const wajib = berkas.filter((b) => b.wajib);
    const wajibTersedia = wajib.filter((b) => b.tersedia).length;
    const opsional = berkas.filter((b) => !b.wajib);
    const opsionalTersedia = opsional.filter((b) => b.tersedia).length;
    const allTersedia = berkas.filter((b) => b.tersedia).length;
    const wajibLengkap = wajibTersedia === wajib.length;

    return {
      total,
      wajibCount: wajib.length,
      wajibTersedia,
      opsionalCount: opsional.length,
      opsionalTersedia,
      allTersedia,
      wajibLengkap,
      persentase: total > 0 ? Math.round((allTersedia / total) * 100) : 0,
    };
  }, [berkas]);

  const handleToggleBerkas = (no: number, checked: boolean) => {
    setBerkas((prev) =>
      prev.map((b) => (b.no === no ? { ...b, tersedia: checked } : b))
    );
  };

  const handleKeterangan = (no: number, value: string) => {
    setBerkas((prev) =>
      prev.map((b) => (b.no === no ? { ...b, keterangan: value } : b))
    );
  };

  const handleCheckAllWajib = (checked: boolean) => {
    setBerkas((prev) =>
      prev.map((b) => (b.wajib ? { ...b, tersedia: checked } : b))
    );
  };

  const handleCheckAll = (checked: boolean) => {
    setBerkas((prev) => prev.map((b) => ({ ...b, tersedia: checked })));
  };

  const handleReset = () => {
    setData(defaultPemberkasan);
    setBerkas(defaultBerkas.map((b) => ({ ...b })));
  };

  // Columns tabel berkas
  const columns: TableProps<IBerkasItem>["columns"] = [
    {
      title: "No",
      dataIndex: "no",
      key: "no",
      width: 50,
      align: "center",
    },
    {
      title: "Nama Berkas",
      dataIndex: "nama",
      key: "nama",
      render: (val: string, record) => (
        <span>
          {val}
          {record.wajib && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </span>
      ),
    },
    {
      title: "Kategori",
      dataIndex: "kategori",
      key: "kategori",
      width: 120,
      align: "center",
      render: (val: string) => {
        const colorMap: Record<string, string> = {
          Identitas: "blue",
          Keuangan: "green",
          Kepegawaian: "orange",
          Lainnya: "default",
        };
        return <Tag color={colorMap[val] || "default"}>{val}</Tag>;
      },
    },
    {
      title: "Wajib",
      dataIndex: "wajib",
      key: "wajib",
      width: 70,
      align: "center",
      render: (val: boolean) =>
        val ? (
          <Tag color="red">Wajib</Tag>
        ) : (
          <Tag color="default">Opsional</Tag>
        ),
    },
    {
      title: (
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span>Tersedia</span>
          <Checkbox
            checked={stats.allTersedia === stats.total}
            indeterminate={stats.allTersedia > 0 && stats.allTersedia < stats.total}
            onChange={(e) => handleCheckAll(e.target.checked)}
            style={{ marginLeft: 4 }}
          />
        </div>
      ),
      dataIndex: "tersedia",
      key: "tersedia",
      width: 100,
      align: "center",
      render: (val: boolean, record) => (
        <Checkbox
          checked={val}
          onChange={(e) => handleToggleBerkas(record.no, e.target.checked)}
        />
      ),
    },
    {
      title: "Keterangan",
      dataIndex: "keterangan",
      key: "keterangan",
      width: 200,
      render: (val: string, record) => (
        <Input
          size="small"
          value={val}
          placeholder="Keterangan..."
          onChange={(e) => handleKeterangan(record.no, e.target.value)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* FORM DATA KARYAWAN */}
      <Card
        styles={{
          title: { margin: 0, padding: 0 },
          body: { margin: 12, padding: 0 },
        }}
      >
        <div className="w-full bg-green-600 text-gray-50 p-2 rounded mb-3 text-center font-bold">
          <FolderOpenOutlined className="mr-2" />
          DATA PINJAMAN KARYAWAN
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-2 flex-1">
            <FormInput
              data={{
                label: "Tanggal Pengajuan",
                type: "date",
                mode: "vertical",
                class: "flex-1",
                value: data.tanggalPengajuan,
                onChange: (e: string) =>
                  setData({ ...data, tanggalPengajuan: e }),
              }}
            />
            <FormInput
              data={{
                label: "NIP/No Anggota",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                value: data.nip,
                onChange: (e: string) => setData({ ...data, nip: e }),
              }}
            />
            <FormInput
              data={{
                label: "Nama Lengkap",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                value: data.fullname,
                onChange: (e: string) => setData({ ...data, fullname: e }),
              }}
            />
          </div>
          <div className="flex flex-col gap-2 flex-1">
            <FormInput
              data={{
                label: "Jabatan",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                value: data.jabatan,
                onChange: (e: string) => setData({ ...data, jabatan: e }),
              }}
            />
            <FormInput
              data={{
                label: "Unit Kerja",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                value: data.unitKerja,
                onChange: (e: string) => setData({ ...data, unitKerja: e }),
              }}
            />
            <div className="flex gap-2">
              <FormInput
                data={{
                  label: "Plafond",
                  type: "text",
                  mode: "vertical",
                  class: "flex-1",
                  value: IDRFormat(data.plafond || 0),
                  onChange: (e: string) =>
                    setData({ ...data, plafond: IDRToNumber(e || "0") }),
                }}
              />
              <FormInput
                data={{
                  label: "Tenor (Bulan)",
                  type: "number",
                  mode: "vertical",
                  class: "flex-1",
                  value: data.tenor,
                  onChange: (e: string) =>
                    setData({ ...data, tenor: Number(e) || 0 }),
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* STATUS KELENGKAPAN */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Card style={{ flex: 1 }} styles={{ body: { padding: 12 } }}>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Kelengkapan Berkas</p>
            <p className="text-3xl font-bold" style={{ color: stats.persentase === 100 ? "#52c41a" : stats.persentase >= 50 ? "#faad14" : "#ff4d4f" }}>
              {stats.persentase}%
            </p>
            <p className="text-xs text-gray-400">
              {stats.allTersedia} / {stats.total} berkas
            </p>
          </div>
        </Card>
        <Card style={{ flex: 1 }} styles={{ body: { padding: 12 } }}>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Berkas Wajib</p>
            <p className="text-3xl font-bold" style={{ color: stats.wajibLengkap ? "#52c41a" : "#ff4d4f" }}>
              {stats.wajibTersedia} / {stats.wajibCount}
            </p>
            <p className="text-xs text-gray-400">
              {stats.wajibLengkap ? (
                <span className="text-green-500">
                  <CheckCircleOutlined className="mr-1" />Lengkap
                </span>
              ) : (
                <span className="text-red-500">
                  <CloseCircleOutlined className="mr-1" />Belum Lengkap
                </span>
              )}
            </p>
          </div>
        </Card>
        <Card style={{ flex: 1 }} styles={{ body: { padding: 12 } }}>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Berkas Opsional</p>
            <p className="text-3xl font-bold text-blue-500">
              {stats.opsionalTersedia} / {stats.opsionalCount}
            </p>
            <p className="text-xs text-gray-400">Dokumen pendukung</p>
          </div>
        </Card>
        <Card style={{ flex: 1 }} styles={{ body: { padding: 12 } }}>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Status Pengajuan</p>
            {stats.wajibLengkap ? (
              <Tag color="success" className="text-lg mt-1 px-4 py-1">
                <CheckCircleOutlined className="mr-1" /> SIAP DIAJUKAN
              </Tag>
            ) : (
              <Tag color="error" className="text-lg mt-1 px-4 py-1">
                <CloseCircleOutlined className="mr-1" /> BELUM LENGKAP
              </Tag>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {stats.wajibLengkap
                ? "Semua berkas wajib tersedia"
                : `Kurang ${stats.wajibCount - stats.wajibTersedia} berkas wajib`}
            </p>
          </div>
        </Card>
      </div>

      {/* TABEL CHECKLIST BERKAS */}
      <Card
        styles={{
          title: { margin: 0, padding: 0 },
          body: { margin: 8, padding: 0 },
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="w-full bg-gray-700 text-gray-50 p-2 rounded text-center font-bold">
            <FileTextOutlined className="mr-2" />
            CHECKLIST BERKAS PERSYARATAN
          </div>
        </div>

        <div className="flex gap-2 mb-2">
          <Button
            size="small"
            type="primary"
            onClick={() => handleCheckAllWajib(true)}
          >
            Ceklis Semua Wajib
          </Button>
          <Button
            size="small"
            onClick={() => handleCheckAll(true)}
          >
            Ceklis Semua
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleCheckAll(false)}
          >
            Hapus Semua
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={berkas}
          rowKey="no"
          size="small"
          pagination={false}
          bordered
          rowClassName={(record) =>
            record.wajib && !record.tersedia
              ? "bg-red-50"
              : record.tersedia
              ? "bg-green-50"
              : ""
          }
        />

        <div className="flex justify-between mt-4">
          <Button danger icon={<HistoryOutlined />} onClick={handleReset}>
            Reset
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => setOpen(true)}
            disabled={!data.nip && !data.fullname}
          >
            Cetak Checklist
          </Button>
        </div>
      </Card>

      {/* MODAL CETAK */}
      <ModalCetakBerkas
        data={data}
        berkas={berkas}
        stats={stats}
        open={open}
        setOpen={setOpen}
      />
    </div>
  );
}

// ====== MODAL CETAK ======
const ModalCetakBerkas = ({
  data,
  berkas,
  stats,
  open,
  setOpen,
}: {
  data: IPemberkasan;
  berkas: IBerkasItem[];
  stats: {
    total: number;
    wajibCount: number;
    wajibTersedia: number;
    opsionalCount: number;
    opsionalTersedia: number;
    allTersedia: number;
    wajibLengkap: boolean;
    persentase: number;
  };
  open: boolean;
  setOpen: Function;
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadImage = async () => {
    if (printRef.current === null) return;
    try {
      const dataUrl = await toPng(printRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `Pemberkasan-${data.fullname || "Karyawan"}.png`;
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
      width={900}
      style={{ top: 10 }}
    >
      <div
        ref={printRef}
        style={{ padding: "16px", backgroundColor: "#fff" }}
        className="text-gray-700"
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Image
            src={process.env.NEXT_PUBLIC_APP_LOGO}
            width={50}
            preview={false}
          />
          <div>
            <p className="font-bold text-lg">CHECKLIST PEMBERKASAN PINJAMAN KARYAWAN</p>
            <p className="text-xs text-gray-500">
              {process.env.NEXT_PUBLIC_APP_FULLNAME}
            </p>
          </div>
        </div>

        {/* Data Karyawan */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1" style={{ minWidth: 250 }}>
            <div className="p-2 bg-green-600 font-bold text-white text-center rounded-t text-sm">
              DATA KARYAWAN
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>Tanggal Pengajuan</span>
              <span>{moment(data.tanggalPengajuan).format("DD-MM-YYYY")}</span>
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>NIP/No Anggota</span>
              <span className="font-semibold">{data.nip || "-"}</span>
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>Nama Lengkap</span>
              <span className="font-semibold">{data.fullname || "-"}</span>
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>Jabatan</span>
              <span>{data.jabatan || "-"}</span>
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>Unit Kerja</span>
              <span>{data.unitKerja || "-"}</span>
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>Plafond</span>
              <span className="font-semibold">{IDRFormat(data.plafond)}</span>
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>Tenor</span>
              <span>{data.tenor} Bulan</span>
            </div>
          </div>

          <div className="flex-1" style={{ minWidth: 250 }}>
            <div className="p-2 bg-blue-600 font-bold text-white text-center rounded-t text-sm">
              RINGKASAN KELENGKAPAN
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>Total Berkas</span>
              <span className="font-semibold">{stats.allTersedia} / {stats.total}</span>
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>Berkas Wajib</span>
              <span className="font-semibold" style={{ color: stats.wajibLengkap ? "#52c41a" : "#ff4d4f" }}>
                {stats.wajibTersedia} / {stats.wajibCount}
              </span>
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>Berkas Opsional</span>
              <span>{stats.opsionalTersedia} / {stats.opsionalCount}</span>
            </div>
            <div className="border-b py-1 flex justify-between border-gray-200 text-sm">
              <span>Kelengkapan</span>
              <span className="font-bold">{stats.persentase}%</span>
            </div>
            <div className="border-b py-2 flex justify-between border-gray-200 text-sm">
              <span>Status</span>
              <span
                className="font-bold"
                style={{ color: stats.wajibLengkap ? "#52c41a" : "#ff4d4f" }}
              >
                {stats.wajibLengkap ? "✅ SIAP DIAJUKAN" : "❌ BELUM LENGKAP"}
              </span>
            </div>
          </div>
        </div>

        {/* Tabel Berkas */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-700 text-white">
              <th className="border px-2 py-1 text-center" style={{ width: 40 }}>No</th>
              <th className="border px-2 py-1 text-left">Nama Berkas</th>
              <th className="border px-2 py-1 text-center" style={{ width: 90 }}>Kategori</th>
              <th className="border px-2 py-1 text-center" style={{ width: 60 }}>Wajib</th>
              <th className="border px-2 py-1 text-center" style={{ width: 70 }}>Status</th>
              <th className="border px-2 py-1 text-left">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {berkas.map((b) => (
              <tr
                key={b.no}
                style={{
                  backgroundColor: b.wajib && !b.tersedia ? "#fff1f0" : b.tersedia ? "#f6ffed" : undefined,
                }}
              >
                <td className="border px-2 py-1 text-center">{b.no}</td>
                <td className="border px-2 py-1">{b.nama}</td>
                <td className="border px-2 py-1 text-center">{b.kategori}</td>
                <td className="border px-2 py-1 text-center">
                  {b.wajib ? "✓" : "-"}
                </td>
                <td className="border px-2 py-1 text-center">
                  {b.tersedia ? (
                    <span style={{ color: "#52c41a" }}>✅</span>
                  ) : (
                    <span style={{ color: "#ff4d4f" }}>❌</span>
                  )}
                </td>
                <td className="border px-2 py-1">{b.keterangan || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="flex justify-between mt-6 text-sm">
          <div className="text-center" style={{ width: 200 }}>
            <p>Pemohon,</p>
            <div style={{ height: 60 }}></div>
            <p className="font-semibold border-t border-gray-300 pt-1">
              {data.fullname || "(................................)"}
            </p>
          </div>
          <div className="text-center" style={{ width: 200 }}>
            <p>Mengetahui,</p>
            <div style={{ height: 60 }}></div>
            <p className="font-semibold border-t border-gray-300 pt-1">
              (................................)
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-2">
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handleDownloadImage}
          size="small"
        >
          Download Gambar
        </Button>
      </div>
    </Modal>
  );
};
