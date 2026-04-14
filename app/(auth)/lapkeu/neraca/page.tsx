"use client";

import { printNeraca } from "@/components/pdfutils/lapkeu/printNeraca";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { ICategoryOfAccount, IJournalDetail } from "@/libs/IInterfaces";
import { PrinterOutlined, SnippetsOutlined } from "@ant-design/icons";
import { Button, DatePicker, Spin } from "antd";
import { useEffect, useState } from "react";
const { RangePicker } = DatePicker;

interface INeraca {
  asset: ICategoryOfAccount[];
  kewajiban: ICategoryOfAccount[];
  modal: ICategoryOfAccount[];
  pendapatan: IJournalDetail[];
  beban: IJournalDetail[];
  shu: number;
}

export default function Page() {
  const [backdate, setBackdate] = useState<string | null>("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<INeraca>({
    asset: [],
    kewajiban: [],
    modal: [],
    pendapatan: [],
    beban: [],
    shu: 0,
  });

  const getData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (backdate) params.append("backdate", backdate);

    const res = await fetch(`/api/neraca?${params.toString()}`);
    const json = await res.json();
    console.log(json);
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
              <SnippetsOutlined /> Neraca
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
              onClick={() => printNeraca(data, backdate || undefined)}
            >
              Cetak
            </Button>
          </div>
        </div>
        <div className="app-report-grid">
          <div className="app-report-panel flex flex-col justify-between">
            <p className="app-report-panel-title">ASSET</p>
            {data.asset.map((d) => (
              <div key={d.id} className="app-report-card my-1">
                <p className="font-bold text-slate-900">{d.name}</p>
                <div className="ml-4">
                  {d.Children.map((dc) => (
                    <div key={dc.id}>
                      <div className="app-report-row">
                        <p>{dc.name}</p>
                        <p className="text-right">
                          {IDRFormat(
                            dc.JournalDetail.reduce(
                              (acc, curr) => acc + (curr.debit - curr.credit),
                              0,
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="app-report-total">
                  <span>Total {d.name}</span>
                  <span className="text-right">
                    {IDRFormat(
                      d.Children.flatMap((dc) => dc.JournalDetail).reduce(
                        (acc, curr) => acc + curr.debit - curr.credit,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            ))}
            <div className="app-report-total text-lg pr-2">
              <p>JUMLAH ASSET</p>
              <p className="text-right">
                {IDRFormat(
                  data.asset
                    .flatMap((d) =>
                      d.Children.flatMap((dc) => dc.JournalDetail),
                    )
                    .reduce((acc, curr) => acc + (curr.debit - curr.credit), 0),
                )}
              </p>
            </div>
          </div>
          <div className="app-report-panel flex flex-col justify-between">
            <p className="app-report-panel-title">KEWAJIBAN DAN MODAL</p>
            {data.kewajiban.map((d) => (
              <div key={d.id} className="app-report-card my-1">
                <p className="font-bold text-slate-900">{d.name}</p>
                <div className="ml-4 ">
                  {d.Children.map((dc) => (
                    <div key={dc.id}>
                      <div className="app-report-row">
                        <p>{dc.name}</p>
                        <p className="text-right">
                          {IDRFormat(
                            dc.JournalDetail.reduce(
                              (acc, curr) => acc + (curr.credit - curr.debit),
                              0,
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="app-report-total">
                  <span>Total {d.name}</span>
                  <span className="text-right">
                    {IDRFormat(
                      d.Children.flatMap((dc) => dc.JournalDetail).reduce(
                        (acc, curr) => acc + curr.credit - curr.debit,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            ))}
            {data.modal.map((d) => (
              <div key={d.id} className="app-report-card my-1">
                <p className="font-bold text-slate-900">{d.name}</p>
                <div className="ml-4">
                  {d.Children.map((dc) => (
                    <div key={dc.id}>
                      <div className="app-report-row">
                        <p>{dc.name}</p>
                        <p className="text-right">
                          {IDRFormat(
                            dc.JournalDetail.reduce(
                              (acc, curr) => acc + (curr.credit - curr.debit),
                              0,
                            ),
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="app-report-row">
                    <p>SHU Tahun Berjalan</p>
                    <p className="text-right">{IDRFormat(data.shu)}</p>
                  </div>
                </div>
                <div className="app-report-total">
                  <span>Total {d.name}</span>
                  <span className="text-right">
                    {IDRFormat(
                      d.Children.flatMap((dc) => dc.JournalDetail).reduce(
                        (acc, curr) => acc + curr.credit - curr.debit,
                        0,
                      ) + data.shu,
                    )}
                  </span>
                </div>
              </div>
            ))}
            <div className="app-report-total text-lg">
              <p>JUMLAH KEWAJIBAN DAN MODAL</p>
              <p className="text-right">
                {IDRFormat(
                  [...data.kewajiban, ...data.modal]
                    .flatMap((d) =>
                      d.Children.flatMap((dc) => dc.JournalDetail),
                    )
                    .reduce(
                      (acc, curr) => acc + (curr.credit - curr.debit),
                      0,
                    ) + data.shu,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Spin>
  );
}
