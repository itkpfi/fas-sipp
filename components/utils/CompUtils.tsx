"use client";

import { IDapem, IDesc, IExportData } from "@/libs/IInterfaces";
import {
  CategoryOfAccount,
  EDapemStatus,
  EDocStatus,
  ESubmissionStatus,
} from "@prisma/client";
import { Button, Divider, Drawer, Modal, Tag } from "antd";
import { HookAPI } from "antd/es/modal/useModal";
import { useState } from "react";
import { FormInput } from "./FormUtils";
import { GetAngsuran, IDRFormat } from "./PembiayaanUtil";
import * as XLSX from "xlsx";
import moment from "moment";
import { FilterOutlined } from "@ant-design/icons";

export const GetStatusTag = (status: ESubmissionStatus | undefined | null) => {
  if (status) {
    return (
      <Tag
        color={
          status === "APPROVED"
            ? "green"
            : status === "PENDING"
              ? "orange"
              : "red"
        }
        variant="solid"
      >
        {status}
      </Tag>
    );
  }
  return <div></div>;
};

export const GetDroppingStatusTag = (
  status: EDapemStatus | undefined | null,
) => {
  if (status) {
    return (
      <Tag
        color={
          status === "APPROVED" || status === "PAID_OFF"
            ? "green"
            : status === "DRAFT"
              ? "black"
              : status === "PENDING"
                ? "orange"
                : status === "PROCCESS"
                  ? "blue"
                  : "red"
        }
        variant="solid"
      >
        {status}
      </Tag>
    );
  }
  return <div></div>;
};
export const GetBerkasStatusTag = (status: EDocStatus | undefined | null) => {
  if (status) {
    return (
      <Tag
        color={
          status === "MITRA"
            ? "green"
            : status === "DELIVERY"
              ? "blue"
              : "orange"
        }
        variant="solid"
      >
        {status}
      </Tag>
    );
  }
  return <div></div>;
};

