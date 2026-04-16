"use client";

import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { useAccess } from "@/libs/Permission";
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { Button, Progress, Spin, Table, TableProps } from "antd";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface IUserSummary {
  id: string;
}

interface IUserRelation {
  id: string;
  nip?: string | null;
  fullname?: string | null;
  position?: string | null;
}

interface IPinjaman {
  id: string;
  plafond: number;
  tenor: number;
  biayaAdmin: number;
  terimaBersih: number;
  totalMargin: number;
  totalBayar: number;
  angsuranPerBulan: number;
  created_at: string;
  User?: IUserRelation | null;
  nip?: string | null;
  fullname?: string | null;
}

interface IAngsuranPinkar {
  id: string;
  counter: number;
  principal: number;
  margin: number;
  date_pay: string;
  date_paid: string | null;
  remaining: number;
  status: string;
}

interface ITagihanPinkar {
  id: string;
  nip: string;
  fullname: string;
  plafond: number;
  tenor: number;
  totalAngsuran: number;
  angsuranBelumBayar: number;
  angsuranSudahBayar: number;
  angsuranList: IAngsuranPinkar[];
  createdAt: string;
  User?: IUserRelation | null;
}

interface IUpcomingInstallment {
  id: string;
  pinjamanId: string;
  nip: string;
  fullname: string;
  counter: number;
  dueDate: string;
  amount: number;
  isOverdue: boolean;
}

const getDisplayName = (record: Pick<IPinjaman, "User" | "fullname">) =>
  record.User?.fullname || record.fullname || "-";

