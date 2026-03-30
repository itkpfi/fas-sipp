import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";
import { IDapem } from "@/libs/IInterfaces";
import moment from "moment";
import { Header, ListNonStyle } from "../utils";

export const BuktiPencairan = (record: IDapem, isFor: string) => {
  const angsuran = GetAngsuran(
    record.plafond,
    record.tenor,
    record.c_margin + record.c_margin_sumdan,
    record.margin_type,
    record.rounded,
  ).angsuran;
  const admin = record.plafond * ((record.c_adm_sumdan + record.c_adm) / 100);
  const asuransi = record.plafond * (record.c_insurance / 100);
  const blokir = angsuran * record.c_blokir;
  const biaya =
    admin +
    asuransi +
    record.c_gov +
    record.c_account +
    record.c_stamp +
    record.c_infomation +
    blokir +
    record.c_mutasi +
    record.c_provisi;

  return `
  ${Header("BUKTI PENCAIRAN PEMBIAYAAN", isFor, record.no_contract, process.env.NEXT_PUBLIC_APP_LOGO, record.ProdukPembiayaan.Sumdan.logo)}
  
  <div class="border-b mt-8">
    <div class="flex gap-2">
      <p class="w-44">Nama Penerima</p>
      <p class="w-4">:</p>
      <p class="flex-1">${record.Debitur.fullname}</p>
    </div>
    <div class="flex gap-2">
      <p class="w-44">Nomor NIK</p>
      <p class="w-4">:</p>
      <p class="flex-1">${record.Debitur.nik}</p>
    </div>
    <div class="flex gap-2">
      <p class="w-44">Tempat/Tanggal Lahir</p>
      <p class="w-4">:</p>
      <p class="flex-1">${record.Debitur.birthplace}, ${moment(record.Debitur.birthdate).format("DD-MM-YYYY")}</p>
    </div>
    <div class="flex gap-2">
      <p class="w-44">Pekerjaan</p>
      <p class="w-4">:</p>
      <p class="flex-1">${record.job}</p>
    </div>
    <div class="flex gap-2">
      <p class="w-44">No Telepon</p>
      <p class="w-4">:</p>
      <p class="flex-1">${record.Debitur.phone}</p>
    </div>
    <div class="flex gap-2">
      <p class="w-44">NIP / NRP / NOPEN</p>
      <p class="w-4">:</p>
      <p class="flex-1">${record.Debitur.nopen}</p>
    </div>
    <div class="flex gap-2">
      <p class="w-44">Alamat</p>
      <p class="w-4">:</p>
      <p class="flex-1">${record.Debitur.address}, KELURAHAN ${record.Debitur.ward} KECAMATAN ${record.Debitur.district}, ${record.Debitur.city} ${record.Debitur.province} ${record.Debitur.pos_code}</p>
    </div>
  </div>
  <div class="mt-5 mb-5">
    ${ListNonStyle([
      {
        key: "Plafond Pembiayaan",
        value: IDRFormat(record.plafond),
        currency: true,
      },
      { key: "Jangka Waktu/Tenor", value: `${record.tenor} Bulan` },
      {
        key: "Bunga",
        value: `${(record.c_margin + record.c_margin_sumdan).toFixed(2)}% /Tahun`,
      },
      { key: "Angsuran", value: IDRFormat(angsuran), currency: true },
    ])}
  </div>

  <div>
    <p class="font-bold">Rincian Pembiayaan</p>
    <div class="flex gap-10 items-end">
      <div class="flex-1">
        ${ListNonStyle([
          {
            key: "Biaya Administrasi",
            value: IDRFormat(admin),
            currency: true,
          },
          { key: "Biaya Asuransi", value: IDRFormat(asuransi), currency: true },
          {
            key: "Biaya Tatalaksana",
            value: IDRFormat(record.c_gov),
            currency: true,
          },
          {
            key: "Biaya Buka Rekening",
            value: IDRFormat(record.c_account),
            currency: true,
          },
          {
            key: "Biaya Materai",
            value: IDRFormat(record.c_stamp),
            currency: true,
          },
          {
            key: "Biaya Provisi",
            value: IDRFormat(record.c_provisi),
            currency: true,
          },
          {
            key: "Biaya Data Informasi",
            value: IDRFormat(record.c_infomation),
            currency: true,
          },
          {
            key: "Biaya Mutasi",
            value: IDRFormat(record.c_mutasi),
            currency: true,
          },
          {
            key: `Blokir Angsuran (${record.c_blokir}x)`,
            value: IDRFormat(blokir),
            currency: true,
          },
          {
            key: "Total Biaya",
            value: IDRFormat(biaya),
            classStyle: "font-bold border-t border-dashed",
            currency: true,
          },
        ])}
      </div>
      <div class="flex-1">
      ${ListNonStyle([
        {
          key: "Terima Kotor",
          value: IDRFormat(record.plafond - biaya),
          classStyle: "font-bold",
          currency: true,
        },
        {
          key: `Bpp`,
          value: IDRFormat(record.c_bpp),
          currency: true,
        },
        {
          key: "Nominal Takeover",
          value: IDRFormat(record.c_takeover),
          currency: true,
        },
        {
          key: "Terima Bersih",
          value: IDRFormat(
            record.plafond - (biaya + record.c_takeover + record.c_bpp),
          ),
          classStyle: "font-bold border-t border-dashed",
          currency: true,
        },
      ])}
      </div>
    </div>
  </div>

  <p class="my-5">Dengan ini saya menyatakan bahwa telah menerima fasilitas pembiayaan dari ${record.ProdukPembiayaan.Sumdan.name} melalui ${process.env.NEXT_PUBLIC_APP_FULLNAME} sebesar tersebut diatas.</p>

  <div class="my-5 flex justify-around gap-10 items-end text-center">
    <div class="flex-1">
      <p>${record.Debitur.city?.toLocaleLowerCase().replace("kota", "").replace("kabupaten", "").toUpperCase()}, ${moment(record.date_contract).format("DD-MM-YYYY")}</p>
      <p>Penerima Pembiayaan</p>
      <div class="h-28"></div>
      <p class="border-b">${record.Debitur.fullname}</p>
      <p>DEBITUR</p>
    </div>
    <div class="flex-1">
      <p>Diperiksa oleh</p>
      <div class="h-28"></div>
      <p class="border-b">${record.AO.fullname}</p>
      <p>Petugas</p>
    </div>
  </div>
  <div class="mt-10 flex justify-around gap-10 items-end text-center">
    <div class="flex-1">
      <p>Diperiksa oleh</p>
      <div class="h-28"></div>
      <p class="border-b">${process.env.NEXT_PUBLIC_APP_SI_NAME}</p>
      <p>${process.env.NEXT_PUBLIC_APP_SI_POSITION}</p>
    </div>
    <div class="flex-1">
      <p>Diotorisasi oleh</p>
      <div class="h-28"></div>
      <p class="border-b">${process.env.NEXT_PUBLIC_APP_AKAD_NAME}</p>
      <p>${process.env.NEXT_PUBLIC_APP_AKAD_POSITION}</p>
    </div>
  </div>

`;
};
