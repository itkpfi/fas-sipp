import { IDapem } from "@/libs/IInterfaces";
import moment from "moment";
import { Header } from "../utils";
import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";

export const FormCeklist1 = (record: IDapem) => {
  const angsuran = GetAngsuran(
    record.plafond,
    record.tenor,
    record.c_margin + record.c_margin_sumdan,
    record.margin_type,
    record.rounded,
  ).angsuran;
  return `
  ${Header("CHECKLIST KELENGKAPAN BERKAS KREDIT", record.no_contract, undefined, process.env.NEXT_PUBLIC_APP_LOGO, record.ProdukPembiayaan.Sumdan.logo)}
  
  <div class="flex gap-10">
    <div class="flex-1">
      <div class="flex gap-2">
        <p class="w-40">Nama Pensiunan</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.Debitur.fullname}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-40">Nomor NIK</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.Debitur.nik}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-40">NIP / NRP / NOPEN</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.Debitur.nopen}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-40">Nomor SKEP</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.Debitur.no_skep}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-40">Tanggal SKEP</p>
        <p class="w-4">:</p>
        <p class="flex-1">${moment(record.Debitur.date_skep).format("DD-MM-YYYY")}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-40">Jenis Pembiayaan</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.JenisPembiayaan.name}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-40">Produk Pembiayaan</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.ProdukPembiayaan.name} <span class="opacity-80">(${record.ProdukPembiayaan.Sumdan.code})</span></p>
      </div>
    </div>
    <div class="flex-1">
      <div class="flex gap-2">
        <p class="w-40">Plafond</p>
        <p class="w-4">:</p>
        <p class="flex-1">Rp. ${IDRFormat(record.plafond)}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-40">Tenor</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.tenor} Bulan</p>
      </div>
      <div class="flex gap-2">
        <p class="w-40">Angsuran</p>
        <p class="w-4">:</p>
        <p class="flex-1">Rp. ${IDRFormat(angsuran)}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-40">Petugas</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.AO.fullname} <span class="text-xs opacity-80">(${record.AO.Cabang.name} - ${record.AO.Cabang.Area.name})</span></p>
      </div>
      <div class="flex gap-2">
        <p class="w-40">Admin</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.CreatedBy.fullname}</p>
      </div>
    </div>
  </div>

  <div class="mt-5">
    <table class="w-full border-collapse border border-slate-400 text-xs">
      <thead class="bg-slate-100 uppercase font-bold text-center">
        <tr>
          <th rowspan="2" class="border border-slate-400 p-2 w-8">NO</th>
          <th rowspan="2" class="border border-slate-400 p-2 w-80">DOKUMEN PERSYARATAN<br>PENGAJUAN PEMBIAYAAN</th>
          <th colspan="2" class="border border-slate-400 p-1 text-[10px]">CHECK ADMIN</th>
          <th rowspan="2" class="border border-slate-400 p-2 w-10">Lbr</th>
          <th colspan="2" class="border border-slate-400 p-1 text-[10px]">CHECK MITRA PUSAT</th>
          <th rowspan="2" class="border border-slate-400 p-2 w-10">Lbr</th>
          <th colspan="2" class="border border-slate-400 p-1 text-[10px]">CHECK ${record.ProdukPembiayaan.Sumdan.code}</th>
          <th rowspan="2" class="border border-slate-400 p-2 w-10">Lbr</th>
        </tr>
        <tr class="text-[9px]">
          <th class="border border-slate-400 p-1 w-12">Asli</th>
          <th class="border border-slate-400 p-1 w-12">FC</th>
          <th class="border border-slate-400 p-1 w-12">Asli</th>
          <th class="border border-slate-400 p-1 w-12">FC</th>
          <th class="border border-slate-400 p-1 w-12">Asli</th>
          <th class="border border-slate-400 p-1 w-12">FC</th>
        </tr>
      </thead>
      <tbody class="text-slate-700">
        ${listBerkas
          .map(
            (d, i) => `
          <tr>
          <td class="border border-slate-400 p-1 text-center font-semibold">${i + 1}</td>
          <td class="border border-slate-400 p-1">${d}</td>
          <td class="border border-slate-400"></td><td class="border border-slate-400"></td><td class="border border-slate-400"></td>
          <td class="border border-slate-400"></td><td class="border border-slate-400"></td><td class="border border-slate-400"></td>
          <td class="border border-slate-400"></td><td class="border border-slate-400"></td><td class="border border-slate-400"></td>
        </tr>
          `,
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="flex gap-10 text-center mt-8">
      <div class="flex-1"></div>
      <div class="flex-1">
        <p>Diperiksa oleh</p>
        <div class="h-28"></div>
        <p class="border-b">${process.env.NEXT_PUBLIC_APP_PB_NAME}</p>
        <p>${process.env.NEXT_PUBLIC_APP_PB_POSITION}</p>
      </div>
  </div>
`;
};

const listBerkas = [
  "KTP Pemohon",
  "KTP Ahli waris",
  "KK Pemohon",
  "NPWP",
  "Surat Nikah",
  "Surat Kematian",
  "KARIP/Buku ASABRI",
  "Slip Gaji/Mutasi Rekening 3 bulan",
  "Simulasi Pembiayaan",
  "Form Permohonan",
  "Surat Keterangan Perbedaan Identitas",
  "Foto Debitur",
  "Analisa Pembiayaan",
  "Kartu Angsuran",
  "Perjanjian Kredit",
  "Surat Pernyataan DSR > 70%",
  "Surat Pernyataan dan Kesanggupan",
  "Surat Pernyataan Flagging",
  "Surat Keputusan Pensiun",
  "Bukti Pencairan Pembiayaan",
  "Tanda Terima Penyerahan Jaminan",
  "Surat Keterangan/Pernyataan Lainnya",
];
