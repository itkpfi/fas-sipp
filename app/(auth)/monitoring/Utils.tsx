"use client";

import { FormInput } from "@/components";
import { useUser } from "@/components/UserContext";
import {
  GetAngsuran,
  GetBiaya,
  GetFullAge,
  GetMaxPlafond,
  GetMaxTenor,
  IDRFormat,
  IDRToNumber,
} from "@/components/utils/PembiayaanUtil";
import {
  IDapem,
  IProdukPembiayaan,
  ISumdanDapem,
  IUserDapem,
} from "@/libs/IInterfaces";
import {
  DollarCircleOutlined,
  FolderOutlined,
  KeyOutlined,
  SearchOutlined,
  SignatureOutlined,
  SolutionOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Berkas,
  Debitur,
  Dropping,
  EMarginType,
  EMarriageStatus,
  Jaminan,
  JenisPembiayaan,
  Pelunasan,
} from "@prisma/client";
import { App, Button, Card, Checkbox, Divider, Input, Select } from "antd";
import moment from "moment";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function UpsertPermohonan({ record }: { record?: IDapem }) {
  const [data, setData] = useState<IDapem>(record || defaultData);
  const [loading, setLoading] = useState(false);
  const [jenis, setJenis] = useState<JenisPembiayaan[]>([]);
  const [sumdan, setSumdan] = useState<ISumdanDapem[]>([]);
  const [sumdanAv, setSumdanAv] = useState<ISumdanDapem[]>([]);
  const [users, setUser] = useState<IUserDapem[]>([]);
  const [temp, setItemp] = useState<ITemp>(defaultTemp);
  const { modal } = App.useApp();
  const user = useUser();

  const handleSearch = async () => {
    setLoading(true);
    await fetch("/api/debitur?nopen=" + data.nopen, { method: "PATCH" })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 200) {
          setData({
            ...data,
            Debitur: res.data,
            mutasi_from: res.data.pay_office,
          });
        }
      });
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    data.createdById = user.id;
    await fetch("/api/dapem", {
      method: record ? "PUT" : "POST",
      body: JSON.stringify(data),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.status === 200) {
          modal.success({
            title: "BERHASIL",
            content: "Data Pembiayaan berhasil ditambahkan",
          });
        } else {
          modal.error({ title: "ERROR!!", content: res.msg });
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
      await fetch("/api/sumdan?limit=1000", { method: "PATCH" })
        .then((res) => res.json())
        .then((res) => setSumdan(res.data));
      await fetch("/api/user?limit=5000")
        .then((res) => res.json())
        .then((res) => setUser(res.data));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const { year, month } = GetFullAge(data.Debitur.birthdate, data.created_at);
    const newAv = sumdan.map((s) => {
      const prod = s.ProdukPembiayaan.filter(
        (p) => year >= p.min_age && year < p.max_age,
      );
      return { ...s, ProdukPembiayaan: prod };
    });
    setSumdanAv(newAv);
    const maxTenn = GetMaxTenor(data.ProdukPembiayaan.max_paid, year, month);
    const maxTen =
      parseInt(String(maxTenn)) > data.ProdukPembiayaan.max_tenor
        ? data.ProdukPembiayaan.max_tenor
        : parseInt(String(maxTenn));
    const maxPlaff = parseInt(
      String(
        GetMaxPlafond(
          data.c_margin + data.c_margin_sumdan,
          data.tenor,
          (data.Debitur.salary * (data.ProdukPembiayaan.Sumdan?.dsr || 0)) /
            100,
        ),
      ),
    );
    const maxPlaf =
      maxPlaff > data.ProdukPembiayaan.max_plafond
        ? data.ProdukPembiayaan.max_plafond
        : maxPlaff;

    const angs = GetAngsuran(
      data.plafond,
      data.tenor,
      data.c_margin + data.c_margin_sumdan,
      data.margin_type,
      data.rounded,
    ).angsuran;
    setData((prev) => ({
      ...prev,
      tenor: prev.tenor > maxTen ? maxTen : prev.tenor,
      plafond: prev.plafond > maxPlaf ? maxPlaf : prev.plafond,
    }));
    setItemp({
      ...temp,
      max_tenor: maxTen,
      max_plafond: maxPlaf,
      angsuran: angs,
    });
  }, [
    data.created_at,
    data.plafond,
    data.tenor,
    data.Debitur.birthdate,
    data.Debitur.salary,
    data.produkPembiayaanId,
    data.margin_type,
    data.c_margin,
    data.c_margin_sumdan,
  ]);

  return (
    <div>
      <Card
        title={
          <div>
            <UserOutlined /> Data Debitur
          </div>
        }
        loading={loading}
      >
        <div className="flex gap-2 flex-wrap">
          <FormInput
            data={{
              mode: "vertical",
              label: "Nomor Pensiun",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.nopen,
              onChange: (e: string) =>
                setData({
                  ...data,
                  nopen: e,
                  Debitur: { ...data.Debitur, nopen: e },
                }),
              suffix: (
                <Button
                  icon={<SearchOutlined />}
                  size="small"
                  type="primary"
                  onClick={() => handleSearch()}
                  loading={loading}
                ></Button>
              ),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Nama Lengkap",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.fullname,
              onChange: (e: string) =>
                setData({ ...data, Debitur: { ...data.Debitur, fullname: e } }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Nomor NIK",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.nik,
              onChange: (e: string) =>
                setData({ ...data, Debitur: { ...data.Debitur, nik: e } }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Tempat Lahir",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.birthplace,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, birthplace: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Tanggal Lahir",
              type: "date",
              class: "flex-1",
              required: true,
              value: moment(data.Debitur.birthdate).format("YYYY-MM-DD"),
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, birthdate: new Date(e) },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Gaji Pensiun",
              type: "text",
              class: "flex-1",
              required: true,
              value: IDRFormat(data.Debitur.salary || 0),
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, salary: IDRToNumber(e || "0") },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Jenis Kelamin",
              type: "select",
              class: "flex-1",
              required: true,
              options: [
                { label: "LAKI - LAKI", value: "LAKI - LAKI" },
                { label: "PEREMPUAN", value: "PEREMPUAN" },
              ],
              value: data.Debitur.gender,
              onChange: (e: string) =>
                setData({ ...data, Debitur: { ...data.Debitur, gender: e } }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Pendidikan Terakhir",
              type: "select",
              class: "flex-1",
              required: true,
              options: [
                { label: "TIDAK TAMAT SD", value: "TIDAK TAMAT SD" },
                { label: "SEDERAJAT", value: "SEDERAJAT" },
                { label: "SMP", value: "SMP" },
                { label: "SMA", value: "SMA" },
                { label: "D3", value: "D3" },
                { label: "S1", value: "S1" },
                { label: "S2", value: "S2" },
                { label: "S3", value: "S3" },
                { label: "LAINNYA", value: "LAINNYA" },
              ],
              value: data.Debitur.education,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, education: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Agama",
              type: "select",
              class: "flex-1",
              required: true,
              options: [
                { label: "ISLAM", value: "ISLAM" },
                { label: "KRISTEN", value: "KRISTEN" },
                { label: "HINDU", value: "HINDU" },
                { label: "BUDHA", value: "BUDHA" },
                { label: "KATHOLIK", value: "KATHOLIK" },
                { label: "KONGHUCU", value: "KONGHUCU" },
                { label: "LAINNYA", value: "LAINNYA" },
              ],
              value: data.Debitur.religion,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, religion: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Nomor Telepon",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.phone,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, phone: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Nomor NPWP",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.npwp,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, npwp: e },
                }),
            }}
          />
          <Divider titlePlacement="left">Alamat</Divider>
          <FormInput
            data={{
              mode: "vertical",
              label: "Provinsi",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.province,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, province: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Kota/Kab",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.city,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, city: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Kecamatan",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.district,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, district: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Kelurahan",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.ward,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, ward: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Alamat",
              type: "textarea",
              class: "flex-1",
              required: true,
              value: data.Debitur.address,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, address: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Kode Pos",
              type: "number",
              class: "flex-1",
              required: true,
              value: data.Debitur.pos_code,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, pos_code: e },
                }),
            }}
          />
          <Divider titlePlacement="left">Domisili</Divider>
          <div className="w-full font-bold">
            <Checkbox
              checked={data.dom_status}
              onChange={(e) =>
                setData({ ...data, dom_status: e.target.checked })
              }
            />{" "}
            Domisili sama dengan KTP?
          </div>
          {!data.dom_status && (
            <FormInput
              data={{
                mode: "vertical",
                label: "Provinsi",
                type: "text",
                class: "flex-1",
                value: data.province,
                onChange: (e: string) =>
                  setData({
                    ...data,
                    province: e,
                  }),
              }}
            />
          )}
          {!data.dom_status && (
            <FormInput
              data={{
                mode: "vertical",
                label: "Kota/Kab",
                type: "text",
                class: "flex-1",
                value: data.city,
                onChange: (e: string) =>
                  setData({
                    ...data,
                    city: e,
                  }),
              }}
            />
          )}
          {!data.dom_status && (
            <FormInput
              data={{
                mode: "vertical",
                label: "Kecamatan",
                type: "text",
                class: "flex-1",
                value: data.district,
                onChange: (e: string) =>
                  setData({
                    ...data,
                    district: e,
                  }),
              }}
            />
          )}
          {!data.dom_status && (
            <FormInput
              data={{
                mode: "vertical",
                label: "Kelurahan",
                type: "text",
                class: "flex-1",
                value: data.ward,
                onChange: (e: string) =>
                  setData({
                    ...data,
                    ward: e,
                  }),
              }}
            />
          )}
          {!data.dom_status && (
            <FormInput
              data={{
                mode: "vertical",
                label: "Alamat",
                type: "textarea",
                class: "flex-1",
                value: data.address,
                onChange: (e: string) =>
                  setData({
                    ...data,
                    address: e,
                  }),
              }}
            />
          )}
          {!data.dom_status && (
            <FormInput
              data={{
                mode: "vertical",
                label: "Kode Pos",
                type: "number",
                class: "flex-1",
                value: data.pos_code,
                onChange: (e: string) =>
                  setData({
                    ...data,
                    pos_code: e,
                  }),
              }}
            />
          )}
          <FormInput
            data={{
              mode: "vertical",
              label: "Geo Location",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.geolocation,
              onChange: (e: string) =>
                setData({
                  ...data,
                  geolocation: e,
                }),
            }}
          />
        </div>
      </Card>
      <Card
        title={
          <div>
            <SolutionOutlined /> Data Rumah & Pekerjaan
          </div>
        }
        style={{ marginTop: 5 }}
        loading={loading}
      >
        <div className="flex gap-2 flex-wrap">
          <FormInput
            data={{
              mode: "vertical",
              label: "Status Rumah",
              type: "select",
              class: "flex-1",
              required: true,
              options: [
                { label: "MILIK SENDIRI", value: "MILIK SENDIRI" },
                { label: "MILIK KELUARGA", value: "MILIK KELUARGA" },
                { label: "SEWA", value: "SEWA" },
                { label: "TIDAK PUNYA RUMAH", value: "TIDAK PUNYA RUMAH" },
                { label: "LAINNYA", value: "LAINNYA" },
              ],
              value: data.house_status,
              onChange: (e: string) =>
                setData({
                  ...data,
                  house_status: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Tahun Menempati",
              type: "number",
              class: "flex-1",
              required: true,
              value: data.house_year,
              onChange: (e: string) =>
                setData({
                  ...data,
                  house_year: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Pekerjaan",
              type: "text",
              class: "flex-1",
              value: data.job,
              onChange: (e: string) =>
                setData({
                  ...data,
                  job: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Alamat Pekerjaan",
              type: "textarea",
              class: "flex-1",
              value: data.job_address,
              onChange: (e: string) =>
                setData({
                  ...data,
                  job_address: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Jenis Usaha",
              type: "text",
              class: "flex-1",
              value: data.business,
              onChange: (e: string) =>
                setData({
                  ...data,
                  business: e,
                }),
            }}
          />
        </div>
      </Card>
      <Card
        title={
          <div>
            <TeamOutlined /> Data Keluarga
          </div>
        }
        style={{ marginTop: 5 }}
        loading={loading}
      >
        <div className="flex gap-2 flex-wrap">
          <FormInput
            data={{
              mode: "vertical",
              label: "Status Kawin",
              type: "select",
              class: "flex-1",
              required: true,
              options: [
                { label: "LAJANG", value: "LAJANG" },
                { label: "KAWIN", value: "KAWIN" },
                { label: "JANDA", value: "JANDA" },
                { label: "DUDA", value: "DUDA" },
              ],
              value: data.marriage_status,
              onChange: (e: string) =>
                setData({
                  ...data,
                  marriage_status: e as EMarriageStatus,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Nama Ibu Kandung",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.mother_name,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, mother_name: e },
                }),
            }}
          />
          <Divider titlePlacement="left">Ahli Waris</Divider>
          <FormInput
            data={{
              mode: "vertical",
              label: "Nama Lengkap",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.aw_name,
              onChange: (e: string) =>
                setData({
                  ...data,
                  aw_name: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Nomor NIK",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.aw_nik,
              onChange: (e: string) =>
                setData({
                  ...data,
                  aw_nik: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Tempat Lahir",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.aw_birthplace,
              onChange: (e: string) =>
                setData({
                  ...data,
                  aw_birthplace: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Tanggal Lahir",
              type: "date",
              class: "flex-1",
              required: true,
              value: moment(data.aw_birthdate).format("YYYY-MM-DD"),
              onChange: (e: string) =>
                setData({
                  ...data,
                  aw_birthdate: new Date(e),
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Pekerjaan",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.aw_job,
              onChange: (e: string) =>
                setData({
                  ...data,
                  aw_job: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "No Telepon",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.aw_phone,
              onChange: (e: string) =>
                setData({
                  ...data,
                  aw_phone: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Alamat",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.aw_address,
              onChange: (e: string) =>
                setData({
                  ...data,
                  aw_address: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Hubungan",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.aw_relate,
              onChange: (e: string) =>
                setData({
                  ...data,
                  aw_relate: e,
                }),
            }}
          />
          <Divider titlePlacement="left">Keluarga Tidak Serumah</Divider>
          <FormInput
            data={{
              mode: "vertical",
              label: "Nama Lengkap",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.f_name,
              onChange: (e: string) =>
                setData({
                  ...data,
                  f_name: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "No Telepon",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.f_phone,
              onChange: (e: string) =>
                setData({
                  ...data,
                  f_phone: e,
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Alamat",
              type: "textarea",
              class: "flex-1",
              required: true,
              value: data.f_address,
              onChange: (e: string) =>
                setData({
                  ...data,
                  f_address: e,
                }),
            }}
          />

          <FormInput
            data={{
              mode: "vertical",
              label: "Hubungan",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.f_relate,
              onChange: (e: string) =>
                setData({
                  ...data,
                  f_relate: e,
                }),
            }}
          />
        </div>
      </Card>
      <Card
        title={
          <div>
            <KeyOutlined /> Data Pensiunan
          </div>
        }
        style={{ marginTop: 5 }}
        loading={loading}
      >
        <div className="flex gap-2 flex-wrap">
          <FormInput
            data={{
              mode: "vertical",
              label: "Nama SKEP",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.name_skep,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, name_skep: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Nomor SKEP",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.no_skep,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, no_skep: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Tanggal SKEP",
              type: "date",
              class: "flex-1",
              required: true,
              value: moment(data.Debitur.date_skep).format("YYYY-MM-DD"),
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, date_skep: new Date(e) },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Kode Jiwa",
              type: "number",
              class: "flex-1",
              required: true,
              value: data.Debitur.soul_code,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, soul_code: Number(e) },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "TMT Pensiun",
              type: "date",
              class: "flex-1",
              required: true,
              value: moment(data.Debitur.tmt_skep).format("YYYY-MM-DD"),
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, tmt_skep: new Date(e) },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Masa Kerja Pensiun",
              type: "number",
              class: "flex-1",
              required: true,
              value: data.Debitur.job_year,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, job_year: Number(e) },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Kelompok Pensiun",
              type: "select",
              class: "flex-1",
              required: true,
              options: [
                { label: "TASPEN", value: "TASPEN" },
                { label: "ASABRI", value: "ASABRI" },
                { label: "BUMN", value: "BUMN" },
                { label: "LAINNYA", value: "LAINNYA" },
              ],
              value: data.Debitur.group_skep,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, group_skep: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Pangkat Pensiun",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.rank_skep,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, rank_skep: e },
                }),
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Penerbi SKEP",
              type: "text",
              class: "flex-1",
              required: true,
              value: data.Debitur.publisher_skep,
              onChange: (e: string) =>
                setData({
                  ...data,
                  Debitur: { ...data.Debitur, publisher_skep: e },
                }),
            }}
          />
        </div>
      </Card>
      <Card
        title={
          <div>
            <DollarCircleOutlined /> Data Pembiayaan
          </div>
        }
        style={{ marginTop: 5 }}
        loading={loading}
      >
        <div className="flex gap-2 flex-wrap">
          <div className="w-full flex gap-2 flex-col sm:flex-row">
            <div className="flex-1 flex gap-2 flex-wrap">
              <FormInput
                data={{
                  mode: "vertical",
                  label: "Tanggal Permohonan",
                  type: "date",
                  class: "flex-1",
                  required: true,
                  value: moment(data.created_at).format("YYYY-MM-DD"),
                  onChange: (e: string) =>
                    setData({
                      ...data,
                      created_at: new Date(e),
                    }),
                }}
              />
              <FormInput
                data={{
                  mode: "vertical",
                  label: "Usia Pengajuan",
                  type: "text",
                  class: "flex-1",
                  disabled: true,
                  value: (() => {
                    const { year, month, day } = GetFullAge(
                      data.Debitur.birthdate,
                      data.created_at,
                    );
                    return `${year} Thn ${month} Bln ${day} Hr`;
                  })(),
                }}
              />
              <FormInput
                data={{
                  mode: "vertical",
                  label: "Jenis Pembiayaan",
                  type: "select",
                  class: "w-full",
                  options: jenis.map((j) => ({ label: j.name, value: j.id })),
                  value: data.jenisPembiayaanId,
                  onChange: (e: string) => {
                    const find = jenis.find((j) => j.id === e);
                    if (find) {
                      setData({
                        ...data,
                        jenisPembiayaanId: e,
                        JenisPembiayaan: find,
                        c_mutasi: find.c_mutasi,
                        c_blokir: find.c_blokir,
                      });
                    }
                  },
                }}
              />
              <FormInput
                data={{
                  mode: "vertical",
                  label: "Kantor Bayar Asal",
                  type: "text",
                  class: "flex-1",
                  required: true,
                  value: data.mutasi_from,
                  onChange: (e: string) =>
                    setData({
                      ...data,
                      mutasi_from: e,
                      Debitur: { ...data.Debitur, pay_office: e },
                    }),
                }}
              />
              <FormInput
                data={{
                  mode: "vertical",
                  label: "Kantor Bayar Tujuan",
                  type: "text",
                  class: "flex-1",
                  value: data.mutasi_to,
                  onChange: (e: string) =>
                    setData({
                      ...data,
                      mutasi_to: e,
                    }),
                }}
              />
              <FormInput
                data={{
                  mode: "vertical",
                  label: "Nomor Rekening",
                  type: "text",
                  class: "flex-1",
                  value: data.Debitur.account_number,
                  onChange: (e: string) =>
                    setData({
                      ...data,
                      Debitur: { ...data.Debitur, account_number: e },
                    }),
                }}
              />
              <FormInput
                data={{
                  mode: "vertical",
                  label: "Nama Bank (Rekening)",
                  type: "text",
                  class: "flex-1",
                  value: data.Debitur.account_name,
                  onChange: (e: string) =>
                    setData({
                      ...data,
                      Debitur: { ...data.Debitur, account_name: e },
                    }),
                }}
              />
              <FormInput
                data={{
                  mode: "vertical",
                  label: "Instansi Takeover",
                  type: "text",
                  class: "flex-1",
                  value: data.takeover_from,
                  onChange: (e: string) =>
                    setData({
                      ...data,
                      takeover_from: e,
                    }),
                }}
              />
              <FormInput
                data={{
                  mode: "vertical",
                  label: "Est Tgl Takeover",
                  type: "date",
                  class: "flex-1",
                  value: moment(data.takeover_date).format("YYYY-MM-DD"),
                  onChange: (e: string) =>
                    setData({
                      ...data,
                      takeover_date: new Date(e),
                    }),
                }}
              />
            </div>
            <div className="flex-1 ">
              <div className="flex-1">
                <p>Produk Pembiayaan</p>
                <Select
                  className="w-full"
                  options={sumdanAv.map((j) => ({
                    label: j.name,
                    options: j.ProdukPembiayaan.map((p) => ({
                      label: `${p.name} - ${p.id}`,
                      value: p.id,
                    })),
                  }))}
                  value={data.produkPembiayaanId}
                  onChange={(e: string) => {
                    const find = sumdan
                      .flatMap((s) => s.ProdukPembiayaan)
                      .find((f) => f.id === e);
                    if (find) {
                      setData({
                        ...data,
                        produkPembiayaanId: e,
                        ProdukPembiayaan: find,
                        c_margin: find.c_margin,
                        c_margin_sumdan: find.Sumdan.c_margin,
                        margin_type: find.margin_type,
                        c_adm: find.c_adm,
                        c_adm_sumdan: find.Sumdan.c_adm,
                        c_insurance: find.c_insurance,
                        c_gov: find.Sumdan.c_gov,
                        c_account: find.Sumdan.c_account,
                        c_stamp: find.Sumdan.c_stamps,
                        c_infomation: find.Sumdan.c_information,
                        c_provisi: find.Sumdan.c_provisi,
                        rounded: find.Sumdan.rounded,
                        rounded_sumdan: find.Sumdan.rounded_sumdan,
                        tbo: find.Sumdan.tbo,
                      });
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <FormInput
                  data={{
                    mode: "vertical",
                    label: "Tenor",
                    type: "number",
                    class: "flex-1",
                    value: data.tenor,
                    onChange: (e: string) =>
                      setData({ ...data, tenor: Number(e) }),
                  }}
                />
                <FormInput
                  data={{
                    mode: "vertical",
                    label: "Max Tenor",
                    type: "number",
                    class: "flex-1",
                    disabled: true,
                    value: temp.max_tenor,
                  }}
                />
                <FormInput
                  data={{
                    mode: "vertical",
                    label: "Plafond",
                    type: "text",
                    class: "flex-1",
                    value: IDRFormat(data.plafond),
                    onChange: (e: string) =>
                      setData({
                        ...data,
                        plafond: IDRToNumber(e || "0"),
                      }),
                  }}
                />
                <FormInput
                  data={{
                    mode: "vertical",
                    label: "Max Plafond",
                    type: "text",
                    class: "flex-1",
                    disabled: true,
                    value: IDRFormat(temp.max_plafond || 0),
                  }}
                />
                <FormInput
                  data={{
                    mode: "vertical",
                    label: "Margin",
                    type: "number",
                    class: "flex-1",
                    value: data.c_margin,
                    onChange: (e: string) =>
                      setData({ ...data, c_margin: Number(e) }),
                  }}
                />
                <FormInput
                  data={{
                    mode: "vertical",
                    label: "Margin Mitra",
                    type: "number",
                    class: "flex-1",
                    value: data.c_margin_sumdan,
                    onChange: (e: string) =>
                      setData({ ...data, c_margin_sumdan: Number(e) }),
                  }}
                />
                <FormInput
                  data={{
                    mode: "vertical",
                    label: "Jenis Margin",
                    type: "select",
                    class: "flex-1",
                    options: [
                      { label: "ANUITAS", value: "ANUITAS" },
                      { label: "EFEKTIF", value: "EFEKTIF" },
                      { label: "FLAT", value: "FLAT" },
                    ],
                    value: data.margin_type,
                    onChange: (e: string) =>
                      setData({ ...data, margin_type: e as EMarginType }),
                  }}
                />
                <FormInput
                  data={{
                    mode: "vertical",
                    label: "Pembulatan",
                    type: "text",
                    class: "flex-1",
                    value: IDRFormat(data.rounded),
                    onChange: (e: string) =>
                      setData({
                        ...data,
                        rounded: IDRToNumber(e || "0"),
                      }),
                  }}
                />
                <FormInput
                  data={{
                    mode: "vertical",
                    label: "Pembulatan Mitra",
                    type: "text",
                    class: "flex-1",
                    value: IDRFormat(data.rounded_sumdan),
                    onChange: (e: string) =>
                      setData({
                        ...data,
                        rounded_sumdan: IDRToNumber(e || "0"),
                      }),
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <Divider titlePlacement="left">Rincian Biaya</Divider>
        <div className="flex gap-4 flex-col sm:flex-row items-end">
          <div className="flex-1 flex-col gap-1">
            <div className="flex justify-between border-b border-dashed my-1">
              <div className="flex-1">Administrasi</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  style={{ width: 80 }}
                  suffix={<span className="text-xs italic opacity-70">%</span>}
                  value={data.c_adm}
                  onChange={(e) =>
                    setData({ ...data, c_adm: Number(e.target.value || 0) })
                  }
                  type={"number"}
                />
                <Input
                  size="small"
                  style={{ width: 80 }}
                  suffix={<span className="text-xs italic opacity-70">%</span>}
                  value={data.c_adm_sumdan}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c_adm_sumdan: Number(e.target.value || 0),
                    })
                  }
                  type={"number"}
                />
                <Input
                  size="small"
                  disabled
                  value={IDRFormat(
                    (data.plafond * (data.c_adm + data.c_adm_sumdan)) / 100,
                  )}
                  style={{ textAlign: "right", color: "black" }}
                />
              </div>
            </div>
            <div className="flex justify-between border-b border-dashed my-1">
              <div className="flex-1">Asuransi</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  style={{ width: 80 }}
                  suffix={<span className="text-xs italic opacity-70">%</span>}
                  value={data.c_insurance}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c_insurance: Number(e.target.value || 0),
                    })
                  }
                  type={"number"}
                />
                <Input
                  size="small"
                  disabled
                  value={IDRFormat((data.plafond * data.c_insurance) / 100)}
                  style={{ textAlign: "right", color: "black" }}
                />
              </div>
            </div>
            <div className="flex justify-between border-b border-dashed my-1">
              <div className="flex-1">Tatalaksana</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  value={IDRFormat(data.c_gov)}
                  style={{ textAlign: "right", color: "black" }}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c_gov: IDRToNumber(e.target.value || "0"),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-between border-b border-dashed my-1">
              <div className="flex-1">Buka Rekening</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
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
            <div className="flex justify-between border-b border-dashed my-1">
              <div className="flex-1">Provisi</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
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
            <div className="flex justify-between border-b border-dashed my-1">
              <div className="flex-1">Data Informasi</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  value={IDRFormat(data.c_infomation)}
                  style={{ textAlign: "right", color: "black" }}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c_infomation: IDRToNumber(e.target.value || "0"),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-between border-b border-dashed my-1">
              <div className="flex-1">Materai</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  disabled
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
            <div className="flex justify-between border-b border-dashed my-1">
              <div className="flex-1">Mutasi</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  disabled
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
            <div className="flex justify-between border-b border-dashed my-1">
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
                      c_blokir: Number(e.target.value || 0),
                    })
                  }
                  type={"number"}
                />
                <Input
                  size="small"
                  disabled
                  value={IDRFormat(data.c_blokir * temp.angsuran)}
                  style={{ textAlign: "right", color: "black" }}
                />
              </div>
            </div>
            <div className="flex justify-between border-t mt-3 text-red-500 font-bold">
              <div className="flex-1">Total Biaya</div>
              <div className="text-right">{IDRFormat(GetBiaya(data))}</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between my-1 italic">
              <span>Angsuran</span>
              <span>{IDRFormat(temp.angsuran)}</span>
            </div>
            <div className="flex justify-between my-1 italic">
              <span>Sisa Gaji</span>
              <span>{IDRFormat(data.Debitur.salary - temp.angsuran)}</span>
            </div>
            <div className="flex justify-between my-1 border-b rounded italic">
              <span>Debt Service Ratio</span>
              <span>
                {(temp.angsuran / (data.Debitur.salary / 100)).toFixed(2)}% /{" "}
                {data.ProdukPembiayaan?.Sumdan?.dsr ?? 0}%
              </span>
            </div>
            <div className="my-5"></div>
            <div className="flex justify-between border-b border-dashed my-1 font-bold text-blue-600">
              <span>Terima Kotor</span>
              <span>{IDRFormat(data.plafond - GetBiaya(data))}</span>
            </div>
            <div className="flex gap-2 justify-between items-center my-1">
              <div className="flex-1">Bpp</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  value={IDRFormat(data.c_bpp || 0)}
                  style={{ textAlign: "right", color: "red" }}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c_bpp: IDRToNumber(e.target.value || "0"),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 justify-between items-center my-1">
              <div className="flex-1">Nominal Takeover</div>
              <div className="flex gap-2 flex-2">
                <Input
                  size="small"
                  value={IDRFormat(data.c_takeover || 0)}
                  style={{ textAlign: "right", color: "red" }}
                  onChange={(e) =>
                    setData({
                      ...data,
                      c_takeover: IDRToNumber(e.target.value || "0"),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-between border-b border-dashed my-1 font-bold text-green-600">
              <span>Terima Bersih</span>
              <span>
                {IDRFormat(
                  data.plafond -
                    (GetBiaya(data) +
                      data.c_bpp +
                      data.c_takeover +
                      data.c_blokir * temp.angsuran),
                )}
              </span>
            </div>
          </div>
        </div>
      </Card>
      <Card
        title={
          <div>
            <SignatureOutlined /> Account Officer
          </div>
        }
        style={{ marginTop: 5 }}
        loading={loading}
      >
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <FormInput
            data={{
              mode: "vertical",
              label: "Nama AO",
              type: "select",
              class: "flex-1",
              required: true,
              value: data.aoId,
              options: users.map((u) => ({
                label: `${u.fullname} (${u.Cabang.name})`,
                value: u.id,
              })),
              onChange: (e: string) => {
                const find = users.find((u) => u.id === e);
                if (find) setData({ ...data, AO: find, aoId: e });
              },
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "No Telepon",
              type: "text",
              class: "flex-1",
              disabled: true,
              value: data.AO.phone,
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Posisi",
              type: "text",
              class: "flex-1",
              disabled: true,
              value: data.AO.position,
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Cabang",
              type: "text",
              class: "flex-1",
              disabled: true,
              value: data.AO.Cabang?.name,
            }}
          />
          <FormInput
            data={{
              mode: "vertical",
              label: "Area",
              type: "text",
              class: "flex-1",
              disabled: true,
              value: data.AO.Cabang?.Area?.name,
            }}
          />
        </div>
      </Card>
      <Card
        title={
          <div>
            <FolderOutlined /> Berkas Pembiayaan
          </div>
        }
        style={{ marginTop: 5 }}
        loading={loading}
      >
        <div className="flex flex-col gap-2">
          <FormInput
            data={{
              label: "Berkas SLIK (PDF)",
              type: "upload",
              class: "flex-1",
              accept: "application/pdf",
              value: data.file_slik,
              onChange: (e: string) => setData({ ...data, file_slik: e }),
            }}
          />
          <FormInput
            data={{
              label: "Berkas Pengajuan (PDF)",
              type: "upload",
              class: "flex-1",
              accept: "application/pdf",
              value: data.file_submission,
              onChange: (e: string) => setData({ ...data, file_submission: e }),
            }}
          />
          <FormInput
            data={{
              label: "Berkas Wawancara (MP4)",
              type: "upload",
              class: "flex-1",
              accept: "video/mp4",
              value: data.video_interview,
              onChange: (e: string) => setData({ ...data, video_interview: e }),
            }}
          />
          <FormInput
            data={{
              label: "Berkas Asuransi (MP4)",
              type: "upload",
              class: "flex-1",
              accept: "video/mp4",
              value: data.video_insurance,
              onChange: (e: string) => setData({ ...data, video_insurance: e }),
            }}
          />
          <FormInput
            data={{
              label: "Berkas Akad Kredit (PDF)",
              type: "upload",
              class: "flex-1",
              accept: "application/pdf",
              value: data.file_contract,
              onChange: (e: string) => setData({ ...data, file_contract: e }),
            }}
          />
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <Link href={"/monitoring"}>
            <Button>Cancel</Button>
          </Link>
          <Button
            type="primary"
            loading={loading}
            onClick={() => handleSubmit()}
            disabled={
              !data.nopen ||
              !data.Debitur.fullname ||
              !data.Debitur.pay_office ||
              !data.aoId ||
              !data.jenisPembiayaanId ||
              !data.produkPembiayaanId
            }
          >
            Submit
          </Button>
        </div>
      </Card>
    </div>
  );
}

const defaultData: IDapem = {
  id: "",
  tenor: 0,
  plafond: 0,
  c_margin: 0,
  c_margin_sumdan: 0,
  c_adm: 0,
  c_adm_sumdan: 0,
  c_insurance: 0,
  c_gov: 0,
  c_stamp: 0,
  c_account: 0,
  c_mutasi: 0,
  c_blokir: 0,
  c_takeover: 0,
  c_infomation: 0,
  c_provisi: 0,
  c_bpp: 0,
  tbo: 0,
  rounded: 0,
  rounded_sumdan: 0,
  margin_type: "ANUITAS",

  takeover_from: null,
  takeover_date: null,
  mutasi_from: null,
  mutasi_to: null,

  dom_status: false,
  address: "",
  ward: "",
  district: "",
  city: "",
  province: null,
  pos_code: null,
  geolocation: null,

  house_status: null,
  house_year: null,
  job: null,
  job_address: null,
  business: null,
  marriage_status: "KAWIN",
  aw_name: null,
  aw_nik: null,
  aw_birthdate: null,
  aw_birthplace: null,
  aw_job: null,
  aw_address: null,
  aw_relate: null,
  aw_phone: null,

  f_name: null,
  f_relate: null,
  f_phone: null,
  f_address: null,

  dropping_status: "DRAFT",
  verif_status: null,
  verif_desc: null,
  slik_status: null,
  slik_desc: null,
  approv_status: null,
  approv_desc: null,
  takeover_status: "DRAFT",
  takeover_desc: null,
  takeover_date_exc: null,
  mutasi_status: "DRAFT",
  mutasi_desc: null,
  mutasi_date_exc: null,
  flagging_status: "DRAFT",
  flagging_desc: null,
  flagging_date_exc: null,
  cash_status: "DRAFT",
  cash_desc: null,
  document_status: "UNIT",
  document_desc: null,
  guarantee_status: "UNIT",
  guarantee_desc: null,

  used_for: "",
  no_contract: "",
  date_contract: null,

  file_slik: null,
  file_proses: null,
  file_submission: null,
  video_interview: null,
  video_insurance: null,
  file_contract: null,
  file_takeover: null,
  file_mutasi: null,
  file_flagging: null,

  status: true,
  created_at: new Date(),
  updated_at: new Date(),
  Debitur: {} as Debitur,
  ProdukPembiayaan: {} as IProdukPembiayaan,
  JenisPembiayaan: {} as JenisPembiayaan,
  CreatedBy: {} as IUserDapem,
  AO: {} as IUserDapem,
  Dropping: {} as Dropping,
  Berkas: {} as Berkas,
  Jaminan: {} as Jaminan,
  Pelunasan: {} as Pelunasan,
  Angsuran: [],

  nopen: "",
  produkPembiayaanId: "",
  jenisPembiayaanId: "",
  createdById: "",
  aoId: "",
  droppingId: null,
  berkasId: null,
  jaminanId: null,
};

interface ITemp {
  angsuran: number;
  max_tenor: number;
  max_plafond: number;
}
const defaultTemp: ITemp = {
  angsuran: 0,
  max_tenor: 0,
  max_plafond: 0,
};
