"use client";

import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";
import { ICategoryOfAccount, IDapem, IPageProps } from "@/libs/IInterfaces";
import { FundProjectionScreenOutlined } from "@ant-design/icons";
import { DatePicker, Spin } from "antd";
import { useEffect, useState } from "react";
const { RangePicker } = DatePicker;

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [pageProps, setPageProps] = useState<IPageProps<IDapem>>({
    page: 1,
    limit: 10000,
    total: 0,
    data: [],
    search: "",
    backdate: "",
  });
  const [bebans, setBebans] = useState<ICategoryOfAccount[]>([]);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", pageProps.page.toString());
    params.append("limit", pageProps.limit.toString());
    params.append("nominatif", "APPROVED");

    if (pageProps.backdate) params.append("backdate", pageProps.backdate);

    const res = await fetch(`/api/dapem?${params.toString()}`);
    const json = await res.json();
    setPageProps((prev) => ({
      ...prev,
      data: json.data,
      total: json.total,
    }));
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
      (async () => {
        await fetch("/api/neraca?=" + pageProps.backdate, { method: "POST" })
          .then((res) => res.json())
          .then((res) => {
            setBebans(res.data.beban);
            console.log(res.data);
          });
      })();
    }, 200);
    return () => clearTimeout(timeout);
  }, [pageProps.page, pageProps.limit, pageProps.search, pageProps.backdate]);

  return (
    <Spin spinning={loading}>
      <div className="app-report-shell">
        <div className="app-report-toolbar">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <FundProjectionScreenOutlined /> Rugi/Laba
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {process.env.NEXT_PUBLIC_APP_FULLNAME}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <RangePicker
              className="app-master-picker"
              size="middle"
              onChange={(date, dateStr) =>
                setPageProps({ ...pageProps, backdate: dateStr })
              }
            />
          </div>
        </div>
        <div className="flex gap-8 sm:flex-row flex-col">
          <div className="flex-1 ">
            <p className="font-bold text-lg my-2">PENDAPATAN</p>
            <div className="flex gap-2 border-b border-dashed border-gray-300">
              <p className="w-52">Administrasi</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce(
                    (acc, curr) => acc + curr.plafond * (curr.c_adm / 100),
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300">
              <p className="w-52">Asuransi</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce(
                    (acc, curr) =>
                      acc + curr.plafond * (curr.c_insurance / 100),
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300">
              <p className="w-52">Tatalaksana</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce((acc, curr) => acc + curr.c_gov, 0),
                )}
              </p>
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300">
              <p className="w-52">Data Informasi</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce(
                    (acc, curr) => acc + curr.c_infomation,
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300">
              <p className="w-52">Materai</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce((acc, curr) => acc + curr.c_stamp, 0),
                )}
              </p>
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300">
              <p className="w-52">Mutasi</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce((acc, curr) => acc + curr.c_mutasi, 0),
                )}
              </p>
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300">
              <p className="w-52">Pelunasan</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce(
                    (acc, curr) => acc + curr.c_takeover,
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300">
              <p className="w-52">Blokir Angsuran</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce(
                    (acc, curr) =>
                      acc +
                      GetAngsuran(
                        curr.plafond,
                        curr.tenor,
                        curr.c_margin + curr.c_margin_sumdan,
                        curr.margin_type,
                        curr.rounded,
                      ).angsuran *
                        curr.c_blokir,
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300 font-bold my-2">
              <p className="w-52">TOTAL PENDAPATAN</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce((acc, curr) => {
                    const adm = curr.plafond * (curr.c_adm / 100);
                    const asuransi = curr.plafond * (curr.c_insurance / 100);
                    const angs = GetAngsuran(
                      curr.plafond,
                      curr.tenor,
                      curr.c_margin + curr.c_margin_sumdan,
                      curr.margin_type,
                      curr.rounded,
                    ).angsuran;
                    const blokir = curr.c_blokir * angs;
                    return (
                      acc +
                      (adm +
                        asuransi +
                        curr.c_gov +
                        curr.c_infomation +
                        curr.c_stamp +
                        curr.c_mutasi +
                        curr.c_takeover +
                        blokir)
                    );
                  }, 0),
                )}
              </p>
            </div>
          </div>
          <div className="flex-1 ">
            <p className="font-bold text-lg my-2">BEBAN</p>
            {bebans.map((b) => (
              <div
                className="flex gap-2 border-b border-dashed border-gray-300"
                key={b.id}
              >
                <p className="w-52">{b.name}</p>
                <p className="w-4">:</p>
                <p className="flex-1 text-right">
                  {IDRFormat(
                    b.JournalDetail.reduce(
                      (acc, curr) => acc + (curr.debit - curr.credit),
                      0,
                    ),
                  )}
                </p>
              </div>
            ))}
            <div className="flex gap-2 border-b border-dashed border-gray-300">
              <p className="w-52">BLOKIR ANGSURAN</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce(
                    (acc, curr) =>
                      acc +
                      GetAngsuran(
                        curr.plafond,
                        curr.tenor,
                        curr.c_margin_sumdan,
                        curr.margin_type,
                        curr.rounded,
                      ).angsuran *
                        curr.c_blokir,
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300">
              <p className="w-52">PELUNASAN</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  pageProps.data.reduce(
                    (acc, curr) => acc + curr.c_takeover,
                    0,
                  ),
                )}
              </p>
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300 font-bold my-2">
              <p className="w-52">TOTAL BEBAN</p>
              <p className="w-4">:</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  bebans
                    .flatMap((d) => d.JournalDetail)
                    .reduce(
                      (acc, curr) => acc + (curr.debit - curr.credit),
                      0,
                    ) +
                    pageProps.data.reduce(
                      (acc, curr) => acc + curr.c_takeover,
                      0,
                    ) +
                    pageProps.data.reduce(
                      (acc, curr) =>
                        acc +
                        GetAngsuran(
                          curr.plafond,
                          curr.tenor,
                          curr.c_margin_sumdan,
                          curr.margin_type,
                          curr.rounded,
                        ).angsuran *
                          curr.c_blokir,
                      0,
                    ),
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="text-center font-bold text-lg my-2">
          TOTAL :{" "}
          {IDRFormat(
            (() => {
              const pend = pageProps.data.reduce((acc, curr) => {
                const adm = curr.plafond * (curr.c_adm / 100);
                const asuransi = curr.plafond * (curr.c_insurance / 100);
                const angs = GetAngsuran(
                  curr.plafond,
                  curr.tenor,
                  curr.c_margin + curr.c_margin_sumdan,
                  curr.margin_type,
                  curr.rounded,
                ).angsuran;
                const blokir = curr.c_blokir * angs;
                return (
                  acc +
                  (adm +
                    asuransi +
                    curr.c_gov +
                    curr.c_infomation +
                    curr.c_stamp +
                    curr.c_mutasi +
                    curr.c_takeover +
                    blokir)
                );
              }, 0);
              const beb =
                bebans
                  .flatMap((b) => b.JournalDetail)
                  .reduce((acc, curr) => acc + (curr.debit - curr.credit), 0) +
                pageProps.data.reduce((acc, curr) => acc + curr.c_takeover, 0) +
                pageProps.data.reduce(
                  (acc, curr) =>
                    acc +
                    GetAngsuran(
                      curr.plafond,
                      curr.tenor,
                      curr.c_margin_sumdan,
                      curr.margin_type,
                      curr.rounded,
                    ).angsuran *
                      curr.c_blokir,
                  0,
                );
              return pend - beb;
            })(),
          )}
        </div>
      </div>
    </Spin>
  );
}
