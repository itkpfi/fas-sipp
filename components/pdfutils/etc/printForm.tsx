import moment from "moment";
import { IDapem } from "@/libs/IInterfaces";
import { FormPermohonan } from "./forms/formPermohonan";
import { FormDSR } from "./forms/formDSR";

moment.locale("id");

const generateForm = (record?: IDapem) => {
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
          margin: 1mm;
        }

        html, body {
          height: 100%;
          font-family: Cambria, Georgia, 'Times New Roman', Times, serif;
          font-size: 14px;
          text-align: justify;
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
              page-break-after: always;
            }
    
            .page .page-header {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              padding: 1px;
              text-align: center;
              background: white;
              border-bottom: 1px solid #ccc;
            }
          }
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed p-2">
      <div class="page" style="font-size: 11px;">
        ${FormPermohonan(record)}
      </div>
      <div class="page-break" style="font-size: 12px;margin: 10mm;">
        ${FormDSR(record)}
      </div>
    </body>
  </html>
  `;

  return html;
};

export const printForm = (record?: IDapem) => {
  const htmlContent = generateForm(record);

  const w = window.open("", "_blank", "width=900,height=1000");
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
