import moment from "moment";
import { Header } from "../utils";
import { IUser } from "@/libs/IInterfaces";

moment.locale("id");
interface IPinjamanData {
  id: string;
  userId: string | null;
  User: IUser | null;
  nip?: string | null; // Deprecated: use User.nip
  fullname?: string | null; // Deprecated: use User.fullname
  phone?: string | null; // Deprecated: use User.phone
  address?: string | null; // Deprecated: use User.address
  Position?: string | null; // Deprecated: use User.position
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
  angsuran: number;
  margin: number;
  pokok: number;
  sisaPokok: number;
}

const generateContractHtml = (record: IPinjamanData) => {
  // Get user info from relation, fallback to deprecated fields
  const fullname = record.User?.fullname || record.fullname || "";
  const nip = record.User?.nip || record.nip || "";
  const phone = record.User?.phone || record.phone || "";
  const address = record.User?.address || record.address || "";
  const position = record.User?.position || record.Position || "";

  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page {
          size: A4;
          margin: 15mm;
        }

        html, body {
          height: 100%;
          font-family: Cambria, Georgia, 'Times New Roman', Times, serif;
          font-size: 14px;
        }

        /* Pemisah halaman */
        .page-break {
          page-break-before: always;
          break-before: page;
          display: block;
          height: 0;
          border: none;
        }
          @media print {
            .page {
              position: relative;
              min-height: 95vh;    /* atau height A4 jika untuk print */
              padding-top: 70px;    /* ruang untuk header */
              page-break-after: always;
            }
    
            .page .page-header {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              padding: 5px;
              text-align: center;
              background: white;
              border-bottom: 1px solid #ccc;
            }
          }
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed p-4 max-w-200">

      <div class="page text-justify" style="font-size: 12px;">
        ${Header("PERJANJIAN KREDIT (AKAD) PINKAR", fullname, nip, moment(record.created_at).format("DD MMMM YYYY"))}
        Pada hari ini, ${moment(record.created_at).format("DD MMMM YYYY")}, telah dibuat dan ditandatangani perjanjian ini oleh dan antara:<br/>
        <strong>PIHAK PERTAMA</strong><br/>
        Koperasi Jasa Fadillah Aqila Sejahtra, Beralamat di Perum Pondok Permai Lestari Blok G-4 No.9 - Bandung, dalam hal ini diwakili oleh <strong>Eva Fajar Nurhasanah</strong> selaku Ketua Koperasi.
        Selanjutnya dalam Perjanjian ini disebut <strong>PIHAK PERTAMA</strong></br>
        <p><strong>PIHAK KEDUA</strong>
        </strong>${fullname}</strong> beralamat di ${address} dengan nomor identitas/NIP ${nip} dan bernomor telepon ${phone} menjabat sebagai ${position} Koperasi Jasa Fadillah Aqila Sejahtra. Selanjutnya dalam Perjanjian ini disebut <strong>PIHAK KEDUA</strong>

        <p class="mt-4">
      </div>
      
    </body>
  </html>
  `;

  return html;
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
