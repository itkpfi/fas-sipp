"use client";

import { FormInput } from "@/components";
import {
  GetAngsuran,
  GetFullAge,
  GetMaxPlafond,
  GetMaxTenor,
  IDRFormat,
  IDRToNumber,
} from "@/components/utils/PembiayaanUtil";
import { ISumdan } from "@/libs/IInterfaces";
import { useAccess } from "@/libs/Permission";
import {
  HistoryOutlined,
  PrinterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  EMarginType,
  JenisPembiayaan,
  ProdukPembiayaan,
  Sumdan,
} from "@prisma/client";
import { Button, Card, Divider, Image, Input, Modal, Select } from "antd";
import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";

export default function Page() {
  const [data, setData] = useState<ISimulasi>(defaultData);
  const [jenis, setJenis] = useState<JenisPembiayaan[]>([]);
  const [sumdan, setSumdan] = useState<ISumdan[]>([]);
  const [sumdanAv, setSumdanAv] = useState<ISumdan[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { hasAccess } = useAccess("/simulasi");

  useEffect(() => {
    const { year, month } = GetFullAge(data.birthdate, data.created_at);
    const newAv = sumdan.map((s) => {
      const prod = s.ProdukPembiayaan.filter(
        (p) => year >= p.min_age && year < p.max_age,
      );
      return { ...s, ProdukPembiayaan: prod };
    });
    setSumdanAv(newAv);
    const maxTenn = GetMaxTenor(data.Produk.max_paid, year, month);
    const maxTen =
      parseInt(String(maxTenn)) > data.Produk.max_tenor
        ? data.Produk.max_tenor
        : parseInt(String(maxTenn));
    const maxPlaff = parseInt(
      String(
        GetMaxPlafond(
          data.margin,
          data.tenor,
          (data.salary * data.Sumdan.dsr) / 100,
        ),
      ),
    );
    const maxPlaf =
      maxPlaff > data.Produk.max_plafond ? data.Produk.max_plafond : maxPlaff;
    const angs = GetAngsuran(
      data.plafon,
      data.tenor,
      data.margin,
      data.marginType,
      data.Sumdan.rounded,
    ).angsuran;
    setData((prev) => ({
      ...prev,
      max_tenor: maxTen,
      max_plafond: maxPlaf,
      angsuran: angs,
      tenor: prev.tenor > maxTen ? maxTen : prev.tenor,
      plafon: prev.plafon > maxPlaf ? maxPlaf : prev.plafon,
    }));
  }, [
    data.created_at,
    data.plafon,
    data.tenor,
    data.birthdate,
    data.salary,
    data.margin,
    data.marginType,
    data.Produk,
  ]);

  const handleSearch = async () => {
    setLoading(true);
    await fetch("/api/debitur?nopen=" + data.nopen, { method: "PATCH" })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 200) {
          setData({
            ...data,
            fullname: res.data.fullname,
            salary: res.data.salary,
            birthdate: res.data.birthdate,
          });
        }
      });
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetch("/api/jenis?limit=1000")
        .then((res) => res.json())
        .then((res) => setJenis(res.data));
      await fetch("/api/sumdan?limit=1000")
        .then((res) => res.json())
        .then((res) => setSumdan(res.data));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex flex-col sm:flex-row">
      <Card
        loading={loading}
        style={{ flex: 1 }}
        styles={{
          title: { margin: 0, padding: 0 },
          body: { margin: 12, padding: 0 },
        }}
      >
        <FormInput
          data={{
            label: "Tanggal Simulasi",
            type: "date",
            mode: "vertical",
            class: "flex-1",
            disabled: !hasAccess("proses"),
            value: moment(data.created_at).format("YYYY-MM-DD"),
            onChange: (e: string) =>
              setData({ ...data, created_at: new Date(e) }),
          }}
        />
        <div className="flex gap-2 flex-wrap">
          <FormInput
            data={{
              label: "Nomor Pensiun",
              type: "text",
              mode: "vertical",
              class: "flex-1",
              value: data.nopen,
              onChange: (e: string) => setData({ ...data, nopen: e }),
              suffix: (
                <Button
                  size="small"
                  type="primary"
                  icon={<SearchOutlined />}
                  loading={loading}
                  onClick={() => handleSearch()}
                ></Button>
              ),
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
              label: "Tanggal Lahir",
              type: "date",
              mode: "vertical",
              class: "flex-1",
              value: moment(data.birthdate).format("YYYY-MM-DD"),
              onChange: (e: string) =>
                setData({ ...data, birthdate: new Date(e) }),
            }}
          />
          <div className="w-full">
            <p>Usia Pemohon</p>
            <div className="flex gap-2">
              <Input
                disabled
                style={{ color: "black" }}
                value={GetFullAge(data.birthdate, data.created_at).year}
                suffix={<span className="text-xs italic opacity-70">Thn</span>}
              />
              <Input
                disabled
                style={{ color: "black" }}
                value={GetFullAge(data.birthdate, data.created_at).month}
                suffix={<span className="text-xs italic opacity-70">Bln</span>}
              />
              <Input
                disabled
                style={{ color: "black" }}
                value={GetFullAge(data.birthdate, data.created_at).day}
                suffix={<span className="text-xs italic opacity-70">Hr</span>}
              />
            </div>
          </div>
          <FormInput
            data={{
              label: "Gaji Pensiun",
              type: "text",
              mode: "vertical",
              class: "flex-1",
              value: IDRFormat(data.salary || 0),
              onChange: (e: string) =>
                setData({ ...data, salary: IDRToNumber(e || "0") }),
            }}
          />
          <FormInput
            data={{
              label: "Jenis Pembiayaan",
              type: "select",
              mode: "vertical",
              class: "flex-1",
              options: jenis.map((j) => ({ label: j.name, value: j.id })),
              value: data.Jenis.id,
              onChange: (e: string) => {
                const find = jenis.find((f) => f.id === e);
                if (find) {
                  setData({
                    ...data,
                    Jenis: find,
                    c_mutasi: find.c_mutasi,
                    c_blokir: find.c_blokir,
                  });
                }
              },
            }}
          />
          <div className="w-full">
            <p>Produk Pembiayaan</p>
            <Select
              className="w-full"
              options={sumdanAv.map((j) => ({
                label: j.name,
                options: j.ProdukPembiayaan.map((p) => ({
                  label: `${p.name}`,
                  value: p.id,
                })),
              }))}
              value={data.Produk.id}
              onChange={(e: string) => {
                const find = sumdan
                  .flatMap((s) => s.ProdukPembiayaan)
                  .find((f) => f.id === e);
                if (find) {
                  const findSumdan = sumdan.find((s) => s.id === find.sumdanId);
                  if (findSumdan) {
                    setData({
                      ...data,
                      Produk: find,
                      Sumdan: findSumdan as Sumdan,
                      margin: findSumdan.c_margin + find.c_margin,
                      marginType: find.margin_type,
                      c_adm: findSumdan.c_adm + find.c_adm,
                      c_insurance: find.c_insurance,
                      c_gov: findSumdan.c_gov,
                      c_account: findSumdan.c_account,
                      c_stamp: findSumdan.c_stamps,
                      c_information: findSumdan.c_information,
                      c_provisi: findSumdan.c_provisi,
                    });
                  }
                }
              }}
            />
          </div>
          <FormInput
            data={{
              label: "Margin",
              type: "number",
              mode: "vertical",
              class: "flex-1",
              value: data.margin,
              disabled: !hasAccess("proses"),
              onChange: (e: string) => setData({ ...data, margin: Number(e) }),
            }}
          />
          <div className="w-full bg-gray-800 text-gray-50 p-2 rounded">
            Rekomendasi Pembiayaan
          </div>
          <div className="flex gap-2 ">
            <FormInput
              data={{
                label: "Tenor",
                type: "number",
                mode: "vertical",
                class: "flex-1",
                value: data.tenor,
                onChange: (e: string) => setData({ ...data, tenor: Number(e) }),
              }}
            />
            <FormInput
              data={{
                label: "Max Tenor",
                type: "number",
                mode: "vertical",
                class: "flex-1",
                disabled: true,
                value: data.max_tenor,
              }}
            />
          </div>
          <div className="flex gap-2">
            <FormInput
              data={{
                label: "Plafond",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                value: IDRFormat(data.plafon || 0),
                onChange: (e: string) =>
                  setData({ ...data, plafon: IDRToNumber(e || "0") }),
              }}
            />
            <FormInput
              data={{
                label: "Max Plafond",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                disabled: true,
                value: IDRFormat(data.max_plafond || 0),
              }}
            />
          </div>
          <div className="flex  gap-2">
            <FormInput
              data={{
                label: "Angsuran",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                disabled: true,
                value: IDRFormat(data.angsuran || 0),
              }}
            />
            <FormInput
              data={{
                label: "Max Angsuran",
                type: "text",
                mode: "vertical",
                class: "flex-1",
                disabled: true,
                value: IDRFormat((data.salary * data.Sumdan.dsr) / 100 || 0),
                onChange: (e: string) =>
                  setData({ ...data, salary: IDRToNumber(e || "0") }),
              }}
            />
          </div>
        </div>
      </Card>
      <Card
        loading={loading}
        style={{ flex: 1 }}
        styles={{
          title: { margin: 0, padding: 0 },
          body: { margin: 12, padding: 0 },
        }}
      >
        <div className="w-full bg-red-500 text-gray-50 p-2 rounded mb-1">
          Rincian Biaya
        </div>
        <div className="flex gap-2 justify-between items-center my-1 border-b border-dashed">
          <div className="flex-1">Biaya Administrasi</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              style={{ width: 80 }}
              disabled={!hasAccess("proses")}
              suffix={<span className="text-xs italic opacity-70">%</span>}
              value={data.c_adm}
              onChange={(e) =>
                setData({ ...data, c_adm: Number(e.target.value || "0") })
              }
              type={"number"}
            />
            <Input
              size="small"
              disabled
              value={IDRFormat((data.plafon * data.c_adm) / 100)}
              style={{ textAlign: "right", color: "black" }}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 border-b border-dashed">
          <div className="flex-1">Biaya Asuransi</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              style={{ width: 80 }}
              disabled={!hasAccess("proses")}
              suffix={<span className="text-xs italic opacity-70">%</span>}
              value={data.c_insurance}
              onChange={(e) =>
                setData({
                  ...data,
                  c_insurance: Number(e.target.value || "0"),
                })
              }
              type={"number"}
            />
            <Input
              size="small"
              disabled
              value={IDRFormat((data.plafon * data.c_insurance) / 100)}
              style={{ textAlign: "right", color: "black" }}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 border-b border-dashed">
          <div className="flex-1">Biaya Tatalaksana</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              disabled={!hasAccess}
              value={IDRFormat(data.c_gov)}
              style={{ textAlign: "right", color: "black" }}
              onChange={(e) =>
                setData({ ...data, c_gov: IDRToNumber(e.target.value || "0") })
              }
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 border-b border-dashed">
          <div className="flex-1">Biaya Buka Rekening</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              disabled={!hasAccess}
              value={IDRFormat(data.c_account)}
              style={{ textAlign: "right", color: "black" }}
              onChange={(e) =>
                setData({
                  ...data,
                  c_account: IDRToNumber(e.target.value || "0"),
                })
              }
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 border-b border-dashed">
          <div className="flex-1">Biaya Provisi</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              disabled={!hasAccess}
              value={IDRFormat(data.c_provisi)}
              style={{ textAlign: "right", color: "black" }}
              onChange={(e) =>
                setData({
                  ...data,
                  c_provisi: IDRToNumber(e.target.value || "0"),
                })
              }
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 border-b border-dashed">
          <div className="flex-1">Biaya Data Informasi</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              disabled={!hasAccess}
              value={IDRFormat(data.c_information)}
              style={{ textAlign: "right", color: "black" }}
              onChange={(e) =>
                setData({
                  ...data,
                  c_information: IDRToNumber(e.target.value || "0"),
                })
              }
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 border-b border-dashed">
          <div className="flex-1">Biaya Materai</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              disabled={!hasAccess}
              value={IDRFormat(data.c_stamp)}
              style={{ textAlign: "right", color: "black" }}
              onChange={(e) =>
                setData({
                  ...data,
                  c_stamp: IDRToNumber(e.target.value || "0"),
                })
              }
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 border-b border-dashed">
          <div className="flex-1">Biaya Mutasi</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              disabled={!hasAccess}
              value={IDRFormat(data.c_mutasi)}
              style={{ textAlign: "right", color: "black" }}
              onChange={(e) =>
                setData({
                  ...data,
                  c_mutasi: IDRToNumber(e.target.value || "0"),
                })
              }
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 border-b border-dashed">
          <div className="flex-1">Blokir Angsuran</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              style={{ width: 80 }}
              suffix={<span className="text-xs italic opacity-70">%</span>}
              value={data.c_blokir}
              onChange={(e) =>
                setData({
                  ...data,
                  c_blokir: IDRToNumber(e.target.value || "0"),
                })
              }
              type={"number"}
            />
            <Input
              size="small"
              disabled
              value={IDRFormat(data.c_blokir * data.angsuran)}
              style={{ textAlign: "right", color: "black" }}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 font-bold text-red-500 border-t mt-2">
          <div className="flex-1">Total Biaya</div>
          <div className="text-right">{IDRFormat(GetBiaya(data))}</div>
        </div>
        <div className="w-full bg-blue-800 text-gray-50 p-2 rounded mb-1">
          Rincian Pembiayaan
        </div>
        <div className="flex gap-2 justify-between items-center my-1 font-bold text-blue-500 border-b border-dashed">
          <div className="flex-1">Terima Kotor</div>
          <div className="text-right">
            {IDRFormat(data.plafon - GetBiaya(data))}
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 border-b border-dashed">
          <div className="flex-1">BPP</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              value={IDRFormat(data.c_bpp || 0)}
              style={{ textAlign: "right", color: "black" }}
              onChange={(e) =>
                setData({
                  ...data,
                  c_bpp: IDRToNumber(e.target.value || "0"),
                })
              }
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 text-red-500 border-b border-dashed">
          <div className="flex-1">Nominal Takeover</div>
          <div className="flex gap-2 flex-2">
            <Input
              size="small"
              value={IDRFormat(data.c_takeover || 0)}
              style={{ textAlign: "right", color: "black" }}
              onChange={(e) =>
                setData({
                  ...data,
                  c_takeover: IDRToNumber(e.target.value || "0"),
                })
              }
            />
          </div>
        </div>
        <div className="flex gap-2 justify-between items-center my-1 font-bold text-green-500 border-t mt-2">
          <div className="flex-1">Terima Bersih</div>
          <div className="text-right">
            {IDRFormat(
              data.plafon - (GetBiaya(data) + data.c_bpp + data.c_takeover),
            )}
          </div>
        </div>
        <Divider style={{ marginBottom: 5 }}>Informasi Tambahan</Divider>
        <div className="italic">
          <div className="flex justify-between border-b border-dashed">
            <div>Sisa Gaji</div>
            <div>{IDRFormat(data.salary - data.angsuran)}</div>
          </div>
          <div className="flex justify-between border-b border-dashed">
            <div>Debt Service Ratio</div>
            <div>
              {((data.angsuran / data.salary) * 100).toFixed(2)} % /{" "}
              {data.Sumdan.dsr} %
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-between">
          <Button
            danger
            icon={<HistoryOutlined />}
            onClick={() => setData(defaultData)}
          >
            Reset
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => setOpen(true)}
          >
            Cetak
          </Button>
        </div>
      </Card>
      <ModalDetailPembiayaan data={data} setOpen={setOpen} open={open} />
    </div>
  );
}

