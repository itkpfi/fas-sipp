"use client";

import { useUser } from "@/components/UserContext";
import {
  BarChart,
  PencapaianChart,
  StatusDapemChart,
} from "@/components/utils/ChartUtils";
import {
  GetAngsuran,
  GetBiaya,
  GetSisaPokokMargin,
  IDRFormat,
} from "@/components/utils/PembiayaanUtil";
import { ICashDesc, IDapem } from "@/libs/IInterfaces";
import {
  BankOutlined,
  DollarOutlined,
  FolderOpenOutlined,
  KeyOutlined,
  MoneyCollectOutlined,
  PayCircleOutlined,
  SwapOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Angsuran,
  Dapem,
  Debitur,
  Dropping,
  JenisPembiayaan,
  Sumdan,
} from "@prisma/client";
import { Col, Row, Spin } from "antd";
import React, { useEffect, useState } from "react";

interface IDapemDashboard extends Dapem {
  Dropping: Dropping;
  Debitur: Debitur;
  Angsuran: Angsuran[];
}
interface IJenisDapem extends JenisPembiayaan {
  Dapem: Dapem[];
}
interface iSumdanDapem extends Sumdan {
  Dapem: Dapem[];
}

interface IDashboard {
  alldata: Dapem[];
  droppingall: IDapemDashboard[];
  droppingmonthly: IDapemDashboard[];
  prevmonth: { month: string; data: IDapemDashboard[] }[];
  byjepem: IJenisDapem[];
  bysumdan: iSumdanDapem[];
}