export const ProsesPembiayaan = ({
  data,
  open,
  setOpen,
  getData,
  hook,
  name,
  nextname,
  nextnameValue,
  user,
}: {
  data: IDapem;
  open: boolean;
  setOpen: Function;
  getData: Function;
  hook: HookAPI;
  name: string;
  nextname: string;
  nextnameValue?: string;
  user: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [temp, setTemp] = useState<IDapem>(data);
  const [desc, setDesc] = useState<IDesc>(
    data[(name + "_desc") as keyof IDapem]
      ? (JSON.parse(data[(name + "_desc") as keyof IDapem] as string) as IDesc)
      : defaultDesc,
  );

  const handleSubmit = async () => {
    setLoading(true);
    desc.name = user;
    desc.date = new Date();
    await fetch("/api/dapem?id=" + data.id, {
      method: "PUT",
      body: JSON.stringify({
        ...temp,
        [name + "_desc"]: JSON.stringify(desc),
      }),
    })
      .then((res) => res.json())
      .then(async (res) => {
        if (res.status === 200) {
          setOpen(false);
          hook.success({
            title: "BERHASIL",
            content: "Data pembiayaan berhasil di proses!",
          });
          await getData();
        } else {
          hook.error({ title: "ERROR!!", content: res.msg });
        }
      });
    setLoading(false);
  };

  return (
    <Modal
      onOk={() => handleSubmit()}
      open={open}
      onCancel={() => setOpen(false)}
      loading={loading}
      title={"Proses Pembiayaan " + data.id}
      style={{ top: 20 }}
      okText="Submit"
    >
      <div className="flex my-4 flex-col gap-2">
        <FormInput
          data={{
            label: "Nama Pemohon",
            type: "text",
            value: data.Debitur.fullname,
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "Nomor Pensiun",
            type: "text",
            value: data.Debitur.nopen,
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "Jenis Pembiayaan",
            type: "text",
            value: data.JenisPembiayaan.name,
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "Produk Pembiayaan",
            type: "text",
            value: `${data.ProdukPembiayaan.id} ${data.ProdukPembiayaan.name}`,
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "Pembiayaan",
            type: "text",
            value: `${IDRFormat(data.plafond)} | ${data.tenor} Bulan`,
            disabled: true,
          }}
        />
        <FormInput
          data={{
            label: "Angsuran",
            type: "text",
            value: IDRFormat(
              GetAngsuran(
                data.plafond,
                data.tenor,
                data.c_margin + data.c_margin_sumdan,
                data.margin_type,
                data.rounded,
              ).angsuran,
            ),
            disabled: true,
          }}
        />
        <Divider style={{ fontSize: 12 }}>Proses Pembiayaan</Divider>
        <FormInput
          data={{
            label: "Status Pembiayaan",
            required: true,
            type: "select",
            options: [
              { label: "PENDING", value: "PENDING" },
              { label: "APPROVED", value: "APPROVED" },
              { label: "REJECTED", value: "REJECTED" },
            ],
            value: temp[(name + "_status") as keyof IDapem],
            onChange: (e: string) =>
              setTemp({
                ...temp,
                [(name + "_status") as keyof IDapem]: e,
                ...(e === "APPROVED" && {
                  [nextname]: nextnameValue || "PENDING",
                }),
                ...(e === "REJECTED" && {
                  dropping_status: "REJECTED",
                }),
              }),
          }}
        />
        <FormInput
          data={{
            label: "Keterangan",
            type: "textarea",
            value: desc.desc,
            onChange: (e: string) => setDesc({ ...desc, desc: e }),
          }}
        />
        <FormInput
          data={{
            label: "File (PDF)",
            type: "upload",
            accept: "application/pdf",
            value: temp.file_proses,
            onChange: (e: string) => setTemp({ ...temp, file_proses: e }),
          }}
        />
      </div>
    </Modal>
  );
};

export const FilterData = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Button
        icon={<FilterOutlined />}
        size="small"
        onClick={() => setOpen(true)}
        type="primary"
      >
        Filter
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(!open)}
        title="FILTER DATA"
        placement="right"
        size={window && window.innerWidth > 600 ? "30%" : "60%"}
      >
        {children}
      </Drawer>
    </div>
  );
};

const defaultDesc: IDesc = {
  name: "",
  date: new Date(),
  desc: "",
};

export const ExportToExcel = (data: IExportData[], filename: string) => {
  const wb = XLSX.utils.book_new();
  for (const d of data) {
    const ws = XLSX.utils.json_to_sheet(d.data);
    XLSX.utils.book_append_sheet(wb, ws, d.sheetname);
  }
  XLSX.writeFile(wb, `${filename}_${moment().format("DDMMYYYY")}.xlsx`);
};

export const MappingToExcelDapem = (data: IDapem[]) => {
  return data.map((d, i) => ({
    no: i + 1,
    pemohon: d.Debitur.fullname,
    nopen: d.nopen,
    jenis_pembiayaan: d.JenisPembiayaan.name,
    produk_pembiayaan: d.ProdukPembiayaan.name,
    mitra_pembiayaan: d.ProdukPembiayaan.Sumdan.code,
    plafond: d.plafond,
    tenor: d.tenor,
    created_at: d.created_at,
    tgl_akad: d.date_contract,
    no_akad: d.no_contract,
    no_skep: d.Debitur.no_skep,
    dropping_status: d.dropping_status,
    dropping_date: d.Dropping ? d.Dropping.process_at : null,
    ao: d.AO.fullname,
    cabang: d.AO.Cabang.name,
    area: d.AO.Cabang.Area.name,
    admin: d.CreatedBy.fullname,
    by_admin: d.c_adm,
    by_admin_rp: d.plafond * (d.c_adm / 100),
    adm_mitra: d.c_adm_sumdan,
    adm_mitra_rp: d.plafond * (d.c_adm_sumdan / 100),
    by_asuransi: d.c_insurance,
    by_asuransi_rp: d.plafond * (d.c_insurance / 100),
    by_tatalaksana: d.c_gov,
    by_tabungan: d.c_account,
    by_materai: d.c_stamp,
    by_provisi: d.c_provisi,
    by_infomasi: d.c_infomation,
    by_mutasi: d.c_mutasi,
    blokir: d.c_blokir,
    blokir_rp:
      GetAngsuran(
        d.plafond,
        d.tenor,
        d.c_margin + d.c_margin_sumdan,
        d.margin_type,
        d.rounded,
      ).angsuran * d.c_blokir,
    by_takeover: d.c_takeover,
    by_bpp: d.c_bpp,
    angs: GetAngsuran(
      d.plafond,
      d.tenor,
      d.c_margin + d.c_margin_sumdan,
      d.margin_type,
      d.rounded,
    ).angsuran,
    angs_mitra: GetAngsuran(
      d.plafond,
      d.tenor,
      d.c_margin_sumdan,
      d.margin_type,
      d.rounded_sumdan,
    ).angsuran,
  }));
};

