import moment from "moment";
import { AnalisaPerhitungan } from "./Analisa";
import { IDapem } from "@/libs/IInterfaces";
import { JadwalAngsuran } from "./KartuAngsuran";
import { PerjanjianKredit } from "./PerjanjianKredit";
import { SPKDR } from "./SKPDR";
import { Flagging } from "./Flagging";
import { BuktiPencairan } from "./BuktiPencairan";
import { Pemotongan } from "./Pemotongan";
import { Kesanggupan } from "./Kesanggupan";
import { PenyerahanJaminan } from "./PenyerahanJaminan";
import { FormCeklist1 } from "./FormCeklist1";
import { PKDHMJB } from "./pkutils/PKHMJB";
import { PKDassa } from "./pkutils/PKDassa";

moment.locale("id");

const generateContractHtml = (record: IDapem) => {
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

      <div class="page" style="font-size: 12px;">
        ${AnalisaPerhitungan(record)}
      </div>

      <div class="page" style="font-size: 11px;">
        ${JadwalAngsuran(record, "DEBITUR")}
      </div>
      <div class="page" style="font-size: 11px;">
        ${JadwalAngsuran(record, record.ProdukPembiayaan.Sumdan.name)}
      </div>

      <div class="page text-justify" style="font-size: 12px;">
        ${record.ProdukPembiayaan.Sumdan.code === "BPR HMJB" ? PKDHMJB(record) : record.ProdukPembiayaan.Sumdan.code === "BPR DASSA" ? PKDassa(record) : ""}
        ${!["BPR HMJB", "BPR DASSA"].includes(record.ProdukPembiayaan.Sumdan.code) ? PerjanjianKredit(record) : ""}
      </div>

      <div class="page text-justify" style="font-size: 11px;">
        ${SPKDR(record)}
      </div>
      <div class="page text-justify" style="font-size: 11px;">
        ${Flagging(record)}
      </div>
      <div class="page text-justify" style="font-size: 11px;">
        ${BuktiPencairan(record, "DEBITUR")}
      </div>
      <div class="page text-justify" style="font-size: 11px;">
        ${BuktiPencairan(record, record.ProdukPembiayaan.Sumdan.name)}
      </div>
      <div class="page text-justify" style="font-size: 11px;">
        ${Pemotongan(record)}
      </div>
      <div class="page text-justify" style="font-size: 11px;">
        ${Kesanggupan(record, "DEBOTUR")}
      </div>
      <div class="page text-justify" style="font-size: 11px;">
        ${Kesanggupan(record, record.ProdukPembiayaan.Sumdan.name)}
      </div>
      <div class="page text-justify" style="font-size: 11px;">
        ${PenyerahanJaminan(record)}
      </div>
      <div class="page text-justify" style="font-size: 11px;">
        ${PenyerahanJaminan(record)}
      </div>
      <div class="page text-justify" style="font-size: 11px;">
        ${FormCeklist1(record)}
      </div>
      
    </body>
  </html>
  `;

  return html;
};

export const printContract = (record: IDapem) => {
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
