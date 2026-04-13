"use client";

import { printRL } from "@/components/pdfutils/lapkeu/rugilaba";
import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";
import { ICategoryOfAccount, IDapem, IPageProps } from "@/libs/IInterfaces";
import { FundOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, DatePicker, Spin } from "antd";
import { useEffect, useState } from "react";
const { RangePicker } = DatePicker;

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    pendapatan: ICategoryOfAccount[];
    beban: ICategoryOfAccount[];
  }>({ pendapatan: [], beban: [] });
  const [backdate, setBackdate] = useState<string | null>(null);

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();

    if (backdate) params.append("backdate", backdate);

    const res = await fetch(`/api/neraca?${params.toString()}`, {
      method: "POST",
    });
    const json = await res.json();
    setData(json.data);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await getData();
    }, 200);
    return () => clearTimeout(timeout);
  }, [backdate]);

  return (
    <Spin spinning={loading}>
      <div className="app-report-shell">
        <div className="app-report-toolbar">
          <div>
            <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
              <FundOutlined /> Neraca Rugi/Laba
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
                setBackdate((dateStr || "").toString())
              }
            />
            <Button
              size="middle"
              type="primary"
              className="app-master-action"
              icon={<PrinterOutlined />}
              onClick={() =>
                printRL(data.pendapatan, data.beban, backdate || undefined)
              }
            >
              Cetak
            </Button>
          </div>
        </div>
        <div className="flex gap-8 sm:flex-row flex-co border-t">
          <div className="flex-1 flex flex-col justify-between">
            <p className="font-bold text-lg my-2">PENDAPATAN</p>
            <div>
              {data.pendapatan.map((d) => (
                <div
                  className="flex gap-2 border-b border-dashed border-gray-300"
                  key={d.id}
                >
                  <p className="flex-1">{d.name}</p>
                  <p className="flex-1 text-right">
                    {IDRFormat(
                      d.JournalDetail.reduce(
                        (acc, curr) => acc + (curr.credit - curr.debit),
                        0,
                      ),
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-b border-dashed border-gray-300 font-bold my-2">
              <p className="flex-1">TOTAL PENDAPATAN</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  data.pendapatan
                    .flatMap((d) => d.JournalDetail)
                    .reduce((acc, curr) => acc + (curr.credit - curr.debit), 0),
                )}
              </p>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <p className="font-bold text-lg my-2">BEBAN</p>
            <div>
              {data.beban.map((d) => (
                <div
                  className="flex gap-2 border-b border-dashed border-gray-300"
                  key={d.id}
                >
                  <p className="flex-1">{d.name}</p>
                  <p className="flex-1 text-right">
                    {IDRFormat(
                      d.JournalDetail.reduce(
                        (acc, curr) => acc + (curr.debit - curr.credit),
                        0,
                      ),
                    )}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-b border-dashed border-gray-300 font-bold my-2">
              <p className="flex-1">TOTAL BEBAN</p>
              <p className="flex-1 text-right">
                {IDRFormat(
                  data.beban
                    .flatMap((d) => d.JournalDetail)
                    .reduce((acc, curr) => acc + (curr.debit - curr.credit), 0),
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="text-center font-bold text-lg my-2">
          TOTAL :{" "}
          {IDRFormat(
            (() => {
              const pend = data.pendapatan
                .flatMap((d) => d.JournalDetail)
                .reduce((acc, curr) => acc + (curr.credit - curr.debit), 0);
              const beb = data.beban
                .flatMap((d) => d.JournalDetail)
                .reduce((acc, curr) => acc + (curr.debit - curr.credit), 0);
              return pend - beb;
            })(),
          )}
        </div>
      </div>
    </Spin>
  );
}
