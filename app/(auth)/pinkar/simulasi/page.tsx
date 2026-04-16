"use client";

import { FormInput } from "@/components";
import { IDRFormat, IDRToNumber } from "@/components/utils/PembiayaanUtil";
import { useAccess } from "@/libs/Permission";
import {
  HistoryOutlined,
  PrinterOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Divider,
  Image,
  Modal,
  Table,
  TableProps,
  message,
} from "antd";
import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useRouter } from "next/navigation";

interface IPinkarSimulasi {
  memberId?: string;
  nip: string;
  fullname: string;
  plafond: number;
  tenor: number;
  marginRate: number; // % per tahun
  adminRate: number; // % dari plafond
}

interface IAngsuranRow {
  no: number;
  tanggal: string;
  angsuran: number;
  margin: number;
  pokok: number;
  sisaPokok: number;
}

interface IUserOption {
  id: string;
  nip: string | null;
  fullname: string;
  phone: string | null;
}

const defaultData: IPinkarSimulasi = {
  nip: "",
  fullname: "",
  plafond: 0,
  tenor: 6,
  marginRate: 18,
  adminRate: 5,
};

export default function Page() {
  const [data, setData] = useState<IPinkarSimulasi>(defaultData);
  const [members, setMembers] = useState<IUserOption[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [open, setOpen] = useState(false);
  useAccess("/pinkar/simulasi");

  useEffect(() => {
    const fetchMembers = async () => {
      setMembersLoading(true);
      try {
        const res = await fetch("/api/user?limit=1000");
        const result = await res.json();
        if (result.status === 200 && Array.isArray(result.data)) {
          setMembers(result.data);
        } else {
          message.error("Data anggota tidak berhasil dimuat");
        }
      } catch (error) {
        console.error("Error fetching members:", error);
        message.error("Terjadi kesalahan saat memuat data anggota");
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        label: `${member.nip || "-"} - ${member.fullname}`,
        value: member.id,
      })),
    [members],
  );

  const handleSelectMember = (memberId?: string) => {
    if (!memberId) {
      setData((prev) => ({
        ...prev,
        memberId: undefined,
        nip: "",
        fullname: "",
      }));
      return;
    }

    const selectedMember = members.find((member) => member.id === memberId);

    if (!selectedMember) {
      return;
    }

    setData((prev) => ({
      ...prev,
      memberId,
      nip: selectedMember.nip || "",
      fullname: selectedMember.fullname,
    }));
  };

  // Kalkulasi
  const calc = useMemo(() => {
    const { plafond, tenor, marginRate, adminRate } = data;
    if (plafond <= 0 || tenor <= 0) {
      return {
        angsuranPerBulan: 0,
        biayaAdmin: 0,
        terimaBersih: 0,
        totalMargin: 0,
        totalBayar: 0,
        jadwal: [] as IAngsuranRow[],
      };
    }

    // Helper untuk pembulatan ke 1000 terdekat
    const roundToThousand = (num: number) => Math.ceil(num / 1000) * 1000;

    const marginPerBulan = (plafond * (marginRate / 100)) / 12;
    const pokokPerBulan = plafond / tenor;
    const angsuranPerBulan = roundToThousand(pokokPerBulan + marginPerBulan);
    const biayaAdmin = (plafond * adminRate) / 100;
    const terimaBersih = plafond - biayaAdmin;
    const totalMargin = roundToThousand(marginPerBulan * tenor);
    const totalBayar = angsuranPerBulan * tenor;

    // Jadwal angsuran
    const jadwal: IAngsuranRow[] = [];
    let sisaPokok = plafond;
    const startDate = moment().startOf("month");

    for (let i = 1; i <= tenor; i++) {
      const tgl = startDate.clone().add(i - 1, "month");
      const pokok = i === tenor ? sisaPokok : pokokPerBulan;
      const margin = marginPerBulan;
      const angs = angsuranPerBulan;
      sisaPokok = sisaPokok - pokok;

      jadwal.push({
        no: i,
        tanggal: tgl.format("DD/MM/YYYY"),
        angsuran: angs,
        margin: margin,
        pokok: pokok,
        sisaPokok: sisaPokok,
      });
    }

    return {
      angsuranPerBulan,
      biayaAdmin,
      terimaBersih,
      totalMargin,
      totalBayar,
      jadwal,
    };
  }, [data]);

  const handleReset = () => {
    setData(defaultData);
  };

  const jadwalColumns: TableProps<IAngsuranRow>["columns"] = [
    {
      title: "NO",
      dataIndex: "no",
      key: "no",
      width: 50,
      align: "center",
    },
    {
      title: "TANGGAL",
      dataIndex: "tanggal",
      key: "tanggal",
      width: 120,
      align: "center",
    },
    {
      title: "ANGSURAN",
      dataIndex: "angsuran",
      key: "angsuran",
      width: 120,
      align: "right",
      render: (v: number) => IDRFormat(v),
    },
    {
      title: "MARGIN",
      dataIndex: "margin",
      key: "margin",
      width: 100,
      align: "right",
      render: (v: number) => IDRFormat(v),
    },
    {
      title: "POKOK",
      dataIndex: "pokok",
      key: "pokok",
      width: 100,
      align: "right",
      render: (v: number) => IDRFormat(v),
    },
    {
      title: "SISA POKOK",
      dataIndex: "sisaPokok",
      key: "sisaPokok",
      width: 120,
      align: "right",
      render: (v: number) => IDRFormat(v),
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* FORM KIRI - RINCIAN PEMBIAYAAN */}
      <Card
        style={{ flex: 1 }}
        styles={{
          title: { margin: 0, padding: 0 },
          body: { margin: 12, padding: 0 },
        }}
      >
        <div className="w-full bg-green-600 text-gray-50 p-2 rounded mb-3 text-center font-bold">
          RINCIAN PEMBIAYAAN
        </div>

        <div className="flex flex-col gap-2">
          <FormInput
            data={{
              label: "NIP/No Anggota",
              type: "select",
              mode: "vertical",
              class: "flex-1",
              value: data.memberId,
              options: memberOptions,
              disabled: membersLoading,
              onChange: (e?: string) => handleSelectMember(e),
            }}
          />
          <FormInput
            data={{
              label: "Nama Lengkap",
              type: "text",
              mode: "vertical",
              class: "flex-1",
              value: data.fullname,
              disabled: true,
            }}
          />
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
          <FormInput
            data={{
              label: "Margin Bunga (%/Tahun)",
              type: "number",
              mode: "vertical",
              class: "flex-1",
              value: data.marginRate,
              onChange: (e: string) =>
                setData({ ...data, marginRate: Number(e) || 0 }),
            }}
          />
          <FormInput
            data={{
              label: "Biaya Admin (%)",
              type: "number",
              mode: "vertical",
              class: "flex-1",
              value: data.adminRate,
              onChange: (e: string) =>
                setData({ ...data, adminRate: Number(e) || 0 }),
            }}
          />
        </div>

        <div className="mt-5 flex justify-between">
          <Button danger icon={<HistoryOutlined />} onClick={handleReset}>
            Reset
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => setOpen(true)}
            disabled={data.plafond <= 0 || data.tenor <= 0}
          >
            Cetak
          </Button>
        </div>
      </Card>

      {/* PANEL KANAN - HASIL KALKULASI */}
      <Card
        style={{ flex: 2 }}
        styles={{
          title: { margin: 0, padding: 0 },
          body: { margin: 12, padding: 0 },
        }}
      >
        <div className="w-full bg-red-600 text-gray-50 p-2 rounded mb-3 text-center font-bold">
          RINCIAN PEMBIAYAAN
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex gap-4 justify-between items-center border-b border-dashed py-1">
            <div className="flex-1 font-medium">Angsuran</div>
            <div className="text-right font-bold" style={{ minWidth: 150 }}>
              {IDRFormat(calc.angsuranPerBulan)}
            </div>
          </div>
          <div className="flex gap-4 justify-between items-center border-b border-dashed py-1">
            <div className="flex-1 font-medium">Biaya Admin</div>
            <div className="text-right" style={{ minWidth: 150 }}>
              {IDRFormat(calc.biayaAdmin)}
            </div>
          </div>
          <div className="flex gap-4 justify-between items-center border-b border-dashed py-1 font-bold text-green-600">
            <div className="flex-1">Terima Bersih</div>
            <div className="text-right" style={{ minWidth: 150 }}>
              {IDRFormat(calc.terimaBersih)}
            </div>
          </div>
        </div>

        <Divider style={{ margin: "12px 0" }} />

        {/* TABEL JADWAL ANGSURAN */}
        <Table
          columns={jadwalColumns}
          dataSource={calc.jadwal}
          rowKey="no"
          size="small"
          pagination={false}
          bordered
          scroll={{ y: "50vh" }}
          summary={() =>
            calc.jadwal.length > 0 ? (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2} align="center">
                    <strong>TOTAL</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <strong>{IDRFormat(calc.totalBayar)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong>{IDRFormat(calc.totalMargin)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong>{IDRFormat(data.plafond)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5} align="right">
                    <strong>0</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            ) : undefined
          }
        />
      </Card>

      {/* MODAL CETAK */}
      <ModalCetakPinkar data={data} calc={calc} open={open} setOpen={setOpen} />
    </div>
  );
}

// ====== MODAL CETAK ======
const ModalCetakPinkar = ({
  data,
  calc,
  open,
  setOpen,
}: {
  data: IPinkarSimulasi;
  calc: {
    angsuranPerBulan: number;
    biayaAdmin: number;
    terimaBersih: number;
    totalMargin: number;
    totalBayar: number;
    jadwal: IAngsuranRow[];
  };
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDownloadImage = async () => {
    if (printRef.current === null) return;

    try {
      const dataUrl = await toPng(printRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `SimulasiPinkar-${data.fullname || "Karyawan"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mendownload gambar", err);
    }
  };

  const handleSavePinjaman = async () => {
    if (!data.nip || !data.fullname || data.plafond <= 0) {
      message.error(
        "Data tidak lengkap. Silakan isi semua field yang diperlukan",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/pinjaman", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nip: data.nip,
          fullname: data.fullname,
          plafond: data.plafond,
          tenor: data.tenor,
          marginRate: data.marginRate,
          adminRate: data.adminRate,
          biayaAdmin: calc.biayaAdmin,
          terimaBersih: calc.terimaBersih,
          totalMargin: calc.totalMargin,
          totalBayar: calc.totalBayar,
          angsuranPerBulan: calc.angsuranPerBulan,
          scheduleJson: calc.jadwal,
        }),
      });

      const result = await res.json();

      if (result.success) {
        message.success("Data pinjaman berhasil disimpan!");
        setOpen(false);
        router.replace("/pinkar/data-pinjaman");
      } else {
        message.error(result.message || "Gagal menyimpan data pinjaman");
      }
    } catch (error) {
      console.error("Error saving pinjaman:", error);
      message.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
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
            alt="Logo aplikasi"
          />
          <div>
            <p className="font-bold text-lg">SIMULASI PINJAMAN KARYAWAN</p>
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
              <p>Tanggal Simulasi</p>
              <p>{moment().format("DD-MM-YYYY")}</p>
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
              <p className="font-semibold">
                {IDRFormat(calc.angsuranPerBulan)}
              </p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Biaya Admin</p>
              <p>{IDRFormat(calc.biayaAdmin)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed font-bold text-green-600">
              <p>Terima Bersih</p>
              <p>{IDRFormat(calc.terimaBersih)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Total Margin</p>
              <p>{IDRFormat(calc.totalMargin)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed font-bold text-blue-600">
              <p>Total Bayar</p>
              <p>{IDRFormat(calc.totalBayar)}</p>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSavePinjaman}
                loading={loading}
                size="small"
              >
                Simpan Data Pinjaman
              </Button>
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
              {calc.jadwal.map((row) => (
                <tr key={row.no}>
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
                  {IDRFormat(calc.totalBayar)}
                </td>
                <td className="border px-2 py-1 text-right">
                  {IDRFormat(calc.totalMargin)}
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
        <Button
          type="default"
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
