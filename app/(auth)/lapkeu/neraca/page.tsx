"use client";

import { printNeraca } from "@/components/pdfutils/lapkeu/printNeraca";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { ICategoryOfAccount, IJournalDetail } from "@/libs/IInterfaces";
import { PrinterOutlined } from "@ant-design/icons";
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
      <div className="p-2 border border-gray-300 rounded   bg-white">
        <div className="text-center my-2 p-2 font-bold text-lg border-b">
          <p>LAPORAN KEUANGAN</p>
          <p>{process.env.NEXT_PUBLIC_APP_FULLNAME}</p>
          <div className="flex gap-2 items-center justify-center">
            <p className="text-sm">Periode : </p>
            <RangePicker
              style={{ width: 170 }}
              size="small"
              onChange={(date, dateStr) =>
                setBackdate((dateStr || "").toString())
              }
            />
          </div>
          <Button
            size="small"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => printNeraca(data, backdate || undefined)}
          >
            Cetak
          </Button>
        </div>
        <div className="flex sm:flex-row flex-col gap-8 ">
          <div className="flex-1 flex flex-col justify-between ">
            <p className="font-bold text-lg">ASSET</p>
            {data.asset.map((d) => (
              <div
                key={d.id}
                className="border border-gray-300 border-dashed my-1 p-2"
              >
                <p className="font-bold">{d.name}</p>
                <div className="ml-4">
                  {d.Children.map((dc) => (
                    <div key={dc.id}>
                      <div className="flex justify-between">
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
                <div className="font-bold border-t border-dashed border-gray-300 flex justify-between gap-2">
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
            <div className="font-bold text-lg flex justify-between pr-2">
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
          <div className="flex-1 flex flex-col justify-between">
            <p className="font-bold text-lg">KEWAJIBAN DAN MODAL</p>
            {data.kewajiban.map((d) => (
              <div
                key={d.id}
                className="border border-gray-300 border-dashed my-1 p-2"
              >
                <p className="font-bold">{d.name}</p>
                <div className="ml-4 ">
                  {d.Children.map((dc) => (
                    <div key={dc.id}>
                      <div className="flex justify-between">
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
                <div className="font-bold border-t border-dashed border-gray-300 flex justify-between gap-2 ">
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
              <div
                key={d.id}
                className="border border-gray-300 border-dashed my-1 p-2"
              >
                <p className="font-bold">{d.name}</p>
                <div className="ml-4">
                  {d.Children.map((dc) => (
                    <div key={dc.id}>
                      <div className="flex justify-between">
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
                  <div className="flex justify-between">
                    <p>SHU Tahun Berjalan</p>
                    <p className="text-right">{IDRFormat(data.shu)}</p>
                  </div>
                </div>
                <div className="font-bold border-t border-dashed border-gray-300 flex justify-between gap-2">
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
            <div className="font-bold text-lg flex justify-between">
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