export const MappingToProsesDapem = (data: IDapem[]) => {
  return data.map((d, i) => ({
    no: i + 1,
    pemohon: d.Debitur.fullname,
    nopen: d.nopen,
    jenis_pembiayaan: d.JenisPembiayaan.name,
    produk_pembiayaan: d.ProdukPembiayaan.name,
    mitra_pembiayaan: d.ProdukPembiayaan.Sumdan.code,
    plafond: d.plafond,
    tenor: d.tenor,
    created_at: d.created_at,
    verif_status: d.verif_status,
    slik_status: d.slik_status,
    approval_status: d.approv_status,
    verif_desc: d.verif_desc,
    slik_desc: d.slik_desc,
    approval_desc: d.approv_desc,
    ao: d.AO.fullname,
    cabang: d.AO.Cabang.name,
    area: d.AO.Cabang.Area.name,
    admin: d.CreatedBy.fullname,
  }));
};

export const MappingToTagihan = (data: IDapem[], periode?: string) => {
  return data.map((d, i) => ({
    no: i + 1,
    pemohon: d.Debitur.fullname,
    nopen: d.nopen,
    no_pk: d.no_contract,
    date_pk: d.date_contract,
    plafond: d.plafond,
    tenor: d.tenor,
    angs: GetAngsuran(
      d.plafond,
      d.tenor,
      d.c_margin + d.c_margin_sumdan,
      d.margin_type,
      d.rounded,
    ).angsuran,
    angs_mitra: GetAngsuran(
      d.plafond,
      d.tenor,
      d.c_margin_sumdan,
      d.margin_type,
      d.rounded_sumdan,
    ).angsuran,
    selisih_angs:
      GetAngsuran(
        d.plafond,
        d.tenor,
        d.c_margin + d.c_margin_sumdan,
        d.margin_type,
        d.rounded,
      ).angsuran -
      GetAngsuran(
        d.plafond,
        d.tenor,
        d.c_margin_sumdan,
        d.margin_type,
        d.rounded_sumdan,
      ).angsuran,
    angs_ke: d.Angsuran.find((a) =>
      moment(a.date_pay).isSame(periode || new Date(), "month"),
    )?.counter,
    pokok: d.Angsuran.find((a) =>
      moment(a.date_pay).isSame(periode || new Date(), "month"),
    )?.principal,
    margin: d.Angsuran.find((a) =>
      moment(a.date_pay).isSame(periode || new Date(), "month"),
    )?.margin,
    status: d.Angsuran.find((a) =>
      moment(a.date_pay).isSame(periode || new Date(), "month"),
    )?.date_paid
      ? "PAID"
      : "UNPAID",
  }));
};

export const TypeAccount = (account: CategoryOfAccount) => {
  switch (account.type) {
    case "ASSET":
      return "D";
    case "KEWAJIBAN":
      return "K";
    case "MODAL":
      return "K";
    case "PENDAPATAN":
      return "K";
    case "BEBAN":
      return "D";
    default:
      return "D";
  }
};