export default function Page() {
  const [data, setData] = useState<IDashboard>({
    alldata: [],
    droppingall: [],
    droppingmonthly: [],
    prevmonth: [],
    byjepem: [],
    bysumdan: [],
  });
  const user = useUser();

  useEffect(() => {
    (async () => {
      await fetch("/api")
        .then((res) => res.json())
        .then((res) => setData(res));
    })();
  }, []);

  const totalDropping = data.droppingall.reduce((acc, curr) => acc + curr.plafond, 0);
  const monthlyDropping = data.droppingmonthly.reduce((acc, curr) => acc + curr.plafond, 0);
  const approvedAccounts = data.droppingall.filter((d) => d.dropping_status === "APPROVED").length;
  const outstanding = data.droppingall
    .filter((f) => f.dropping_status === "APPROVED")
    .reduce((acc, curr) => acc + GetSisaPokokMargin(curr as IDapem).principal, 0);
  const collectionCount = data.droppingall
    .filter((d) => d.dropping_status === "APPROVED")
    .reduce((acc, curr) => acc + GetSisaPokokMargin(curr as IDapem).prevcount, 0);
  const collectionValue = data.droppingall
    .filter((d) => d.dropping_status === "APPROVED")
    .reduce((acc, curr) => acc + GetSisaPokokMargin(curr as IDapem).prevvalueall, 0);
  const runningInstallment = data.droppingall
    .filter((d) => d.dropping_status === "APPROVED")
    .reduce((acc, curr) => acc + GetSisaPokokMargin(curr as IDapem).install, 0);

  const pendingCash = (() => {
    const dataTb = data.droppingall.filter(
      (d) => d.cash_status !== "APPROVED" && d.dropping_status === "APPROVED",
    );
    return dataTb.reduce((acc, curr) => {
      const angs = GetAngsuran(
        curr.plafond,
        curr.tenor,
        curr.c_margin + curr.c_margin_sumdan,
        curr.margin_type,
        curr.rounded,
      ).angsuran;
      const biaya = GetBiaya(curr as IDapem) + curr.c_takeover + curr.c_blokir * angs;
      const tbDiberikan = curr.cash_desc ? (JSON.parse(curr.cash_desc) as ICashDesc[]) : [];
      const tb = curr.plafond - biaya;

      return acc + (tb - tbDiberikan.reduce((accu, curru) => accu + curru.amount, 0));
    }, 0);
  })();

  return (
    <Spin spinning={false}>
      <div className="space-y-6 p-1 md:p-2">
        <section className="app-page-hero space-y-5 p-6 md:p-7">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
              Dashboard Pembiayaan
            </h1>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeroMetric label="Total pencairan" value={`Rp. ${IDRFormat(totalDropping)}`} />
            <HeroMetric label="Bulan berjalan" value={`Rp. ${IDRFormat(monthlyDropping)}`} />
            <HeroMetric label="Outstanding" value={`Rp. ${IDRFormat(outstanding)}`} />
            <HeroMetric label="NOA aktif" value={`${approvedAccounts}`} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="app-stat-tile">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Tunggakan</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{collectionCount}x</div>
          </div>
          <div className="app-stat-tile">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Nilai tunggakan</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">Rp. {IDRFormat(collectionValue)}</div>
          </div>
          <div className="app-stat-tile">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Tagihan berjalan</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">Rp. {IDRFormat(runningInstallment)}</div>
          </div>
          <div className="app-stat-tile">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Pending terima bersih</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">Rp. {IDRFormat(pendingCash)}</div>
          </div>
        </section>

        <section className="app-card p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="app-section-title text-xl">Ringkasan operasional</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StaticticItem
            name="Data Pencairan"
            all={`Rp. ${IDRFormat(totalDropping)}`}
            month={`+ Rp. ${IDRFormat(monthlyDropping)}`}
            tone="emerald"
          />
          <StaticticItem
            name="Number Of Account"
            all={`${data.droppingall.length} NOA`}
            month={`+ ${data.droppingmonthly.length} NOA`}
            icon={<TeamOutlined />}
            tone="slate"
          />
          <StaticticItemCustom
            name="Data Instansi"
            icon={<BankOutlined />}
            all={
              <div className="flex flex-col gap-2 text-sm text-slate-700">
                <div className="flex justify-between gap-3">
                  <span>Taspen</span>
                  <span className="font-semibold">
                    {data.droppingall.filter((f) => f.Debitur.group_skep === "TASPEN").length} NOA
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Asabri</span>
                  <span className="font-semibold">
                    {data.droppingall.filter((f) => f.Debitur.group_skep === "ASABRI").length} NOA
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Lainnya</span>
                  <span className="font-semibold">
                    {
                      data.droppingall.filter(
                        (f) => f.Debitur.group_skep && !["TASPEN", "ASABRI"].includes(f.Debitur.group_skep),
                      ).length
                    }{" "}
                    NOA
                  </span>
                </div>
              </div>
            }
            tone="indigo"
          />
          <StaticticItem
            name="Outstanding"
            all={`Rp. ${IDRFormat(outstanding)}`}
            month={`NOA Aktif : ${approvedAccounts}`}
            icon={<MoneyCollectOutlined />}
            tone="sky"
          />
          <StaticticItem
            name="Lunas & Tunggakan"
            all={`${data.droppingall.filter((d) => d.dropping_status === "PAID_OFF").length} NOA`}
            month={`(${collectionCount}x) Rp. ${IDRFormat(collectionValue)}`}
            classi="text-sm"
            icon={<PayCircleOutlined />}
            tone="amber"
          />
          <StaticticItem
            name="Tagihan Bulan Berjalan"
            all={`${approvedAccounts} NOA | Rp. ${IDRFormat(runningInstallment)}`}
            classi="text-sm"
            icon={<MoneyCollectOutlined />}
            tone="teal"
          />
          <StaticticItem
            name="Pending Takeover"
            all={`Rp. ${IDRFormat(
              data.droppingall
                .filter((f) => f.takeover_status !== "APPROVED" && f.dropping_status === "APPROVED")
                .reduce((acc, curr) => acc + curr.c_takeover, 0),
            )}`}
            month={`${data.droppingall.filter((d) => d.takeover_status !== "APPROVED" && d.dropping_status === "APPROVED").length} NOA`}
            classi="text-sm"
            icon={<PayCircleOutlined />}
            tone="violet"
          />
          <StaticticItem
            name="Pending Mutasi & Flagging"
            all={`Mutasi ${data.droppingall.filter((d) => d.mutasi_status !== "APPROVED").length} NOA`}
            month={`Flagging ${data.droppingall.filter((d) => d.flagging_status !== "APPROVED").length} NOA`}
            classi="text-sm"
            icon={<SwapOutlined />}
            tone="rose"
          />
          <StaticticItem
            name="Pending Terima Bersih"
            all={`Rp. ${IDRFormat(pendingCash)}`}
            month={`${data.droppingall.filter((d) => d.cash_status !== "APPROVED" && d.dropping_status === "APPROVED").length} NOA`}
            classi="text-sm"
            icon={<KeyOutlined />}
            tone="cyan"
          />
          <StaticticItem
            name="Pending Berkas & Jaminann"
            all={`Jaminan ${data.droppingall.filter((d) => d.guarantee_status !== "MITRA" && d.dropping_status === "APPROVED").length} NOA`}
            month={`Berkas ${data.droppingall.filter((d) => d.document_status !== "MITRA" && d.dropping_status === "APPROVED").length} NOA`}
            classi="text-sm"
            icon={<FolderOpenOutlined />}
            tone="slate"
          />
          </div>
        </section>

        <section className="app-card p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="app-section-title text-xl">Analisa grafik</h2>
            </div>
          </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <ChartCard title="Grafik Pembiayaan Perbulan">
              <PencapaianChart data={data.prevmonth} />
            </ChartCard>
          </Col>
          <Col xs={24} sm={12}>
            <ChartCard title="Status Pembiayaan">
              <StatusDapemChart
                data={[
                  {
                    name: "APPROVED",
                    value: data.alldata
                      .filter((d) => d.dropping_status === "APPROVED")
                      .reduce((acc, curr) => acc + curr.plafond, 0),
                  },
                  {
                    name: "PAID OFF",
                    value: data.alldata
                      .filter((d) => d.dropping_status === "PAID_OFF")
                      .reduce((acc, curr) => acc + curr.plafond, 0),
                  },
                  {
                    name: "PENDING",
                    value: data.alldata
                      .filter((d) => d.dropping_status === "PENDING")
                      .reduce((acc, curr) => acc + curr.plafond, 0),
                  },
                  {
                    name: "PROCCESS",
                    value: data.alldata
                      .filter((d) => d.dropping_status === "PROCCESS")
                      .reduce((acc, curr) => acc + curr.plafond, 0),
                  },
                  {
                    name: "REJECTED",
                    value: data.alldata
                      .filter((d) => d.dropping_status === "REJECTED")
                      .reduce((acc, curr) => acc + curr.plafond, 0),
                  },
                  {
                    name: "CANCELED",
                    value: data.alldata
                      .filter((d) => d.dropping_status === "CANCEL")
                      .reduce((acc, curr) => acc + curr.plafond, 0),
                  },
                ]}
              />
            </ChartCard>
          </Col>
          {user && !user.sumdanId && (
            <Col xs={24} sm={12}>
              <ChartCard title="Grafik Pembiayaan By Mitra">
                <BarChart
                  data={data.bysumdan.map((j) => ({
                    name: j.code,
                    value: j.Dapem.reduce((acc, curr) => acc + curr.plafond, 0),
                  }))}
                />
              </ChartCard>
            </Col>
          )}
          <Col xs={24} sm={12}>
            <ChartCard title="Grafik By Jenis Pembiayaan">
              <StatusDapemChart
                data={data.byjepem.map((j) => ({
                  name: j.name,
                  value: j.Dapem.reduce((acc, curr) => acc + curr.plafond, 0),
                }))}
              />
            </ChartCard>
          </Col>
        </Row>
        </section>
      </div>
    </Spin>
  );
}