const getDisplayNip = (record: Pick<IPinjaman, "User" | "nip">) =>
  record.User?.nip || record.nip || "-";

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const dayDiff = (value: string) => {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [pinjaman, setPinjaman] = useState<IPinjaman[]>([]);
  const [tagihan, setTagihan] = useState<ITagihanPinkar[]>([]);
  const [users, setUsers] = useState<IUserSummary[]>([]);

  useAccess("/pinkar/dashboard");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pinjamanRes, tagihanRes, userRes] = await Promise.all([
          fetch("/api/pinjaman"),
          fetch("/api/pinkar/tagihan-data"),
          fetch("/api/user?limit=1000"),
        ]);

        const [pinjamanJson, tagihanJson, userJson] = await Promise.all([
          pinjamanRes.json(),
          tagihanRes.json(),
          userRes.json(),
        ]);

        setPinjaman(Array.isArray(pinjamanJson.data) ? pinjamanJson.data : []);
        setTagihan(Array.isArray(tagihanJson.data) ? tagihanJson.data : []);
        setUsers(Array.isArray(userJson.data) ? userJson.data : []);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const borrowerCount = useMemo(
    () => new Set(pinjaman.map((item) => item.User?.id || item.id)).size,
    [pinjaman],
  );

  const totalPlafond = useMemo(
    () => pinjaman.reduce((acc, curr) => acc + curr.plafond, 0),
    [pinjaman],
  );

  const totalTerimaBersih = useMemo(
    () => pinjaman.reduce((acc, curr) => acc + curr.terimaBersih, 0),
    [pinjaman],
  );

  const totalOutstanding = useMemo(
    () =>
      tagihan.reduce(
        (acc, curr) =>
          acc +
          curr.angsuranList
            .filter((item) => !item.date_paid)
            .reduce((subtotal, item) => subtotal + item.principal, 0),
        0,
      ),
    [tagihan],
  );

  const totalMonthlyBill = useMemo(
    () =>
      tagihan.reduce((acc, curr) => {
        const nextUnpaid = curr.angsuranList.find((item) => !item.date_paid);
        return acc + (nextUnpaid ? nextUnpaid.principal + nextUnpaid.margin : 0);
      }, 0),
    [tagihan],
  );

  const paidInstallments = useMemo(
    () =>
      tagihan.reduce((acc, curr) => acc + curr.angsuranSudahBayar, 0),
    [tagihan],
  );

  const unpaidInstallments = useMemo(
    () =>
      tagihan.reduce((acc, curr) => acc + curr.angsuranBelumBayar, 0),
    [tagihan],
  );

  const overdueInstallments = useMemo(
    () =>
      tagihan.reduce(
        (acc, curr) =>
          acc +
          curr.angsuranList.filter(
            (item) => !item.date_paid && dayDiff(item.date_pay) < 0,
          ).length,
        0,
      ),
    [tagihan],
  );

  const repaymentRate = useMemo(() => {
    const totalInstallments = paidInstallments + unpaidInstallments;
    return totalInstallments > 0
      ? (paidInstallments / totalInstallments) * 100
      : 0;
  }, [paidInstallments, unpaidInstallments]);

  const borrowerCoverage = useMemo(() => {
    return users.length > 0 ? (borrowerCount / users.length) * 100 : 0;
  }, [borrowerCount, users.length]);

  const newestLoans = useMemo(
    () => [...pinjaman].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6),
    [pinjaman],
  );

  const upcomingInstallments = useMemo<IUpcomingInstallment[]>(() => {
    return tagihan
      .flatMap((loan) =>
        loan.angsuranList
          .filter((item) => !item.date_paid)
          .map((item) => ({
            id: item.id,
            pinjamanId: loan.id,
            nip: loan.nip,
            fullname: loan.fullname,
            counter: item.counter,
            dueDate: item.date_pay,
            amount: item.principal + item.margin,
            isOverdue: dayDiff(item.date_pay) < 0,
          })),
      )
      .sort((a, b) => +new Date(a.dueDate) - +new Date(b.dueDate))
      .slice(0, 8);
  }, [tagihan]);

  const newestLoanColumns: TableProps<IPinjaman>["columns"] = [
    {
      title: "Karyawan",
      key: "fullname",
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-900">{getDisplayName(record)}</div>
          <div className="text-xs text-slate-500">{getDisplayNip(record)}</div>
        </div>
      ),
    },
    {
      title: "Plafond",
      dataIndex: "plafond",
      align: "right",
      render: (value: number) => `Rp ${IDRFormat(value)}`,
    },
    {
      title: "Tenor",
      dataIndex: "tenor",
      align: "center",
      render: (value: number) => `${value} bln`,
    },
    {
      title: "Angsuran",
      dataIndex: "angsuranPerBulan",
      align: "right",
      render: (value: number) => `Rp ${IDRFormat(value)}`,
    },
    {
      title: "Dibuat",
      dataIndex: "created_at",
      align: "center",
      render: (value: string) => formatDate(value),
    },
  ];

  const dueColumns: TableProps<IUpcomingInstallment>["columns"] = [
    {
      title: "Karyawan",
      key: "fullname",
      render: (_, record) => (
        <div>
          <div className="font-semibold text-slate-900">{record.fullname || "-"}</div>
          <div className="text-xs text-slate-500">{record.nip || "-"}</div>
        </div>
      ),
    },
    {
      title: "Angsuran",
      dataIndex: "counter",
      align: "center",
      render: (value: number) => `#${value}`,
    },
    {
      title: "Jatuh Tempo",
      dataIndex: "dueDate",
      align: "center",
      render: (value: string, record) => (
        <div>
          <div className="font-medium text-slate-800">{formatDate(value)}</div>
          <div className={`text-xs ${record.isOverdue ? "text-rose-600" : "text-slate-500"}`}>
            {record.isOverdue ? `${Math.abs(dayDiff(value))} hari terlambat` : `${dayDiff(value)} hari lagi`}
          </div>
        </div>
      ),
    },
    {
      title: "Nominal",
      dataIndex: "amount",
      align: "right",
      render: (value: number) => `Rp ${IDRFormat(value)}`,
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="space-y-6 p-1 md:p-2">
        <section className="app-page-hero overflow-hidden p-6 md:p-7">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="app-brand-badge !bg-white/10 !text-emerald-100 !border-white/15">
                <WalletOutlined /> Dashboard Pinjaman Karyawan
              </span>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
                  Ringkasan portofolio pinkar dalam satu layar.
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-200 md:text-base">
                  Pantau total penyaluran, outstanding, performa angsuran, dan aktivitas pinjaman terbaru tanpa perlu bolak-balik ke data pinjaman dan tagihan.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[28rem] xl:grid-cols-2">
              <HeroMetric label="Total pinjaman aktif" value={`${pinjaman.length}`} icon={<FileTextOutlined />} />
              <HeroMetric label="Total plafond" value={`Rp ${IDRFormat(totalPlafond)}`} icon={<DollarCircleOutlined />} />
              <HeroMetric label="Outstanding pokok" value={`Rp ${IDRFormat(totalOutstanding)}`} icon={<ClockCircleOutlined />} />
              <HeroMetric label="Tagihan berjalan" value={`Rp ${IDRFormat(totalMonthlyBill)}`} icon={<CalendarOutlined />} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Terima bersih tersalurkan"
            value={`Rp ${IDRFormat(totalTerimaBersih)}`}
            hint={`${pinjaman.length} kontrak aktif`}
          />
          <StatTile
            label="Angsuran sudah dibayar"
            value={`${paidInstallments}`}
            hint={`${repaymentRate.toFixed(1)}% dari total jadwal`}
          />
          <StatTile
            label="Angsuran overdue"
            value={`${overdueInstallments}`}
            hint={overdueInstallments > 0 ? "Perlu follow up" : "Belum ada tunggakan lewat jatuh tempo"}
            tone={overdueInstallments > 0 ? "rose" : "emerald"}
          />
          <StatTile
            label="Cakupan karyawan"
            value={`${borrowerCount}/${users.length || 0}`}
            hint={`${borrowerCoverage.toFixed(1)}% karyawan sudah mengambil pinjaman`}
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="app-card p-4 md:p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="app-section-title text-xl">Pinjaman terbaru</h2>
                <p className="app-subtle-text text-sm">Enam kontrak pinkar terakhir yang masuk ke sistem.</p>
              </div>
              <Link href="/pinkar/data-pinjaman">
                <Button size="middle" className="app-master-action" type="primary">
                  Lihat data pinjaman <ArrowRightOutlined />
                </Button>
              </Link>
            </div>
            <Table
              className="app-table-modern"
              columns={newestLoanColumns}
              dataSource={newestLoans}
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: "max-content" }}
            />
          </div>

          <div className="space-y-4">
            <div className="app-card-muted p-4 md:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Kesehatan angsuran</div>
                  <div className="mt-2 text-2xl font-bold text-slate-900">{repaymentRate.toFixed(1)}%</div>
                  <p className="mt-1 text-sm text-slate-600">Rasio jadwal yang sudah dibayar dari seluruh angsuran pinkar aktif.</p>
                </div>
                <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                  <CheckCircleOutlined className="text-xl" />
                </span>
              </div>
              <Progress
                percent={Number(repaymentRate.toFixed(1))}
                strokeColor="#178a6d"
                trailColor="#dbeafe"
                className="mt-4"
              />
            </div>

            <div className="app-card-muted p-4 md:p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="app-section-title text-lg">Akses cepat</h2>
                  <p className="app-subtle-text mt-1 text-sm">Lompat ke proses pinkar yang paling sering dipakai.</p>
                </div>
                <span className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                  <DashboardOutlined className="text-xl" />
                </span>
              </div>
              <div className="grid gap-3">
                <QuickLinkCard href="/pinkar/simulasi" title="Simulasi Pinkar" desc="Hitung plafon, margin, dan jadwal angsuran baru." />
                <QuickLinkCard href="/pinkar/data-pinjaman" title="Data Pinjaman" desc="Kelola kontrak, dokumen akad, dan histori pinjaman." />
                <QuickLinkCard href="/pinkar/data-tagihan" title="Data Tagihan" desc="Pantau angsuran jatuh tempo dan progres pembayaran." />
              </div>
            </div>
          </div>
        </section>

        <section className="app-card p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="app-section-title text-xl">Jatuh tempo terdekat</h2>
              <p className="app-subtle-text text-sm">Prioritas follow up angsuran yang paling dekat atau sudah melewati jatuh tempo.</p>
            </div>
            <Link href="/pinkar/data-tagihan">
              <Button size="middle" className="app-master-action" type="primary">
                Buka tagihan <ArrowRightOutlined />
              </Button>
            </Link>
          </div>
          <Table
            className="app-table-modern"
            columns={dueColumns}
            dataSource={upcomingInstallments}
            rowKey="id"
            size="middle"
            pagination={false}
            locale={{ emptyText: "Belum ada angsuran yang menunggu pembayaran." }}
            scroll={{ x: "max-content" }}
          />
        </section>
      </div>
    </Spin>
  );
}

function HeroMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
          {label}
        </div>
        <span className="rounded-2xl bg-white/10 p-2.5 text-emerald-100">{icon}</span>
      </div>
      <div className="mt-3 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "slate" | "emerald" | "rose";
}) {
  const toneClasses = {
    slate: "bg-slate-50 text-slate-900",
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="app-stat-tile">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className={`mt-3 inline-flex rounded-2xl px-3 py-2 text-2xl font-bold ${toneClasses[tone]}`}>
        {value}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{hint}</p>
    </div>
  );
}

function QuickLinkCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-50">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-semibold text-slate-900">{title}</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
          </div>
          <span className="mt-1 text-slate-400">
            <ArrowRightOutlined />
          </span>
        </div>
      </div>
    </Link>
  );
}