const ModalDetailPembiayaan = ({
  data,
  open,
  setOpen,
}: {
  data: ISimulasi;
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
      link.download = `Analisa-${data?.fullname || "Pembiayaan"}.png`;
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
      width={1100}
      style={{ top: 10 }}
    >
      <div
        ref={printRef}
        style={{ padding: "5px", backgroundColor: "#fff" }}
        className="text-gray-700"
      >
        <div className="flex items-center ">
          <Image src={process.env.NEXT_PUBLIC_APP_LOGO} width={60} />
          <p className="font-bold text-lg mb-1">ANALISA PEMBIAYAAN</p>
        </div>
        <div className="flex flex-wrap my-2 gap-4">
          <div className="w-full sm:flex-1">
            <div className="p-2 bg-green-500 font-bold text-white text-center">
              <p>DATA PEMBIAYAAN</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Tanggal Simulasi</p>
              <p>{moment(data.created_at).format("DD-MM-YYYY")}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Nama Pemohon</p>
              <p>{data.fullname}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Nomor Pensiun</p>
              <p>{data.nopen}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Usia Masuk</p>
              <p>
                {(() => {
                  const { year, month, day } = GetFullAge(
                    data.birthdate,
                    moment(data.created_at).add(data.tenor, "month").toDate(),
                  );
                  return `${year} Thn ${month} Bln ${day} Hr (${moment(data.created_at).format("DD/MM/YYYY")})`;
                })()}
              </p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200">
              <p>Usia Lunas</p>
              <p>
                {(() => {
                  const { year, month, day } = GetFullAge(
                    data.birthdate,
                    moment(data.created_at).add(data.tenor, "month").toDate(),
                  );
                  return `${year} Thn ${month} Bln ${day} Hr (${moment(data.created_at).add(data.tenor, "month").format("DD/MM/YYYY")})`;
                })()}
              </p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 ">
              <p>Jenis Pembiayaan</p>
              <p>{data.Jenis.name}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 ">
              <p>Produk Pembiayaan</p>
              <p>
                {data.Produk.name} <span>({data.Sumdan.name})</span>
              </p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 text-green-500 font-bold">
              <p>Gaji Bersih</p>
              <p>{IDRFormat(data.salary)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 ">
              <p>Tenor</p>
              <p>{data.tenor} Bulan</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 ">
              <p>Plafond</p>
              <p>{IDRFormat(data.plafon)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 ">
              <p>Margin Bunga</p>
              <p>{data.margin.toFixed(2)}%</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 ">
              <p>Angsuran</p>
              <p>{IDRFormat(data.angsuran)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 ">
              <p>Sisa Gaji</p>
              <p>{IDRFormat(data.salary - data.angsuran)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 ">
              <p>DSR</p>
              <p>
                {((data.angsuran / data.salary) * 100).toFixed(2)}% /{" "}
                {data.Sumdan.dsr}%
              </p>
            </div>
          </div>
          <div className="w-full sm:flex-1">
            <div className="p-2 bg-green-500 font-bold text-white text-center">
              <p>RINCIAN PEMBIAYAAN</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Administrasi</p>
              <p>{IDRFormat(data.plafon * (data.c_adm / 100))}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Asuransi</p>
              <p>{IDRFormat(data.plafon * (data.c_insurance / 100))}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Tatalaksana</p>
              <p>{IDRFormat(data.c_gov)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Buka Rekening</p>
              <p>{IDRFormat(data.c_account)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Materai</p>
              <p>{IDRFormat(data.c_stamp)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Provisi</p>
              <p>{IDRFormat(0)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Data Informasi</p>
              <p>{IDRFormat(data.c_information)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Mutasi</p>
              <p>{IDRFormat(data.c_mutasi)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Blokir Angsuran ({data.c_blokir}x)</p>
              <p>{IDRFormat(data.c_blokir * data.angsuran)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed text-red">
              <p>Total Biaya</p>
              <p>{IDRFormat(GetBiaya(data))}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed font-bold text-blue-400">
              <p>Terima Kotor</p>
              <p>{IDRFormat(data.plafon - GetBiaya(data))}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>BPP</p>
              <p>{IDRFormat(data.c_bpp)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed">
              <p>Pelunasan</p>
              <p>{IDRFormat(data.c_takeover)}</p>
            </div>
            <div className="border-b py-1 flex gap-4 justify-between border-gray-200 border-dashed font-bold text-green-500">
              <p>Terima Bersih</p>
              <p>
                {IDRFormat(
                  data.plafon - (GetBiaya(data) + data.c_bpp + data.c_takeover),
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handleDownloadImage}
          size="small"
        >
          Cetak
        </Button>
      </div>
    </Modal>
  );
};

interface ISimulasi {
  nopen: string;
  fullname: string;
  birthdate: Date;
  salary: number;
  Produk: ProdukPembiayaan;
  Sumdan: Sumdan;
  Jenis: JenisPembiayaan;
  plafon: number;
  tenor: number;
  margin: number;
  c_adm: number;
  c_insurance: number;
  c_gov: number;
  c_account: number;
  c_stamp: number;
  c_mutasi: number;
  c_blokir: number;
  c_takeover: number;
  c_information: number;
  c_provisi: number;
  c_bpp: number;
  created_at: Date;
  angsuran: number;
  max_plafond: number;
  max_tenor: number;
  marginType: EMarginType;
}
const defaultData: ISimulasi = {
  nopen: "",
  fullname: "",
  birthdate: new Date(),
  salary: 0,
  Produk: {} as ProdukPembiayaan,
  Sumdan: {} as Sumdan,
  Jenis: {} as JenisPembiayaan,
  plafon: 0,
  tenor: 0,
  margin: 0,
  c_adm: 0,
  c_insurance: 0,
  c_gov: 0,
  c_account: 0,
  c_stamp: 0,
  c_mutasi: 0,
  c_blokir: 0,
  c_takeover: 0,
  c_information: 0,
  c_provisi: 0,
  c_bpp: 0,
  angsuran: 0,
  max_plafond: 0,
  max_tenor: 0,
  marginType: "ANUITAS",
  created_at: new Date(),
};

const GetBiaya = (data: ISimulasi) => {
  const adm = (data.plafon * data.c_adm) / 100;
  const asuransi = (data.plafon * data.c_insurance) / 100;
  const blok = data.angsuran * data.c_blokir;
  return (
    adm +
    asuransi +
    data.c_gov +
    data.c_account +
    data.c_stamp +
    data.c_mutasi +
    data.c_information +
    data.c_provisi +
    blok
  );
};
