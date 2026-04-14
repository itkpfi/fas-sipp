"use client";

import { ApartmentOutlined, DownOutlined, RightOutlined, TeamOutlined } from "@ant-design/icons";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { IPageProps } from "@/libs/IInterfaces";
import {
  Area,
  Cabang,
  Dapem,
  ProdukPembiayaan,
  Sumdan,
  User,
} from "@prisma/client";
import { DatePicker, Pagination, Select, Spin, Table, TableProps } from "antd";
import { useEffect, useState } from "react";
const { RangePicker } = DatePicker;

interface UserDapem extends User {
  AODapem: Dapem[];
}
interface ICabang extends Cabang {
  User: UserDapem[];
}

interface IArea extends Area {
  Cabang: ICabang[];
}

interface IProduk extends ProdukPembiayaan {
  Dapem: Dapem[];
}
interface ISumdan extends Sumdan {
  ProdukPembiayaan: IProduk[];
}

const getProdukDapem = (produk: IProduk[] = []) =>
  produk.flatMap((item) => item.Dapem ?? []).filter((item): item is Dapem => Boolean(item));

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [pageProps, setPageProps] = useState<IPageProps<IArea>>({
    page: 1,
    limit: 4,
    total: 0,
    data: [],
    search: "",
    backdate: "",
    areaId: undefined,
  });
  const [summaryAreas, setSummaryAreas] = useState<IArea[]>([]);
  const [sumdan, setSumdan] = useState<ISumdan[]>([]);
  const [areaOptions, setAreaOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null);
  const [expandedCabangIdByArea, setExpandedCabangIdByArea] = useState<Record<string, string | null>>({});

  const getData = async () => {
    setLoading(true);
    const areaParams = new URLSearchParams();
    areaParams.append("ao", "ao");
    areaParams.append("include", "true");
    areaParams.append("page", String(pageProps.page));
    areaParams.append("limit", String(pageProps.limit));
    if (pageProps.backdate) areaParams.append("backdate", pageProps.backdate);
    if (pageProps.areaId) areaParams.append("areaId", pageProps.areaId);

    const sumdanParams = new URLSearchParams();
    sumdanParams.append("include", "true");
    sumdanParams.append("limit", "1000");
    if (pageProps.backdate) sumdanParams.append("backdate", pageProps.backdate);
    if (pageProps.areaId) sumdanParams.append("areaId", pageProps.areaId);

    const summaryParams = new URLSearchParams();
    summaryParams.append("ao", "ao");
    summaryParams.append("include", "true");
    summaryParams.append("limit", "1000");
    if (pageProps.backdate) summaryParams.append("backdate", pageProps.backdate);
    if (pageProps.areaId) summaryParams.append("areaId", pageProps.areaId);

    const res = await fetch(`/api/area?${areaParams.toString()}`);
    const json = await res.json();
    setPageProps((prev) => ({
      ...prev,
      data: json.data,
      total: json.total,
    }));
    await fetch(`/api/area?${summaryParams.toString()}`)
      .then((res) => res.json())
      .then((res) => setSummaryAreas(res.data || []));
    await fetch(`/api/sumdan?${sumdanParams.toString()}`)
      .then((res) => res.json())
      .then((res) => setSumdan(res.data));
    setLoading(false);
  };

  const getAreaOptions = async () => {
    const params = new URLSearchParams();
    params.append("limit", "1000");
    const res = await fetch(`/api/area?${params.toString()}`);
    const json = await res.json();
    setAreaOptions(
      (json.data || []).map((area: IArea) => ({
        label: area.name,
        value: area.id,
      })),
    );
  };

  useEffect(() => {
    void getAreaOptions();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.limit, pageProps.backdate, pageProps.areaId]);

  useEffect(() => {
    setExpandedAreaId(null);
    setExpandedCabangIdByArea({});
  }, [pageProps.page, pageProps.limit, pageProps.backdate, pageProps.areaId]);

  const totalPlafond = summaryAreas
    .flatMap((area) => area.Cabang)
    .flatMap((cabang) => cabang.User)
    .flatMap((user) => user.AODapem)
    .reduce((acc, curr) => acc + curr.plafond, 0);

  const totalTarget = summaryAreas
    .flatMap((area) => area.Cabang)
    .flatMap((cabang) => cabang.User)
    .reduce((acc, curr) => acc + curr.target, 0);

  const totalNoa = summaryAreas
    .flatMap((area) => area.Cabang)
    .flatMap((cabang) => cabang.User)
    .flatMap((user) => user.AODapem).length;

  const totalAo = summaryAreas
    .flatMap((area) => area.Cabang)
    .flatMap((cabang) => cabang.User).length;

  const overallProgress = totalTarget > 0 ? (totalPlafond / totalTarget) * 100 : 0;

  const getCabangSummary = (cabang: ICabang) => {
    const noa = cabang.User.flatMap((user) => user.AODapem);
    const pencapaian = noa.reduce((acc, curr) => acc + curr.plafond, 0);
    const target = cabang.User.reduce((acc, curr) => acc + curr.target, 0);
    const progress = target > 0 ? (pencapaian / target) * 100 : 0;

    return { noa, pencapaian, target, progress };
  };

  const getAreaSummary = (area: IArea) => {
    const noa = area.Cabang.flatMap((cabang) => getCabangSummary(cabang).noa);
    const pencapaian = noa.reduce((acc, curr) => acc + curr.plafond, 0);
    const target = area.Cabang.flatMap((cabang) => cabang.User).reduce((acc, curr) => acc + curr.target, 0);
    const progress = target > 0 ? (pencapaian / target) * 100 : 0;

    return { noa, pencapaian, target, progress };
  };

  const toggleArea = (areaId: string) => {
    setExpandedAreaId((prev) => (prev === areaId ? null : areaId));
    setExpandedCabangIdByArea((prev) => ({
      ...prev,
      [areaId]: prev[areaId] ?? null,
    }));
  };

  const toggleCabang = (areaId: string, cabangId: string) => {
    setExpandedCabangIdByArea((prev) => ({
      ...prev,
      [areaId]: prev[areaId] === cabangId ? null : cabangId,
    }));
  };

  const columns: TableProps<ISumdan>["columns"] = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Nama Mitra",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render(value, record, index) {
        return (
          <div>
            <p>
              {record.name}{" "}
              <span className="text-xs italic text-blue-500">
                {record.code}
              </span>
            </p>
          </div>
        );
      },
    },
    {
      title: "Pencapaian",
      dataIndex: "limit",
      key: "limit",
      sorter: (a, b) =>
        getProdukDapem(a.ProdukPembiayaan).reduce((acc, curr) => acc + curr.plafond, 0) -
        getProdukDapem(b.ProdukPembiayaan).reduce((acc, curr) => acc + curr.plafond, 0),
      render(value, record, index) {
        const total = getProdukDapem(record.ProdukPembiayaan).reduce(
          (acc, curr) => acc + curr.plafond,
          0,
        );
        const all = sumdan
          .flatMap((s) => getProdukDapem(s.ProdukPembiayaan))
          .reduce((acc, curr) => acc + curr.plafond, 0);
        const percentage = all > 0 ? (total / all) * 100 : 0;
        return (
          <div>
            {IDRFormat(total)} (
            {getProdukDapem(record.ProdukPembiayaan).length} NOA)
            <span className="italic opacity-70">
              ({percentage.toFixed(2)}%)
            </span>
          </div>
        );
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      <div className="space-y-6 p-1 md:p-2">
        <section className="app-page-hero space-y-5 p-6 md:p-7">
          <div className="relative z-10">
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
              Dashboard Bisnis
            </h1>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <HeroMetric label="Total pencapaian" value={`Rp. ${IDRFormat(totalPlafond)}`} />
            <HeroMetric label="Total target" value={`Rp. ${IDRFormat(totalTarget)}`} />
            <HeroMetric label="Total NOA" value={`${totalNoa}`} />
            <HeroMetric label="Progress" value={`${overallProgress.toFixed(2)}%`} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="app-stat-tile">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Area aktif</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{pageProps.total}</div>
          </div>
          <div className="app-stat-tile">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">AO terpantau</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{totalAo}</div>
          </div>
          <div className="app-stat-tile">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Rata-rata area</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">
               Rp. {IDRFormat(pageProps.total ? totalPlafond / pageProps.total : 0)}
             </div>
           </div>
          <div className="app-stat-tile">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Mitra aktif</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">{sumdan.length}</div>
          </div>
        </section>

        <section className="app-toolbar-panel p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Filter data
              </p>
              <h2 className="text-xl font-semibold text-slate-900">Data pencapaian by area</h2>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/90 p-2 sm:flex-row">
              <Select
                allowClear
                size="large"
                placeholder="Pilih area spesifik"
                options={areaOptions}
                value={pageProps.areaId}
                onChange={(value) =>
                  setPageProps((prev) => ({
                    ...prev,
                    page: 1,
                    areaId: value,
                  }))
                }
                className="min-w-[220px]"
              />
              <RangePicker
                size="large"
                onChange={(date, dateStr) =>
                  setPageProps((prev) => ({
                    ...prev,
                    page: 1,
                    backdate: dateStr,
                  }))
                }
                style={{ width: 260 }}
              />
            </div>
          </div>
        </section>

        <section className="app-stat-strip gap-4">
          {pageProps.data.length === 0 ? (
            <div className="app-card p-5 text-sm text-slate-600">
              Belum ada data untuk filter area dan tanggal yang dipilih.
            </div>
          ) : null}
          {pageProps.data &&
            pageProps.data.map((area) => {
              const areaSummary = getAreaSummary(area);
              const isAreaExpanded = expandedAreaId === area.id;
              const expandedCabangId = expandedCabangIdByArea[area.id] ?? null;

              return (
                <article key={area.id} className="app-card p-4 md:p-5">
                  <button
                    type="button"
                    onClick={() => toggleArea(area.id)}
                    className="flex w-full flex-col gap-4 text-left lg:flex-row lg:items-start lg:justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {isAreaExpanded ? <DownOutlined /> : <RightOutlined />}
                        <span>{area.name}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-slate-900">
                          {IDRFormat(areaSummary.pencapaian)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Target {IDRFormat(areaSummary.target)} · {areaSummary.noa.length} NOA · {area.Cabang.length} cabang
                        </p>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-4 lg:min-w-[220px] xl:min-w-[240px]">
                      <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                        <span>Progress area</span>
                        <span className={areaSummary.progress >= 100 ? "text-emerald-600" : "text-amber-600"}>
                          {areaSummary.progress.toFixed(2)}%
                        </span>
                      </div>
                      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            areaSummary.progress >= 100 ? "bg-emerald-500" : "bg-sky-500"
                          }`}
                          style={{ width: `${Math.min(areaSummary.progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </button>

                  {isAreaExpanded ? (
                    <div className="mt-5 space-y-4 border-t border-slate-200 pt-5">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <ApartmentOutlined />
                        Pilih cabang untuk melihat AO
                      </div>

                      {area.Cabang.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-5 text-sm text-slate-600">
                          Belum ada cabang aktif di area ini.
                        </div>
                      ) : null}

                      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                        {area.Cabang.map((cabang) => {
                          const cabangSummary = getCabangSummary(cabang);
                          const isCabangExpanded = expandedCabangId === cabang.id;

                          return (
                            <div
                              key={cabang.id}
                              className="rounded-[24px] border border-slate-200 bg-slate-50/75 p-4 shadow-[0_12px_26px_rgba(15,23,42,0.04)]"
                            >
                              <button
                                type="button"
                                onClick={() => toggleCabang(area.id, cabang.id)}
                                className="flex w-full flex-col gap-3 border-b border-slate-200 pb-4 text-left sm:flex-row sm:items-start sm:justify-between"
                              >
                                <div>
                                  <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                                    {isCabangExpanded ? <DownOutlined className="text-sm" /> : <RightOutlined className="text-sm" />}
                                    <span>{cabang.name}</span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-600">
                                    {cabang.User.length} AO · {cabangSummary.noa.length} NOA
                                  </p>
                                </div>
                                <div className="text-sm text-slate-600 sm:text-right">
                                  <div className="font-semibold text-slate-900">{IDRFormat(cabangSummary.pencapaian)}</div>
                                  <div>Target {IDRFormat(cabangSummary.target)}</div>
                                  <div className={cabangSummary.progress >= 100 ? "text-emerald-600" : "text-amber-600"}>
                                    {cabangSummary.progress.toFixed(2)}%
                                  </div>
                                </div>
                              </button>

                              {isCabangExpanded ? (
                                <div className="mt-4 space-y-3">
                                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                    <TeamOutlined />
                                    Daftar AO cabang
                                  </div>

                                  {cabang.User.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-4 text-sm text-slate-600">
                                      Belum ada AO aktif di cabang ini.
                                    </div>
                                  ) : null}

                                  {cabang.User.map((user) => {
                                    const userPencapaian = user.AODapem.reduce((acc, curr) => acc + curr.plafond, 0);
                                    const userProgress = user.target > 0 ? (userPencapaian / user.target) * 100 : 0;

                                    return (
                                      <div
                                        key={user.id}
                                        className="rounded-2xl border border-white/80 bg-white/90 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                                      >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                          <div>
                                            <div className="font-medium text-slate-900">
                                              {user.fullname} <span className="text-slate-500">({user.position})</span>
                                            </div>
                                            <div className="mt-1 text-sm text-slate-600">
                                              {user.AODapem.length} NOA · Target {IDRFormat(user.target)}
                                            </div>
                                          </div>
                                          <div className="text-sm sm:text-right">
                                            <div className="font-semibold text-slate-900">{IDRFormat(userPencapaian)}</div>
                                            <div className={userProgress >= 100 ? "text-emerald-600" : "text-rose-600"}>
                                              {userProgress.toFixed(2)}%
                                            </div>
                                          </div>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                          <div
                                            className={`h-full rounded-full ${
                                              userProgress >= 100 ? "bg-emerald-500" : "bg-rose-400"
                                            }`}
                                            style={{ width: `${Math.min(userProgress, 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}

                                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-100/85 px-4 py-3 text-sm font-semibold text-slate-700">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                      <span>TOTAL CABANG</span>
                                      <span>
                                        {IDRFormat(cabangSummary.pencapaian)} · {cabangSummary.noa.length} NOA ·{" "}
                                        {cabangSummary.progress.toFixed(2)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-sm text-slate-600">
                                  Klik cabang ini untuk menampilkan AO yang ada di dalamnya.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/75 px-4 py-4 text-sm text-slate-600">
                      Klik area ini untuk menampilkan daftar cabang, lalu pilih cabang untuk melihat AO.
                    </div>
                  )}
                </article>
              );
            })}
        </section>

        {pageProps.total > pageProps.limit && (
          <section className="flex justify-center">
            <div className="app-card px-4 py-3">
              <Pagination
                current={pageProps.page}
                pageSize={pageProps.limit}
                total={pageProps.total}
                showSizeChanger
                pageSizeOptions={[4, 6, 8, 12]}
                onChange={(page, pageSize) =>
                  setPageProps((prev) => ({
                    ...prev,
                    page,
                    limit: pageSize,
                  }))
                }
              />
            </div>
          </section>
        )}

        <section className="app-card space-y-4 p-4 md:p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Distribusi mitra
              </p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">Pencapaian berdasarkan mitra</h2>
            </div>
          </div>
          <div className="app-table-modern">
            <Table
              columns={columns}
              dataSource={sumdan}
              size="small"
              loading={loading}
              rowKey={"id"}
              scroll={{ x: "max-content" }}
              pagination={false}
            />
          </div>
        </section>
      </div>
    </Spin>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur xl:min-h-[112px]">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-100/82">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}
