import { NumberToWordsID } from "../utils";
import moment from "moment";
import { IUser } from "@/libs/IInterfaces";

moment.locale("id");

interface IPinjamanData {
  id: string;
  userId: string | null;
  User: IUser | null;
  nip?: string | null;
  fullname?: string | null;
  phone?: string | null;
  address?: string | null;
  Position?: string | null;
  plafond: number;
  tenor: number;
  marginRate: number;
  adminRate: number;
  biayaAdmin: number;
  terimaBersih: number;
  totalMargin: number;
  totalBayar: number;
  angsuranPerBulan: number;
  berkasFileUrl: string | null;
  akadFileUrl: string | null;
  scheduleJson: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

interface IAngsuranRow {
  no: number;
  tanggal: string;
}

const getRomanMonth = (date: moment.Moment) => {
  const romans = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return romans[date.month()] || "-";
};

const formatCurrency = (amount: number) =>
  `Rp. ${Math.round(amount).toLocaleString("id-ID")}`;

const wrapTerbilangRupiah = (amount: number) => `${NumberToWordsID(Math.round(amount))} Rupiah`;

const parseSchedule = (scheduleJson: string): IAngsuranRow[] => {
  try {
    return JSON.parse(scheduleJson) as IAngsuranRow[];
  } catch {
    return [];
  }
};

const generateContractHtml = (record: IPinjamanData) => {
  const created = moment(record.created_at);
  const schedule = parseSchedule(record.scheduleJson);
  const memberName = record.User?.fullname || record.fullname || "-";
  const memberNip = record.User?.nip || record.nip || "-";
  const memberPhone = record.User?.phone || record.phone || "-";
  const memberAddress = record.User?.address || record.address || "-";
  const memberPosition = record.User?.position || record.Position || "Karyawan";
  const contractNumber = `001/FAS/${getRomanMonth(created)}/${created.format("YYYY")}`;
  const startDate = schedule[0]?.tanggal || created.format("DD-MM-YYYY");
  const endDate =
    schedule[schedule.length - 1]?.tanggal ||
    created.clone().add(record.tenor, "month").format("DD-MM-YYYY");
  const payDay = schedule[0]?.tanggal?.slice(0, 2) || created.format("DD");
  const logo = process.env.NEXT_PUBLIC_APP_LOGO || "";

  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
        @page { size: A4; margin: 18mm; }
        body { font-family: Cambria, Georgia, 'Times New Roman', serif; color: #111; font-size: 15px; line-height: 1.8; }
        .page { max-width: 760px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .title { text-align: center; flex: 1; padding: 0 12px; }
        .title h1 { margin: 0; font-size: 18px; text-transform: uppercase; }
        .title h2 { margin: 4px 0 0; font-size: 16px; text-decoration: underline; }
        .logo { width: 72px; height: 72px; object-fit: contain; }
        p { margin: 0 0 10px; text-align: justify; }
        .section-title { text-align: center; font-weight: bold; text-transform: uppercase; margin: 18px 0 0; }
        ol { margin: 8px 0 0 22px; padding: 0; }
        li { margin-bottom: 8px; text-align: justify; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 80px; text-align: center; font-weight: bold; text-transform: uppercase; }
        .materai { margin-top: 60px; text-align: left; font-size: 13px; font-weight: normal; text-transform: none; }
        .sign-name { margin-top: 55px; padding-top: 8px; border-top: 1px solid #000; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          ${logo ? `<img class="logo" src="${logo}" alt="Logo kiri" />` : `<div class="logo"></div>`}
          <div class="title">
            <h1>Perjanjian Kredit Pinjaman Anggota</h1>
            <h2>Nomor: ${contractNumber}</h2>
          </div>
          ${logo ? `<img class="logo" src="${logo}" alt="Logo kanan" />` : `<div class="logo"></div>`}
        </div>

        <p>Pada hari ini, <b>${created.format("dddd DD-MM-YYYY")}</b>, telah dibuat dan ditandatangani perjanjian ini oleh dan antara:</p>

        <p><b>PIHAK PERTAMA</b><br />
        <b>Koperasi Jasa Fadillah Aqila Sejahtra</b>, beralamat di Perum Pondok Permai Lestari Blok G-4 No.9 – Bandung, dalam hal ini diwakili oleh <b>Eva Fajar Nurhasanah</b> selaku Ketua Koperasi. Selanjutnya dalam perjanjian ini disebut <b>PIHAK PERTAMA</b>.</p>

        <p><b>PIHAK KEDUA</b><br />
        <b>${memberName.toUpperCase()}</b>, beralamat di ${memberAddress}, dengan nomor identitas/NIP <b>${memberNip}</b> dan bernomor telepon <b>${memberPhone}</b> menjabat sebagai <b>${memberPosition}</b>. Selanjutnya dalam perjanjian ini disebut <b>PIHAK KEDUA</b>.</p>

        <div class="section-title">Pasal 1</div>
        <div class="section-title">Pemberian dan Jumlah Kredit</div>
        <ol>
          <li><b>PIHAK PERTAMA</b> dengan ini setuju memberikan pinjaman/kredit kepada <b>PIHAK KEDUA</b> dan <b>PIHAK KEDUA</b> setuju menerima pinjaman dari <b>PIHAK PERTAMA</b> sebesar <b>${formatCurrency(record.plafond)}</b> (${wrapTerbilangRupiah(record.plafond)}).</li>
          <li>Biaya-biaya: <b>PIHAK KEDUA</b> dikenakan biaya admin sebesar <b>${record.adminRate}%</b> dari jumlah pinjaman.</li>
          <li>Setiap bulannya <b>PIHAK KEDUA</b> wajib menyetorkan Simpanan Sukarela sebesar <b>Rp. 5.000</b> (Lima Ribu Rupiah).</li>
          <li>Tujuan penggunaan pinjaman ini adalah untuk <b>Konsumtif</b>.</li>
        </ol>

        <div class="section-title">Pasal 2</div>
        <div class="section-title">Jangka Waktu dan Bunga/Jasa</div>
        <ol>
          <li>Jangka Waktu Pinjaman: Pinjaman ini diberikan untuk jangka waktu <b>${record.tenor} bulan</b> (${NumberToWordsID(record.tenor)} bulan), terhitung mulai tanggal <b>${startDate}</b> sampai dengan tanggal <b>${endDate}</b>.</li>
          <li>Bunga/Jasa Pinjaman: Atas pinjaman ini, <b>PIHAK KEDUA</b> dikenakan bunga/jasa pinjaman sebesar <b>${record.marginRate}%</b> (${NumberToWordsID(record.marginRate)} persen) per tahun yang dihitung dari saldo pinjaman.</li>
        </ol>

        <div class="section-title">Pasal 3</div>
        <div class="section-title">Mekanisme Pembayaran Angsuran</div>
        <ol>
          <li><b>PIHAK KEDUA</b> wajib membayar kembali pokok pinjaman dan bunga/jasa secara angsuran setiap bulan.</li>
          <li>Jumlah Angsuran Per Bulan sebesar <b>${formatCurrency(record.angsuranPerBulan)}</b> (${wrapTerbilangRupiah(record.angsuranPerBulan)}).</li>
          <li>Tanggal Pembayaran: Angsuran wajib dibayarkan selambat-lambatnya pada tanggal <b>${payDay}</b> setiap bulannya.</li>
          <li>Cara Pembayaran: Pembayaran angsuran dapat dilakukan melalui pemotongan gaji ataupun transfer kepada <b>PIHAK PERTAMA</b>.</li>
        </ol>

        <div class="section-title">Pasal 4</div>
        <div class="section-title">Peristiwa Cidera Janji</div>
        <p><b>PIHAK KEDUA</b> dinyatakan cidera janji apabila:</p>
        <ol>
          <li>Tidak membayar angsuran selama 3 bulan berturut-turut.</li>
          <li>Menggunakan pinjaman tidak sesuai dengan tujuan yang disepakati.</li>
          <li>Memberikan keterangan palsu/tidak benar terkait data diri atau jaminan.</li>
          <li>Dalam kondisi cidera janji, <b>PIHAK PERTAMA</b> berhak seketika menagih seluruh sisa pokok pinjaman dan bunga/jasa yang belum dibayar sekaligus tanpa diperlukan teguran terlebih dahulu.</li>
        </ol>

        <div class="section-title">Pasal 5</div>
        <div class="section-title">Penyelesaian Perselisihan</div>
        <p>Apabila terjadi perselisihan dalam pelaksanaan perjanjian ini, para pihak sepakat untuk menyelesaikannya secara musyawarah untuk mufakat. Jika musyawarah tidak mencapai mufakat, maka para pihak sepakat untuk menyelesaikannya melalui Pengadilan Negeri.</p>

        <div class="signatures">
          <div>
            <div>Pihak Kedua</div>
            <div>Penerima Pinjaman</div>
            <div class="materai">Materai 10.000</div>
            <div class="sign-name">${memberName.toUpperCase()}</div>
          </div>
          <div>
            <div>Pihak Pertama</div>
            <div>Pemberi Pinjaman</div>
            <div class="sign-name" style="margin-top: 108px;">EVA FAJAR NURHASANAH</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

export const printContractpinkar = (record: IPinjamanData) => {
  const htmlContent = generateContractHtml(record);
  const w = window.open("", "_blank");
  if (!w) {
    alert("Popup diblokir. Mohon izinkan popup dari situs ini.");
    return;
  }

  w.document.open();
  w.document.write(htmlContent);
  w.document.close();
  w.onload = function () {
    setTimeout(() => {
      w.print();
    }, 200);
  };
};