const HeroMetric = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-[24px] border border-white/16 bg-white/12 p-4 backdrop-blur xl:min-h-[112px]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-100/82">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
};

const ChartCard = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
      <p className="app-section-title text-lg">{title}</p>
      <div className="mt-4 flex h-64 items-center justify-center rounded-[20px] bg-white/90 p-3">
        {children}
      </div>
    </div>
  );
};

const StaticticItem = ({
  name,
  all,
  month,
  icon,
  classi,
  tone,
}: {
  name: string;
  all: string;
  month?: string;
  icon?: React.ReactNode;
  classi?: string;
  tone?: "emerald" | "slate" | "indigo" | "sky" | "amber" | "teal" | "violet" | "rose" | "cyan";
}) => {
  const toneMap = {
    emerald: {
      accent: "from-emerald-500/18 to-emerald-100",
      icon: "bg-white text-emerald-700",
      text: "text-emerald-700",
      sub: "text-emerald-600",
    },
    slate: {
      accent: "from-slate-500/14 to-slate-100",
      icon: "bg-white text-slate-700",
      text: "text-slate-800",
      sub: "text-slate-500",
    },
    indigo: {
      accent: "from-indigo-500/16 to-indigo-100",
      icon: "bg-white text-indigo-700",
      text: "text-slate-800",
      sub: "text-indigo-600",
    },
    sky: {
      accent: "from-sky-500/16 to-sky-100",
      icon: "bg-white text-sky-700",
      text: "text-slate-800",
      sub: "text-sky-600",
    },
    amber: {
      accent: "from-amber-500/16 to-amber-100",
      icon: "bg-white text-amber-700",
      text: "text-slate-800",
      sub: "text-amber-600",
    },
    teal: {
      accent: "from-teal-500/16 to-teal-100",
      icon: "bg-white text-teal-700",
      text: "text-slate-800",
      sub: "text-teal-600",
    },
    violet: {
      accent: "from-violet-500/16 to-violet-100",
      icon: "bg-white text-violet-700",
      text: "text-slate-800",
      sub: "text-violet-600",
    },
    rose: {
      accent: "from-rose-500/16 to-rose-100",
      icon: "bg-white text-rose-700",
      text: "text-slate-800",
      sub: "text-rose-600",
    },
    cyan: {
      accent: "from-cyan-500/16 to-cyan-100",
      icon: "bg-white text-cyan-700",
      text: "text-slate-800",
      sub: "text-cyan-600",
    },
  };
  const palette = toneMap[tone || "emerald"];

  return (
    <div className="app-stat-tile relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[44px] bg-gradient-to-b ${palette.accent}`} />
      <div className="relative space-y-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-[18px] shadow-[0_6px_18px_rgba(15,23,42,0.05)] ${palette.icon}`}>
              {icon ? icon : <DollarOutlined />}
          </div>
          <p className="text-sm font-bold leading-5 text-slate-700">{name}</p>
        </div>
        <p className={`${classi ? classi : "text-lg"} font-bold ${palette.text}`}>{all}</p>
        {month ? <p className={`text-sm font-semibold ${palette.sub}`}>{month}</p> : null}
      </div>
    </div>
  );
};

