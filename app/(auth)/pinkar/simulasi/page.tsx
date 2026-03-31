"use client";

import { FormInput } from "@/components";
import { IDRFormat, IDRToNumber } from "@/components/utils/PembiayaanUtil";
import { useAccess } from "@/libs/Permission";
import {
  CalculatorOutlined,
  HistoryOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import { Button, Card, Divider, Image, Input, Modal, Table, TableProps } from "antd";
import moment from "moment";
import { useRef, useState, useMemo } from "react";
import { toPng } from "html-to-image";

interface IPinkarSimulasi {
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
  const [open, setOpen] = useState(false);
  const { hasAccess } = useAccess("/pinkar/simulasi");

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

    const marginPerBulan = (plafond * (marginRate / 100)) / 12;
    const pokokPerBulan = plafond / tenor;
    const angsuranPerBulan = Math.ceil(pokokPerBulan + marginPerBulan);
    const biayaAdmin = Math.ceil((plafond * adminRate) / 100);
    const terimaBersih = plafond - biayaAdmin;
    const totalMargin = Math.ceil(marginPerBulan * tenor);
    const totalBayar = angsuranPerBulan * tenor;

    // Jadwal angsuran
    const jadwal: IAngsuranRow[] = [];
    let sisaPokok = plafond;
    const startDate = moment().add(1, "month").startOf("month");

    for (let i = 1; i <= tenor; i++) {
      const tgl = startDate.clone().add(i - 1, "month");
      const pokok = i === tenor ? sisaPokok : Math.ceil(pokokPerBulan);
      const margin = Math.ceil(marginPerBulan);
      const angs = pokok + margin;
      sisaPokok = Math.max(0, sisaPokok - pokok);

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
          <Button
            danger
            icon={<HistoryOutlined />}
            onClick={handleReset}
          >
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
      link.download = `SimulasiPinkar-${data.fullname || "Karyawan"}.png`;
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
              SIMULASI PINJAMAN KARYAWAN
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
              <p className="font-semibold">{IDRFormat(calc.angsuranPerBulan)}</p>
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
