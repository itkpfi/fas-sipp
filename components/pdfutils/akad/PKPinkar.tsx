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

export const generateContractHtmlPinkar = (record: IPinjamanData) => {
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
  const createdText = `${NumberToWordsID(created.date())} ${created.format("MMMM YYYY")}`;

  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
        @page { size: A4; margin: 16mm 15mm 16mm 15mm; }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; background: #ffffff; }
        body {
          font-family: Cambria, Georgia, 'Times New Roman', serif;
          color: #111111;
          font-size: 15px;
          line-height: 1.8;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .page {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 0;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 22px;
          table-layout: fixed;
        }
        .header-table td {
          vertical-align: top;
        }
        .logo-cell {
          width: 90px;
          text-align: center;
        }
        .logo {
          width: 72px;
          height: 72px;
          object-fit: contain;
          display: inline-block;
        }
        .title-cell {
          text-align: center;
          padding: 0 10px;
        }
        .title-main {
          margin: 0;
          font-size: 18px;
          line-height: 1.35;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .3px;
        }
        .title-sub {
          margin: 4px 0 0;
          font-size: 16px;
          line-height: 1.4;
          font-weight: 700;
          text-decoration: underline;
        }
        p {
          margin: 0 0 10px;
          text-align: justify;
        }
        .party-block {
          margin-bottom: 12px;
        }
        .party-title {
          margin: 0 0 4px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .sections {
          margin-top: 18px;
        }
        .section {
          margin-top: 18px;
        }
        .section-title {
          margin: 0;
          text-align: center;
          font-weight: 700;
          text-transform: uppercase;
        }
        .section-subtitle {
          margin: 0 0 8px;
          text-align: center;
          font-weight: 700;
          text-transform: uppercase;
        }
        ol {
          margin: 8px 0 0 22px;
          padding: 0;
        }
        li {
          margin-bottom: 8px;
          text-align: justify;
        }
        .signature-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 64px;
          table-layout: fixed;
        }
        .signature-table td {
          width: 50%;
          text-align: center;
          vertical-align: top;
          font-weight: 700;
          text-transform: uppercase;
          padding: 0 20px;
        }
        .signature-role {
          margin: 0;
        }
        .materai {
          margin-top: 62px;
          text-align: left;
          font-size: 13px;
          font-weight: 400;
          text-transform: none;
        }
        .sign-name {
          margin-top: 58px;
          border-top: 1px solid #000;
          padding-top: 8px;
        }
        .sign-name-long {
          margin-top: 126px;
          border-top: 1px solid #000;
          padding-top: 8px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <table class="header-table">
          <tr>
            <td class="logo-cell">${logo ? `<img class="logo" src="${logo}" alt="Logo kiri" />` : `&nbsp;`}</td>
            <td class="title-cell">
              <p class="title-main">Perjanjian Kredit Pinjaman Anggota</p>
              <p class="title-sub">Nomor: ${contractNumber}</p>
            </td>
            <td class="logo-cell">${logo ? `<img class="logo" src="${logo}" alt="Logo kanan" />` : `&nbsp;`}</td>
          </tr>
        </table>

        <p>Pada hari ini, <b>${created.format("dddd DD-MM-YYYY")}</b> (${createdText}), telah dibuat dan ditandatangani perjanjian ini oleh dan antara:</p>

        <div class="party-block">
          <p class="party-title">Pihak Pertama</p>
          <p><b>Koperasi Jasa Fadillah Aqila Sejahtra</b>, beralamat di Perum Pondok Permai Lestari Blok G-4 No.9 – Bandung, dalam hal ini diwakili oleh <b>Eva Fajar Nurhasanah</b> selaku Ketua Koperasi. Selanjutnya dalam perjanjian ini disebut <b>PIHAK PERTAMA</b>.</p>
        </div>

        <div class="party-block">
          <p class="party-title">Pihak Kedua</p>
          <p><b>${memberName.toUpperCase()}</b>, beralamat di ${memberAddress}, dengan nomor identitas/NIP <b>${memberNip}</b> dan bernomor telepon <b>${memberPhone}</b>${memberPosition ? ` menjabat sebagai <b>${memberPosition}</b>` : ""}. Selanjutnya dalam perjanjian ini disebut <b>PIHAK KEDUA</b>.</p>
        </div>

        <div class="sections">
          <div class="section">
            <p class="section-title">Pasal 1</p>
            <p class="section-subtitle">Pemberian dan Jumlah Kredit</p>
            <ol>
              <li><b>PIHAK PERTAMA</b> dengan ini setuju memberikan pinjaman/kredit kepada <b>PIHAK KEDUA</b> dan <b>PIHAK KEDUA</b> setuju menerima pinjaman dari <b>PIHAK PERTAMA</b> sebesar <b>${formatCurrency(record.plafond)}</b> (${wrapTerbilangRupiah(record.plafond)}).</li>
              <li>Biaya-biaya: <b>PIHAK KEDUA</b> dikenakan biaya admin sebesar <b>${record.adminRate}%</b> dari jumlah pinjaman.</li>
              <li>Setiap bulannya <b>PIHAK KEDUA</b> wajib menyetorkan Simpanan Sukarela sebesar <b>Rp. 5.000</b> (Lima Ribu Rupiah).</li>
              <li>Tujuan penggunaan pinjaman ini adalah untuk <b>Konsumtif</b>.</li>
            </ol>
          </div>

          <div class="section">
            <p class="section-title">Pasal 2</p>
            <p class="section-subtitle">Jangka Waktu dan Bunga/Jasa</p>
            <ol>
              <li>Jangka Waktu Pinjaman: Pinjaman ini diberikan untuk jangka waktu <b>${record.tenor} bulan</b> (${NumberToWordsID(record.tenor)} bulan), terhitung mulai tanggal <b>${startDate}</b> sampai dengan tanggal <b>${endDate}</b>.</li>
              <li>Bunga/Jasa Pinjaman: Atas pinjaman ini, <b>PIHAK KEDUA</b> dikenakan bunga/jasa pinjaman sebesar <b>${record.marginRate}%</b> (${NumberToWordsID(record.marginRate)} persen) per tahun yang dihitung dari saldo pinjaman.</li>
            </ol>
          </div>

          <div class="section">
            <p class="section-title">Pasal 3</p>
            <p class="section-subtitle">Mekanisme Pembayaran Angsuran</p>
            <ol>
              <li><b>PIHAK KEDUA</b> wajib membayar kembali pokok pinjaman dan bunga/jasa secara angsuran setiap bulan.</li>
              <li>Jumlah Angsuran Per Bulan sebesar <b>${formatCurrency(record.angsuranPerBulan)}</b> (${wrapTerbilangRupiah(record.angsuranPerBulan)}).</li>
              <li>Tanggal Pembayaran: Angsuran wajib dibayarkan selambat-lambatnya pada tanggal <b>${payDay}</b> setiap bulannya.</li>
              <li>Cara Pembayaran: Pembayaran angsuran dapat dilakukan melalui pemotongan gaji ataupun transfer kepada <b>PIHAK PERTAMA</b>.</li>
            </ol>
          </div>

          <div class="section">
            <p class="section-title">Pasal 4</p>
            <p class="section-subtitle">Peristiwa Cidera Janji</p>
            <p><b>PIHAK KEDUA</b> dinyatakan cidera janji apabila:</p>
            <ol>
              <li>Tidak membayar angsuran selama 3 bulan berturut-turut.</li>
              <li>Menggunakan pinjaman tidak sesuai dengan tujuan yang disepakati.</li>
              <li>Memberikan keterangan palsu/tidak benar terkait data diri atau jaminan.</li>
              <li>Dalam kondisi cidera janji, <b>PIHAK PERTAMA</b> berhak seketika menagih seluruh sisa pokok pinjaman dan bunga/jasa yang belum dibayar sekaligus tanpa diperlukan teguran terlebih dahulu.</li>
            </ol>
          </div>

          <div class="section">
            <p class="section-title">Pasal 5</p>
            <p class="section-subtitle">Penyelesaian Perselisihan</p>
            <p>Apabila terjadi perselisihan dalam pelaksanaan perjanjian ini, para pihak sepakat untuk menyelesaikannya secara musyawarah untuk mufakat. Jika musyawarah tidak mencapai mufakat, maka para pihak sepakat untuk menyelesaikannya melalui Pengadilan Negeri.</p>
          </div>
        </div>

        <table class="signature-table">
          <tr>
            <td>
              <p class="signature-role">Pihak Kedua</p>
              <p class="signature-role">Penerima Pinjaman</p>
              <div class="materai">Materai 10.000</div>
              <div class="sign-name">${memberName.toUpperCase()}</div>
            </td>
            <td>
              <p class="signature-role">Pihak Pertama</p>
              <p class="signature-role">Pemberi Pinjaman</p>
              <div class="sign-name-long">EVA FAJAR NURHASANAH</div>
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>`;
};

export const printContractpinkar = (record: IPinjamanData) => {
  const htmlContent = generateContractHtmlPinkar(record);
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

const waitForIframeImages = async (doc: Document) => {
  const images = Array.from(doc.images || []);
  if (images.length === 0) return;

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }

          const done = () => resolve();
          img.addEventListener("load", done, { once: true });
          img.addEventListener("error", done, { once: true });
        }),
    ),
  );
};

export const downloadContractPdfPinkar = async (record: IPinjamanData) => {
  const html2pdf = (await import("html2pdf.js")).default;
  const htmlContent = generateContractHtmlPinkar(record);
  const memberNip = record.User?.nip || record.nip || "Berkas";
  const filename = `Template-Berkas-${memberNip}.pdf`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "794px";
  iframe.style.height = "1123px";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  try {
    const frameDoc = iframe.contentDocument;
    if (!frameDoc) {
      throw new Error("Dokumen iframe tidak tersedia");
    }

    frameDoc.open();
    frameDoc.write(htmlContent);
    frameDoc.close();

    await new Promise((resolve) => {
      iframe.onload = () => resolve(true);
      setTimeout(() => resolve(true), 300);
    });

    await waitForIframeImages(frameDoc);
    await new Promise((resolve) => setTimeout(resolve, 150));

    const exportTarget = frameDoc.body;
    if (!exportTarget || !exportTarget.innerText.trim()) {
      throw new Error("Konten kontrak kosong saat akan diexport");
    }

    await html2pdf()
      .set({
        margin: [0, 0, 0, 0],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 794,
          windowHeight: Math.max(exportTarget.scrollHeight, 1123),
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
      })
      .from(exportTarget)
      .save();
  } finally {
    iframe.remove();
  }
};