const StaticticItemCustom = ({
  name,
  all,
  month,
  tone,
  icon,
}: {
  name: string;
  all: string | React.ReactNode;
  month?: string | React.ReactNode;
  tone?: "indigo" | "emerald" | "slate";
  icon?: React.ReactNode;
}) => {
  const toneMap = {
    indigo: {
      accent: "from-indigo-500/16 to-indigo-100",
      icon: "bg-white text-indigo-700",
      text: "text-slate-800",
      sub: "text-indigo-600",
    },
    emerald: {
      accent: "from-emerald-500/16 to-emerald-100",
      icon: "bg-white text-emerald-700",
      text: "text-emerald-700",
      sub: "text-emerald-600",
    },
    slate: {
      accent: "from-slate-500/16 to-slate-100",
      icon: "bg-white text-slate-700",
      text: "text-slate-800",
      sub: "text-slate-500",
    },
  };
  const palette = toneMap[tone || "indigo"];

  return (
    <div className="app-stat-tile relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[44px] bg-gradient-to-b ${palette.accent}`} />
      <div className="relative space-y-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-[18px] shadow-[0_6px_18px_rgba(15,23,42,0.05)] ${palette.icon}`}
          >
            {icon ? icon : <DollarOutlined />}
          </div>
          <p className="text-sm font-bold leading-5 text-slate-700">{name}</p>
        </div>
        <div className={`text-base font-semibold ${palette.text}`}>{all}</div>
        {month ? <p className={`mt-3 text-sm font-semibold ${palette.sub}`}>{month}</p> : null}
      </div>
    </div>
  );
};
