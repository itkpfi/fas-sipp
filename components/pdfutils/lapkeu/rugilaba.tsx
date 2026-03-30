import moment from "moment";
import { ICategoryOfAccount } from "@/libs/IInterfaces";
import { Header } from "../utils";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";

moment.locale("id");

const generate = (
  pendapatan: ICategoryOfAccount[],
  beban: ICategoryOfAccount[],
  periode?: string,
) => {
  const pend = pendapatan
    .flatMap((f) => f.JournalDetail)
    .reduce((acc, curr) => acc + curr.credit - curr.debit, 0);
  const beb = beban
    .flatMap((f) => f.JournalDetail)
    .reduce((acc, curr) => acc + curr.debit - curr.credit, 0);
  const html = `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        @page landscapePage {
          size: A4 landscape;
          margin: 10mm;
        }

        @page portraitPage {
          size: A4 portrait;
          margin: 10mm;
        }

        body {
          font-family: Cambria, Georgia, 'Times New Roman', Times, serif;
          font-size: 14px;
        }

        .page {
          page-break-after: always;
        }

        .landscape {
          page: landscapePage;
        }

        .portrait {
          page: portraitPage;
        }

        .page:last-child {
          page-break-after: auto;
        }

        @media print {
          .page {
            width: 100%;
            height: 100%;
          }
        }
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed">

      <div class="page portrait p-10">
        ${Header(
          "LAPORAN LABA/RUGI",
          process.env.NEXT_PUBLIC_APP_FULLNAME,
          periode
            ? `${moment(periode.split(",")[0]).format("DD-MM-YYYY")} - ${moment(
                periode.split(",")[1],
              ).format("DD-MM-YYYY")}`
            : `Periode yang berakhir pada ${moment().format("DD-MM-YYYY")}`,
          process.env.NEXT_PUBLIC_APP_LOGO,
          process.env.NEXT_PUBLIC_APP_LOGO,
        )}

        <div class="border p-5">
          <div>
            <p class="font-bold">PENDAPATAN</p>
            <div class="ml-4">
            ${pendapatan
              .map(
                (d) =>
                  `<div class="flex justify-between border-b border-dashed">
                    <p>${d.name}</p>
                    <p class="text-right">${IDRFormat(d.JournalDetail.reduce((acc, curr) => acc + curr.credit - curr.debit, 0))}</p>
                  </div>`,
              )
              .join("")}
            </div>
            <div class="flex justify-between font-bold">
              <p>TOTAL PENDAPATAN</p>
              <p class="text-right">${IDRFormat(pend)}</p>
            </div>
          </div>

          <div class="my-5"></div>

          <div >
            <p class="font-bold">BEBAN</p>
            <div class="ml-4">
              ${beban
                .map(
                  (d) =>
                    `<div class="flex justify-between border-b border-dashed">
                    <p>${d.name}</p>
                    <p class="text-right">${IDRFormat(d.JournalDetail.reduce((acc, curr) => acc + curr.debit - curr.credit, 0))}</p>
                  </div>`,
                )
                .join("")}
            </div>
            <div class="flex justify-between font-bold ">
              <p>TOTAL BEBAN</p>
              <p class="text-right">${IDRFormat(beb)}</p>
            </div>
            <div class="flex justify-between font-bold mt-3 border-t">
              <p>SISA HASIL USAHA (SHU)</p>
              <p class="text-right">${IDRFormat(pend - beb)}</p>
            </div>
          </div>
        </div>

      </div>

    </body>
  </html>
  `;

  return html;
};

export const printRL = (
  pendapatan: ICategoryOfAccount[],
  beban: ICategoryOfAccount[],
  periode?: string,
) => {
  const htmlContent = generate(pendapatan, beban, periode);

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
