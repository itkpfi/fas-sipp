"use client";

import { FormInput } from "@/components";
import { IDRFormat, IDRToNumber } from "@/components/utils/PembiayaanUtil";
import {
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Divider,
  Image,
  Modal,
  Popconfirm,
  Tag,
  Table,
  TableProps,
  message,
} from "antd";
import { toPng } from "html-to-image";
import moment from "moment";
import { useEffect, useMemo, useRef, useState } from "react";

interface IPinjamanData {
  id: string;
  nip: string;
  fullname: string;
  phone: string | null;
  plafond: number;
  tenor: number;
  marginRate: number;
  adminRate: number;
  biayaAdmin: number;
  terimaBersih: number;
  totalMargin: number;
  totalBayar: number;
  angsuranPerBulan: number;
  berkasFileUrl: string | null;
  akadFileUrl: string | null;
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

interface IUserOption {
  id: string;
  nip: string | null;
  fullname: string;
  phone: string | null;
  address: string | null;
}

const normalizeText = (value?: string | null) => (value || "").trim().toLowerCase();

const findMemberByPinjaman = (record: IPinjamanData, members: IUserOption[]) => {
  const normalizedNip = normalizeText(record.nip);
  const normalizedName = normalizeText(record.fullname);

  return (
    members.find((member) => normalizeText(member.nip) === normalizedNip) ||
    members.find((member) => normalizeText(member.fullname) === normalizedName) ||
    null
  );
};

interface IEditablePinjaman {
  memberId?: string;
  nip: string;
  fullname: string;
  phone: string;
  plafond: number;
  tenor: number;
  marginRate: number;
  adminRate: number;
  startDate?: string;
}

interface IPinkarCalc {
  angsuranPerBulan: number;
  biayaAdmin: number;
  terimaBersih: number;
  totalMargin: number;
  totalBayar: number;
  jadwal: IAngsuranRow[];
}

const roundToThousand = (num: number) => Math.ceil(num / 1000) * 1000;

const getDefaultPinkarStartDate = () => moment().add(1, "month").startOf("month");

const parsePinkarStartDate = (scheduleJson: string) => {
  try {
    const parsed = JSON.parse(scheduleJson) as IAngsuranRow[];
    const firstSchedule = parsed[0];

    if (!firstSchedule?.tanggal) {
      return getDefaultPinkarStartDate();
    }

    const [day, month, year] = firstSchedule.tanggal.split("/");
    const parsedDate = moment(`${year}-${month}-${day}`, "YYYY-MM-DD", true);

    return parsedDate.isValid() ? parsedDate : getDefaultPinkarStartDate();
  } catch {
    return getDefaultPinkarStartDate();
  }
};

const calculatePinkarLoan = (form: IEditablePinjaman): IPinkarCalc => {
  const { plafond, tenor, marginRate, adminRate } = form;

  if (plafond <= 0 || tenor <= 0) {
    return {
      angsuranPerBulan: 0,
      biayaAdmin: 0,
      terimaBersih: 0,
      totalMargin: 0,
      totalBayar: 0,
      jadwal: [],
    };
  }

  const marginPerBulan = (plafond * (marginRate / 100)) / 12;
  const pokokPerBulan = plafond / tenor;
  const angsuranPerBulan = roundToThousand(pokokPerBulan + marginPerBulan);
  const biayaAdmin = roundToThousand((plafond * adminRate) / 100);
  const terimaBersih = plafond - biayaAdmin;
  const totalMargin = roundToThousand(marginPerBulan * tenor);
  const totalBayar = angsuranPerBulan * tenor;

  const jadwal: IAngsuranRow[] = [];
  let sisaPokok = plafond;
  const startDate = form.startDate
    ? moment(form.startDate, "YYYY-MM-DD", true)
    : getDefaultPinkarStartDate();
  const firstDueDate = startDate.isValid() ? startDate : getDefaultPinkarStartDate();

  for (let i = 1; i <= tenor; i++) {
    const tgl = firstDueDate.clone().add(i - 1, "month");
    const pokok = i === tenor ? sisaPokok : roundToThousand(pokokPerBulan);
    const margin = roundToThousand(marginPerBulan);
    const angsuran = pokok + margin;
    sisaPokok = Math.max(0, sisaPokok - pokok);

    jadwal.push({
      no: i,
      tanggal: tgl.format("DD/MM/YYYY"),
      angsuran,
      margin,
      pokok,
      sisaPokok,
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
};

const buildEditablePinjaman = (
  data: IPinjamanData,
  members: IUserOption[],
): IEditablePinjaman => {
  const matchedMember = members.find((member) => member.nip === data.nip);

  return {
    memberId: matchedMember?.id,
    nip: data.nip,
    fullname: data.fullname,
    phone: data.phone || "",
    plafond: data.plafond,
    tenor: data.tenor,
    marginRate: data.marginRate,
    adminRate: data.adminRate,
    startDate: parsePinkarStartDate(data.scheduleJson).format("YYYY-MM-DD"),
  };
};

export default function Page() {
  const [data, setData] = useState<IPinjamanData[]>([]);
  const [members, setMembers] = useState<IUserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IPinjamanData | null>(null);
  const [editingRecord, setEditingRecord] = useState<IPinjamanData | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [docOpen, setDocOpen] = useState(false);
  const [docSaving, setDocSaving] = useState(false);
  const [docType, setDocType] = useState<"berkas" | "akad">("berkas");
  const [docRecord, setDocRecord] = useState<IPinjamanData | null>(null);
  const [docUrl, setDocUrl] = useState<string | undefined>(undefined);
  const [docMemberAddress, setDocMemberAddress] = useState<string>("");

  useEffect(() => {
    fetchData();
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setMembersLoading(true);
    try {
      const res = await fetch("/api/user?limit=1000");
      const result = await res.json();

      if (result.status === 200 && Array.isArray(result.data)) {
        setMembers(result.data);
      } else {
        message.error("Gagal memuat data anggota");
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      message.error("Terjadi kesalahan saat memuat data anggota");
    } finally {
      setMembersLoading(false);
    }
  };

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

  const handleEdit = (record: IPinjamanData) => {
    setEditingRecord(record);
    setEditOpen(true);
  };

  const handleOpenDoc = (record: IPinjamanData, type: "berkas" | "akad") => {
    const matchedMember = findMemberByPinjaman(record, members);
    setDocType(type);
    setDocRecord(record);
    setDocUrl(type === "berkas" ? record.berkasFileUrl || undefined : record.akadFileUrl || undefined);
    setDocMemberAddress(matchedMember?.address || "");
    setDocOpen(true);

    const syncAddress = async () => {
      try {
        const query = encodeURIComponent(record.nip || record.fullname || "");
        const res = await fetch(`/api/user?search=${query}&limit=50`);
        const json = await res.json();
        const list: IUserOption[] = Array.isArray(json.data) ? json.data : [];

        const latestMatch =
          findMemberByPinjaman(record, list) ||
          findMemberByPinjaman(record, members);

        setDocMemberAddress(latestMatch?.address || "");
      } catch (error) {
        console.error("Error syncing member address:", error);
      }
    };

    syncAddress();
  };

  const handleSaveDoc = async () => {
    if (!docRecord?.id) {
      message.error("Data pinjaman tidak valid");
      return;
    }

    setDocSaving(true);
    try {
      const payload =
        docType === "berkas"
          ? { berkasFileUrl: docUrl || null }
          : { akadFileUrl: docUrl || null };

      const res = await fetch(`/api/pinjaman/${docRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!result.success) {
        message.error(result.message || "Gagal menyimpan dokumen");
        return;
      }

      message.success(`Dokumen ${docType.toUpperCase()} berhasil disimpan`);
      setDocOpen(false);
      setDocRecord(null);
      setDocUrl(undefined);
      await fetchData();
    } catch (error) {
      console.error("Error saving document:", error);
      message.error("Terjadi kesalahan saat menyimpan dokumen");
    } finally {
      setDocSaving(false);
    }
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
    },
    {
      title: "Nama Lengkap",
      dataIndex: "fullname",
      width: 180,
    },
    {
      title: "No Hp",
      dataIndex: "phone",
      width: 140,
      render: (value: string | null) => value || "-",
    },
    {
      title: "Plafond",
      dataIndex: "plafond",
      width: 140,
      align: "right",
      render: (value: number) => IDRFormat(value),
    },
    {
      title: "Tenor",
      dataIndex: "tenor",
      width: 100,
      align: "center",
      render: (value: number) => `${value} Bulan`,
    },
    {
      title: "Angsuran/Bulan",
      dataIndex: "angsuranPerBulan",
      width: 140,
      align: "right",
      render: (value: number) => IDRFormat(value),
    },
    {
      title: "Tanggal",
      dataIndex: "created_at",
      width: 150,
      align: "center",
      render: (value: string) => moment(value).format("DD-MM-YYYY HH:mm"),
    },
    {
      title: "Berkas",
      dataIndex: "berkasFileUrl",
      width: 90,
      align: "center",
      render: (value: string | null) =>
        value ? <Tag color="green">Tersedia</Tag> : <Tag color="default">Kosong</Tag>,
    },
    {
      title: "Akad",
      dataIndex: "akadFileUrl",
      width: 90,
      align: "center",
      render: (value: string | null) =>
        value ? <Tag color="green">Tersedia</Tag> : <Tag color="default">Kosong</Tag>,
    },
    {
      title: "Aksi",
      width: 300,
      align: "center",
      fixed: "right",
      render: (_, record) => (
        <div className="flex gap-2 justify-center items-center">
          <Button
            size="small"
            icon={<FolderOpenOutlined />}
            onClick={() => handleOpenDoc(record, "berkas")}
          >
            Berkas
          </Button>
          <Button
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => handleOpenDoc(record, "akad")}
          >
            Akad
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="Lihat Detail"
          />
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Update Data"
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

      {selectedRecord && (
        <ModalDetailPinjaman
          data={selectedRecord}
          open={detailOpen}
          setOpen={setDetailOpen}
        />
      )}

      {editingRecord && (
        <ModalUpdatePinjaman
          data={editingRecord}
          members={members}
          membersLoading={membersLoading}
          open={editOpen}
          setOpen={setEditOpen}
          onSuccess={async () => {
            await fetchData();
          }}
        />
      )}

      {docRecord && (
        <ModalDokumenPinjaman
          data={docRecord}
          memberAddress={docMemberAddress}
          type={docType}
          open={docOpen}
          fileUrl={docUrl}
          setFileUrl={setDocUrl}
          saving={docSaving}
          onSave={handleSaveDoc}
          onClose={() => {
            setDocOpen(false);
            setDocRecord(null);
            setDocUrl(undefined);
            setDocMemberAddress("");
          }}
        />
      )}
    </div>
  );
}

const ModalDetailPinjaman = ({
  data,
  open,
  setOpen,
}: {
  data: IPinjamanData;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [schedule, setSchedule] = useState<IAngsuranRow[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(data.scheduleJson) as IAngsuranRow[];
      setSchedule(parsed);
    } catch (error) {
      console.error("Error parsing schedule:", error);
      setSchedule([]);
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
            alt="Logo aplikasi"
          />
          <div>
            <p className="font-bold text-lg">DATA PINJAMAN KARYAWAN</p>
            <p className="text-xs text-gray-500">
              {process.env.NEXT_PUBLIC_APP_FULLNAME}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
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
              <p>No Hp</p>
              <p className="font-semibold">{data.phone || "-"}</p>
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
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>File Berkas</p>
              <p className="font-semibold">
                {data.berkasFileUrl ? (
                  <Button
                    type="link"
                    size="small"
                    className="!p-0"
                    onClick={() => window.open(data.berkasFileUrl || "", "_blank")}
                  >
                    Lihat File
                  </Button>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>File Akad</p>
              <p className="font-semibold">
                {data.akadFileUrl ? (
                  <Button
                    type="link"
                    size="small"
                    className="!p-0"
                    onClick={() => window.open(data.akadFileUrl || "", "_blank")}
                  >
                    Lihat File
                  </Button>
                ) : (
                  "-"
                )}
              </p>
            </div>
          </div>

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
              {schedule.map((row) => (
                <tr key={row.no}>
                  <td className="border px-2 py-1 text-center">{row.no}</td>
                  <td className="border px-2 py-1 text-center">{row.tanggal}</td>
                  <td className="border px-2 py-1 text-right">{IDRFormat(row.angsuran)}</td>
                  <td className="border px-2 py-1 text-right">{IDRFormat(row.margin)}</td>
                  <td className="border px-2 py-1 text-right">{IDRFormat(row.pokok)}</td>
                  <td className="border px-2 py-1 text-right">{IDRFormat(row.sisaPokok)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td className="border px-2 py-1 text-center" colSpan={2}>
                  TOTAL
                </td>
                <td className="border px-2 py-1 text-right">{IDRFormat(data.totalBayar)}</td>
                <td className="border px-2 py-1 text-right">{IDRFormat(data.totalMargin)}</td>
                <td className="border px-2 py-1 text-right">{IDRFormat(data.plafond)}</td>
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

const ModalUpdatePinjaman = ({
  data,
  members,
  membersLoading,
  open,
  setOpen,
  onSuccess,
}: {
  data: IPinjamanData;
  members: IUserOption[];
  membersLoading: boolean;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess: () => Promise<void>;
}) => {
  const [form, setForm] = useState<IEditablePinjaman>(buildEditablePinjaman(data, members));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(buildEditablePinjaman(data, members));
  }, [data, members, open]);

  const memberOptions = useMemo(
    () =>
      members.map((member) => ({
        label: `${member.nip || "-"} - ${member.fullname}`,
        value: member.id,
      })),
    [members],
  );

  const calc = useMemo(() => calculatePinkarLoan(form), [form]);

  const handleSelectMember = (memberId?: string) => {
    if (!memberId) {
      setForm((prev) => ({
        ...prev,
        memberId: undefined,
        nip: "",
        fullname: "",
        phone: "",
      }));
      return;
    }

    const selectedMember = members.find((member) => member.id === memberId);

    if (!selectedMember) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      memberId,
      nip: selectedMember.nip || "",
      fullname: selectedMember.fullname,
      phone: selectedMember.phone || "",
    }));
  };

  const handleSave = async () => {
    if (
      !form.nip ||
      !form.fullname ||
      !form.phone.trim() ||
      form.plafond <= 0 ||
      form.tenor <= 0
    ) {
      message.error("Data pinjaman belum lengkap");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/pinjaman/${data.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nip: form.nip,
          fullname: form.fullname,
          phone: form.phone.trim(),
          plafond: form.plafond,
          tenor: form.tenor,
          marginRate: form.marginRate,
          adminRate: form.adminRate,
          biayaAdmin: calc.biayaAdmin,
          terimaBersih: calc.terimaBersih,
          totalMargin: calc.totalMargin,
          totalBayar: calc.totalBayar,
          angsuranPerBulan: calc.angsuranPerBulan,
          scheduleJson: calc.jadwal,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        message.error(result.message || "Gagal memperbarui data pinjaman");
        return;
      }

      message.success("Data pinjaman berhasil diperbarui");
      setOpen(false);
      await onSuccess();
    } catch (error) {
      console.error("Error updating pinjaman:", error);
      message.error("Terjadi kesalahan saat memperbarui data pinjaman");
    } finally {
      setSaving(false);
    }
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
      render: (value: number) => IDRFormat(value),
    },
    {
      title: "MARGIN",
      dataIndex: "margin",
      key: "margin",
      width: 100,
      align: "right",
      render: (value: number) => IDRFormat(value),
    },
    {
      title: "POKOK",
      dataIndex: "pokok",
      key: "pokok",
      width: 100,
      align: "right",
      render: (value: number) => IDRFormat(value),
    },
    {
      title: "SISA POKOK",
      dataIndex: "sisaPokok",
      key: "sisaPokok",
      width: 120,
      align: "right",
      render: (value: number) => IDRFormat(value),
    },
  ];

  return (
    <Modal
      title="Update Data Pinjaman"
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleSave}
      okText="Simpan Perubahan"
      cancelText="Batal"
      confirmLoading={saving}
      width={1100}
      style={{ top: 20 }}
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <Card
          style={{ flex: 1 }}
          styles={{
            title: { margin: 0, padding: 0 },
            body: { margin: 12, padding: 0 },
          }}
        >
          <div className="w-full bg-green-600 text-gray-50 p-2 rounded mb-3 text-center font-bold">
            DATA PINJAMAN
          </div>
          <div className="flex flex-col gap-2">
            <FormInput
              data={{
                label: "NIP/No Anggota",
                type: "select",
                mode: "vertical",
                class: "flex-1",
                value: form.memberId,
                options: memberOptions,
                disabled: membersLoading,
                onChange: (value?: string) => handleSelectMember(value),
              }}
            />
            <FormInput
              data={{
                label: "Nama Lengkap",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                value: form.fullname,
                disabled: true,
              }}
            />
            <FormInput
              data={{
                label: "No Hp",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                value: form.phone,
                onChange: (value: string) =>
                  setForm((prev) => ({
                    ...prev,
                    phone: value,
                  })),
              }}
            />
            <FormInput
              data={{
                label: "Plafond",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                value: IDRFormat(form.plafond || 0),
                onChange: (value: string) =>
                  setForm((prev) => ({
                    ...prev,
                    plafond: IDRToNumber(value || "0"),
                  })),
              }}
            />
            <FormInput
              data={{
                label: "Tenor (Bulan)",
                type: "number",
                mode: "vertical",
                class: "flex-1",
                value: form.tenor,
                onChange: (value: string) =>
                  setForm((prev) => ({
                    ...prev,
                    tenor: Number(value) || 0,
                  })),
              }}
            />
            <FormInput
              data={{
                label: "Margin Bunga (%/Tahun)",
                type: "number",
                mode: "vertical",
                class: "flex-1",
                value: form.marginRate,
                onChange: (value: string) =>
                  setForm((prev) => ({
                    ...prev,
                    marginRate: Number(value) || 0,
                  })),
              }}
            />
            <FormInput
              data={{
                label: "Biaya Admin (%)",
                type: "number",
                mode: "vertical",
                class: "flex-1",
                value: form.adminRate,
                onChange: (value: string) =>
                  setForm((prev) => ({
                    ...prev,
                    adminRate: Number(value) || 0,
                  })),
              }}
            />
          </div>
        </Card>

        <Card
          style={{ flex: 1 }}
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
            <div className="flex gap-4 justify-between items-center border-b border-dashed py-1">
              <div className="flex-1 font-medium">Total Margin</div>
              <div className="text-right" style={{ minWidth: 150 }}>
                {IDRFormat(calc.totalMargin)}
              </div>
            </div>
            <div className="flex gap-4 justify-between items-center border-b border-dashed py-1 font-bold text-blue-600">
              <div className="flex-1">Total Bayar</div>
              <div className="text-right" style={{ minWidth: 150 }}>
                {IDRFormat(calc.totalBayar)}
              </div>
            </div>
          </div>

          <Divider style={{ margin: "12px 0" }} />

          <Table
            columns={jadwalColumns}
            dataSource={calc.jadwal}
            rowKey="no"
            size="small"
            pagination={false}
            bordered
            scroll={{ y: 320 }}
          />
        </Card>
      </div>
    </Modal>
  );
};

const ModalDokumenPinjaman = ({
  data,
  memberAddress,
  type,
  open,
  fileUrl,
  setFileUrl,
  saving,
  onSave,
  onClose,
}: {
  data: IPinjamanData;
  memberAddress: string;
  type: "berkas" | "akad";
  open: boolean;
  fileUrl?: string;
  setFileUrl: React.Dispatch<React.SetStateAction<string | undefined>>;
  saving: boolean;
  onSave: () => Promise<void>;
  onClose: () => void;
}) => {
  const templateRef = useRef<HTMLDivElement>(null);
  const [schedule, setSchedule] = useState<IAngsuranRow[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(data.scheduleJson) as IAngsuranRow[];
      setSchedule(parsed.slice(0, 6));
    } catch {
      setSchedule([]);
    }
  }, [data.scheduleJson]);

  const handleDownloadTemplate = async () => {
    if (templateRef.current === null) return;
    try {
      const dataUrl = await toPng(templateRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `Template-Berkas-${data.nip || data.fullname}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Gagal download template berkas:", error);
      message.error("Gagal mengunduh template berkas");
    }
  };

  return (
    <Modal
      title={type === "berkas" ? "Kelola Dokumen BERKAS" : "Kelola Dokumen AKAD"}
      open={open}
      onCancel={onClose}
      onOk={onSave}
      confirmLoading={saving}
      okText="Simpan"
      cancelText="Batal"
      width={1300}
      style={{ top: 20 }}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-[36%] border rounded p-3 bg-gray-50">
          <div className="bg-orange-500 text-white font-bold text-center rounded px-3 py-2 mb-3">
            DATA PENGAJUAN KARYAWAN
          </div>
          <div className="flex flex-col gap-2">
            <FormInput data={{ label: "NIP", type: "text", value: data.nip, disabled: true }} />
            <FormInput
              data={{ label: "Nama Karyawan", type: "text", value: data.fullname, disabled: true }}
            />
            <FormInput
              data={{ label: "No Telepon", type: "text", value: data.phone || "-", disabled: true }}
            />
            <FormInput
              data={{
                label: "Alamat / Lokasi",
                type: "textarea",
                value: memberAddress || "Alamat belum diisi di profil karyawan",
                disabled: true,
              }}
            />
            <FormInput
              data={{
                label: "Plafond",
                type: "text",
                value: IDRFormat(data.plafond),
                disabled: true,
              }}
            />
            <FormInput
              data={{
                label: "Tenor",
                type: "text",
                value: `${data.tenor} Bulan`,
                disabled: true,
              }}
            />
            <FormInput
              data={{
                label: "Angsuran/Bulan",
                type: "text",
                value: IDRFormat(data.angsuranPerBulan),
                disabled: true,
              }}
            />
            <Divider style={{ margin: "8px 0" }} />
            <FormInput
              data={{
                label: type === "berkas" ? "Upload File Berkas" : "Upload File Akad",
                type: "upload",
                mode: "vertical",
                value: fileUrl,
                accept: "image/png,image/jpg,image/jpeg,image/webp,application/pdf",
                onChange: (val: string) => setFileUrl(val),
              }}
            />
            {fileUrl && (
              <Button type="link" className="!px-0" onClick={() => window.open(fileUrl, "_blank")}>
                Lihat / Download File Tersimpan
              </Button>
            )}
          </div>
        </div>

        <div className="w-full lg:w-[64%] border rounded p-3 bg-white">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-gray-700 text-sm">Preview Template Dokumen</p>
            {type === "berkas" && (
              <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                Download Template Berkas
              </Button>
            )}
          </div>

          {type === "akad" ? (
            <div className="h-[560px] flex items-center justify-center text-gray-500 border rounded bg-gray-50">
              Upload file AKAD, lalu gunakan tombol &quot;Lihat / Download File Tersimpan&quot; di panel kiri.
            </div>
          ) : (
            <div
              ref={templateRef}
              className="border rounded p-6 bg-white text-gray-700"
              style={{ minHeight: 560 }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={process.env.NEXT_PUBLIC_APP_LOGO}
                  width={56}
                  preview={false}
                  alt="Logo"
                />
                <div>
                  <p className="font-bold text-lg">BERKAS PENGAJUAN PINJAMAN KARYAWAN</p>
                  <p className="text-xs text-gray-500">
                    {process.env.NEXT_PUBLIC_APP_FULLNAME || "Aplikasi"}
                  </p>
                </div>
              </div>
              <Divider style={{ margin: "8px 0 12px" }} />

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p>
                  NIP : <b>{data.nip}</b>
                </p>
                <p>
                  Tanggal Pengajuan : <b>{moment(data.created_at).format("DD-MM-YYYY")}</b>
                </p>
                <p>
                  Nama Karyawan : <b>{data.fullname}</b>
                </p>
                <p>
                  No Telepon : <b>{data.phone || "-"}</b>
                </p>
                <p className="col-span-2">
                  Alamat / Lokasi : <b>{memberAddress || "-"}</b>
                </p>
              </div>

              <div className="mt-4">
                <div className="bg-orange-500 text-white font-bold text-center rounded px-3 py-2 mb-2">
                  RINCIAN PINJAMAN
                </div>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    <tr>
                      <td className="border px-2 py-1">Plafond</td>
                      <td className="border px-2 py-1">{IDRFormat(data.plafond)}</td>
                      <td className="border px-2 py-1">Tenor</td>
                      <td className="border px-2 py-1">{data.tenor} Bulan</td>
                    </tr>
                    <tr>
                      <td className="border px-2 py-1">Angsuran/Bulan</td>
                      <td className="border px-2 py-1">{IDRFormat(data.angsuranPerBulan)}</td>
                      <td className="border px-2 py-1">Total Bayar</td>
                      <td className="border px-2 py-1">{IDRFormat(data.totalBayar)}</td>
                    </tr>
                    <tr>
                      <td className="border px-2 py-1">Biaya Admin</td>
                      <td className="border px-2 py-1">{IDRFormat(data.biayaAdmin)}</td>
                      <td className="border px-2 py-1">Terima Bersih</td>
                      <td className="border px-2 py-1">{IDRFormat(data.terimaBersih)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <div className="bg-gray-700 text-white font-bold text-center rounded px-3 py-2 mb-2">
                  JADWAL ANGSURAN (6 BULAN AWAL)
                </div>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">No</th>
                      <th className="border px-2 py-1">Tanggal</th>
                      <th className="border px-2 py-1 text-right">Pokok</th>
                      <th className="border px-2 py-1 text-right">Margin</th>
                      <th className="border px-2 py-1 text-right">Angsuran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => (
                      <tr key={row.no}>
                        <td className="border px-2 py-1 text-center">{row.no}</td>
                        <td className="border px-2 py-1 text-center">{row.tanggal}</td>
                        <td className="border px-2 py-1 text-right">{IDRFormat(row.pokok)}</td>
                        <td className="border px-2 py-1 text-right">{IDRFormat(row.margin)}</td>
                        <td className="border px-2 py-1 text-right">{IDRFormat(row.angsuran)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
