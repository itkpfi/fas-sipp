import moment from "moment";
import { IDapem } from "@/libs/IInterfaces";
import { Header } from "../utils";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";
import { Sumdan } from "@prisma/client";

moment.locale("id");

const getEffectiveDroppingStatus = (record: IDapem) => {
  if (record.approv_status !== "APPROVED") {
    if (["PROCCESS", "APPROVED", "PAID_OFF"].includes(record.dropping_status)) {
      return "PENDING";
    }
  }

  return record.dropping_status;
};

const generateMonitoring = (
  records: IDapem[],
  sumdans: Sumdan[],
  periode?: string,
) => {
  const totalQueueRecords = records.filter((record) =>
    ["DRAFT", "PENDING"].includes(getEffectiveDroppingStatus(record)),
  );
  const totalFinalRecords = records.filter(
    (record) =>
      record.approv_status === "APPROVED" &&
      ["PROCCESS", "APPROVED", "PAID_OFF"].includes(getEffectiveDroppingStatus(record)),
  );
  const totalDroppingRecords = records.filter(
    (record) =>
      record.approv_status === "APPROVED" &&
      getEffectiveDroppingStatus(record) === "APPROVED",
  );

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
              padding-top: 80px;    /* ruang untuk header */
              page-break-after: always;
            }
    
            .page .page-header {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              padding: 10px;
              text-align: center;
              background: white;
              border-bottom: 1px solid #ccc;
            }
          }
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed p-4 max-w-200">

    <div class="page" style="font-size: 12px;">
      ${Header("REKAP MONITORING PEMBIAYAAN", `${periode ? `${moment(periode[0]).format("DD MMMM YYYY")} - ${moment(periode[1]).format("DD MMMM YYYY")}` : ""}`, undefined, process.env.NEXT_PUBLIC_APP_LOGO, process.env.NEXT_PUBLIC_APP_LOGO)}
      <div class="my-4 flex justify-evenly gap-4 flex-wrap">
        <div class="font-bold flex-1 border rounded p-2">
          <p class="opacity-70">TOTAL PERMOHONAN</p>
          <p class="text-lg">Rp. ${IDRFormat(records.reduce((acc, curr) => acc + curr.plafond, 0))}</p>
          <div class="border-t border-gray-100 my-1"></div>
          <p class="text-lg">NOA ${records.length}</p>
        </div>
        <div class="font-bold text-yellow-500 flex-1 border rounded p-2">
          <p class="opacity-70">ANTRIAN</p>
          <p class="text-lg">Rp. ${IDRFormat(totalQueueRecords.reduce((acc, curr) => acc + curr.plafond, 0))}</p>
          <div class="border-t border-gray-100 my-1"></div>
          <p class="text-lg">NOA ${totalQueueRecords.length}</p>
        </div>
        <div class="font-bold text-blue-500 flex-1 border rounded p-2">
          <p class="opacity-70">FINAL APPROVED</p>
          <p class="text-lg">Rp. ${IDRFormat(totalFinalRecords.reduce((acc, curr) => acc + curr.plafond, 0))}</p>
          <div class="border-t border-gray-100 my-1"></div>
          <p class="text-lg">NOA ${totalFinalRecords.length}</p>
        </div>
        <div class="font-bold text-green-500 flex-1 border rounded p-2">
          <p class="opacity-70">DROPPING</p>
          <p class="text-lg">Rp. ${IDRFormat(totalDroppingRecords.reduce((acc, curr) => acc + curr.plafond, 0))}</p>
          <div class="border-t border-gray-100 my-1"></div>
          <p class="text-lg">NOA ${totalDroppingRecords.length}</p>
        </div>
      </div>

      <div>
        <div class="my-2 font-bold italic text-lg">
          <p>List Account :</p>
        </div>

        <table class="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr class="bg-gray-200">
              <th class="border border-gray-400 p-2">NO</th>
              <th class="border border-gray-400 p-2">NAMA PEMOHON</th>
              <th class="border border-gray-400 p-2">PLAFOND</th>
              <th class="border border-gray-400 p-2">JANGKA WAKTU</th>
              <th class="border border-gray-400 p-2">STATUS</th>
              <th class="border border-gray-400 p-2">MITRA</th>
              <th class="border border-gray-400 p-2">TGL PENGAJUAN</th>
            </tr>
          </thead>
          <tbody>
            ${records
              .sort((a, b) =>
                getEffectiveDroppingStatus(a).localeCompare(getEffectiveDroppingStatus(b)),
              )
              .map(
                (r, i) => `
              <tr>
                <td class="border border-gray-400 p-2">${i + 1}</td>
                <td class="border border-gray-400 p-2">
                  <div>
                    <div>${r.Debitur.fullname}</div>
                    <div class="text-xs opacity-70">${r.Debitur.nopen}</div>
                  </div>
                </td>
                <td class="border border-gray-400 p-2">${IDRFormat(r.plafond)}</td>
                <td class="border border-gray-400 p-2">${r.tenor} Bln</td>
              <td class="border border-gray-400 p-2">${getEffectiveDroppingStatus(r)}</td>
              <td class="border border-gray-400 p-2">${r.ProdukPembiayaan.Sumdan.code}</td>
                <td class="border border-gray-400 p-2">${moment(r.created_at).format("DD MMM YYYY")}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>

    <div class="page" style="font-size: 12px;">
      ${Header("REKAP MONITORING PEMBIAYAAN", `${periode ? `${moment(periode[0]).format("DD MMMM YYYY")} - ${moment(periode[1]).format("DD MMMM YYYY")}` : ""}`, undefined, process.env.NEXT_PUBLIC_APP_LOGO, process.env.NEXT_PUBLIC_APP_LOGO)}

      <div class="my-4">
        ${sumdans
          .map(
            (s) => `
          <div class="my-6">
            <table class="w-full border-collapse border border-gray-400 text-sm mb-4">
              <caption class="caption-top text-left font-semibold text-base mb-2">
                ${s.name} (${s.code})
              </caption>
              <thead>
                <tr class="bg-gray-200">
                  <th class="border border-gray-400 p-2">NO</th>
                  <th class="border border-gray-400 p-2">NAMA PEMOHON</th>
                  <th class="border border-gray-400 p-2">PLAFOND</th>
                  <th class="border border-gray-400 p-2">JANGKA WAKTU</th>
                  <th class="border border-gray-400 p-2">STATUS</th>
                  <th class="border border-gray-400 p-2">MITRA</th>
                  <th class="border border-gray-400 p-2">TGL PENGAJUAN</th>
                </tr>
              </thead>
              <tbody>
                ${records
                  .filter((r) => r.ProdukPembiayaan.sumdanId === s.id)
                  .sort((a, b) =>
                    getEffectiveDroppingStatus(a).localeCompare(getEffectiveDroppingStatus(b)),
                  )
                  .map(
                    (r, i) => `
                  <tr>
                    <td class="border border-gray-400 p-2">${i + 1}</td>
                    <td class="border border-gray-400 p-2">
                      <div>
                        <div>${r.Debitur.fullname}</div>
                        <div class="text-xs opacity-70">${r.Debitur.nopen}</div>
                      </div>
                    </td>
                    <td class="border border-gray-400 p-2">${IDRFormat(r.plafond)}</td>
                    <td class="border border-gray-400 p-2">${r.tenor} Bln</td>
                    <td class="border border-gray-400 p-2">${getEffectiveDroppingStatus(r)}</td>
                    <td class="border border-gray-400 p-2">${r.ProdukPembiayaan.Sumdan.code}</td>
                    <td class="border border-gray-400 p-2">
                      ${moment(r.created_at).format("DD MMM YYYY")}
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr class="bg-gray-100 font-semibold italic">
                  <td
                    colspan="2"
                    class="border border-gray-400 p-2 text-right"
                  >
                    SUMMARY
                  </td>
                  <td class="border border-gray-400 p-2">
                    ${IDRFormat(records.filter((r) => r.ProdukPembiayaan.sumdanId === s.id).reduce((acc, curr) => acc + curr.plafond, 0))}
                  </td>
                  <td colspan="4" class="border border-gray-400 p-2"></td>
                </tr>
              </tfoot>
            </table>

            <div class="italic text-sm border-b border-gray-400">
              <div class="flex gap-4">
                <div class="w-32">ANTRIAN</div>
                <div class="w-4">:</div>
                <div>${(() => {
                  const data = records.filter(
                    (r) =>
                      r.ProdukPembiayaan.sumdanId === s.id &&
                      ["DRAFT", "PENDING"].includes(getEffectiveDroppingStatus(r)),
                  );
                  return `Rp. ${IDRFormat(data.reduce((acc, curr) => acc + curr.plafond, 0))} (NOA ${data.length})`;
                })()}</div>
              </div>
              <div class="flex gap-4">
                <div class="w-32">FINAL</div>
                <div class="w-4">:</div>
                <div>${(() => {
                  const data = records.filter(
                    (r) =>
                      r.ProdukPembiayaan.sumdanId === s.id &&
                      r.approv_status === "APPROVED" &&
                      ["PROCCESS", "APPROVED", "PAID_OFF"].includes(getEffectiveDroppingStatus(r)),
                  );
                  return `Rp. ${IDRFormat(data.reduce((acc, curr) => acc + curr.plafond, 0))} (NOA ${data.length})`;
                })()}</div>
              </div>
              <div class="flex gap-4">
                <div class="w-32">DROPPING</div>
                <div class="w-4">:</div>
                <div>${(() => {
                  const data = records.filter(
                    (r) =>
                      r.ProdukPembiayaan.sumdanId === s.id &&
                      r.approv_status === "APPROVED" &&
                      getEffectiveDroppingStatus(r) === "APPROVED",
                  );
                  return `Rp. ${IDRFormat(data.reduce((acc, curr) => acc + curr.plafond, 0))} (NOA ${data.length})`;
                })()}</div>
              </div>
            </div>

          </div>
          `,
          )
          .join("")}
      </div>

    </div>

    </body>
  </html>
  `;

  return html;
};

export const printMonitoring = (
  record: IDapem[],
  sumdans: Sumdan[],
  periode?: string,
) => {
  const htmlContent = generateMonitoring(record, sumdans, periode);

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
