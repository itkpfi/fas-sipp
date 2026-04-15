import moment from "moment";
import { IDropping } from "@/libs/IInterfaces";
import { Header, PrintTableStyles } from "../utils";
import { IDRFormat } from "@/components/utils/PembiayaanUtil";

moment.locale("id");

const generateSI = (record: IDropping) => {
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

          ${PrintTableStyles}
      </style>
    </head>
    <body class="bg-white text-gray-800 leading-relaxed p-4 max-w-200">

    <div class="page" style="font-size: 12px;">
      ${Header("PERMOHONAN DROPPING DANA PENCAIRAN", record.id, undefined, process.env.NEXT_PUBLIC_APP_LOGO, record.Sumdan.logo)}

      <div class="my-4">
        <div class="flex gap-3">
          <p class="w-44">No</p>
          <p class="w-4">:</p>
          <p class="flex-1">${record.id}</p>
        </div>
        <div class="flex gap-3">
          <p class="w-44">Lampiran</p>
          <p class="w-4">:</p>
          <p class="flex-1">1 Lembar</p>
        </div>
        <div class="flex gap-3">
          <p class="w-44">Perihal</p>
          <p class="w-4">:</p>
          <p class="flex-1">Permohonan Dropping Dana Pencairan Pembiayaan Pensiun</p>
        </div>
      </div>

      <div class="mt-4">
        <p>Kepada Yth</p>
        <p class="font-bold">Direktur ${record.Sumdan.name}</p>
        <p>Di tempat</p>
      </div>
      <div class="mt-2">
        <p>Sehubungan dengan telah disetujuinya pembiayaan pensiun oleh Komite Bank, bersama ini kami menyampaikan permohonan kepada ${record.Sumdan.name} untuk melakukan dropping dana pencairan pembiayaan dengan rincian sebagai berikut :</p>
        
        <div class="mt-4 flex gap-2 ml-3">
          <p class="w-44">Jumlah Debitur</p>
          <p class="w-4">:</p>
          <p class="flex-1">${record.Dapem.length}</p>
        </div>
        <div class="flex gap-2 ml-3">
          <p class="w-44">Jumlah Plafond</p>
          <p class="w-4">:</p>
          <p class="flex-1">${IDRFormat(record.Dapem.reduce((acc, curr) => acc + curr.plafond, 0))}</p>
        </div>
        <div class="mb-4 flex gap-2 ml-3">
          <p class="w-44">Jumlah Dropping</p>
          <p class="w-4">:</p>
          <p class="flex-1">${IDRFormat(record.Dapem.reduce((acc, curr) => acc + curr.plafond - (curr.plafond * (curr.c_adm_sumdan / 100) + curr.c_account), 0))}</p>
        </div>

        <p>Sehubungan dengan hal tersebut, kami menginstruksikan kepada ${record.Sumdan.name} untuk melakukan pencairan (dropping) dana sebesar tersebut di atas ke rekening berikut :</p>

        <div class="mt-4 flex gap-2 ml-3">
          <p class="w-44">Nama Rekening</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_NAME}</p>
        </div>
        <div class="flex gap-2 ml-3">
          <p class="w-44">Nomor Rekening</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_NUMBER}</p>
        </div>
        <div class="mb-4 flex gap-2 ml-3">
          <p class="w-44">Bank</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_BANK}</p>
        </div>

        <p>Instruksi ini dibuat berdasarkan persetujuan Komite Bank dan menjadi dasar pelaksanaan pencairan dana.</p>
        <p>Demikian Standing Instruction ini kami sampaikan untuk dapat diproses sebagaimana mestinya. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.</p>
      </div>

      <div class="mt-20 flex justify-end">
        <div class="w-96 text-center">
          <p>${process.env.NEXT_PUBLIC_APP_COMPANY_CITY}, ${moment(record.created_at).format("DD-MM-YYYY")}</p>
          <p>${process.env.NEXT_PUBLIC_APP_COMPANY_NAME?.toUpperCase()}</p>
          <div class="h-28"></div>
          <p class="border-b">${process.env.NEXT_PUBLIC_APP_SI_NAME}</p>
          <p>${process.env.NEXT_PUBLIC_APP_SI_POSITION}</p>
        </div>
      </div>

    </div>

    <div class="page" style="font-size: 12px;">
      ${Header("LAMPIRAN PERMOHONAN DROPPING", record.id, undefined, process.env.NEXT_PUBLIC_APP_LOGO, record.Sumdan.logo)}


      <div class="mt-20">
        <div class="print-table-wrap">
        <table class="print-table">
          <thead>
            <tr>
              <th class="text-center">NO</th>
              <th>Debitur</th>
              <th class="text-right">Plafond</th>
              <th class="text-right">Adm Bank</th>
              <th class="text-right">Buka Tabungan</th>
              <th class="text-right">Dropping</th>
            </tr>
          </thead>
          <tbody>
            ${record.Dapem.map(
              (r, i) => `
              <tr>
                <td class="text-center">${i + 1}</td>
                <td>
                  <div>
                    ${r.Debitur.fullname}
                  </div>
                  <div class="text-muted">
                    ${r.Debitur.nopen}
                  </div>
                </td>
                <td class="text-right">${IDRFormat(r.plafond)}</td>
                <td class="text-right">${IDRFormat(r.plafond * (r.c_adm_sumdan / 100))}</td>
                <td class="text-right">${IDRFormat(r.c_account)}</td>
                <td class="text-right">${IDRFormat(r.plafond - (r.plafond * (r.c_adm_sumdan / 100) + r.c_account))}</td>
              </tr>
            `,
            ).join("")}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="text-center">
                JUMLAH
              </td>
              <td class="text-right">
                ${IDRFormat(record.Dapem.reduce((acc, curr) => acc + curr.plafond, 0))}
              </td>
              <td class="text-right">
                ${IDRFormat(record.Dapem.reduce((acc, curr) => acc + curr.plafond * (curr.c_adm_sumdan / 100), 0))}
              </td>
              <td class="text-right">
                ${IDRFormat(record.Dapem.reduce((acc, curr) => acc + curr.c_account, 0))}
              </td>
              <td class="text-right">
                ${IDRFormat(record.Dapem.reduce((acc, curr) => acc + (curr.plafond - (curr.plafond * (curr.c_adm_sumdan / 100) + curr.c_account)), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
        </div>
      </div>

      <div class="mt-20 flex justify-end">
        <div class="w-96 text-center">
          <p>${process.env.NEXT_PUBLIC_APP_COMPANY_CITY}, ${moment(record.created_at).format("DD-MM-YYYY")}</p>
          <p>${process.env.NEXT_PUBLIC_APP_COMPANY_NAME?.toUpperCase()}</p>
          <div class="h-28"></div>
          <p class="border-b">${process.env.NEXT_PUBLIC_APP_SI_NAME}</p>
          <p>${process.env.NEXT_PUBLIC_APP_SI_POSITION}</p>
        </div>
      </div>
    </div>

    </body>
  </html>
  `;

  return html;
};

export const printSIStandar = (record: IDropping) => {
  const htmlContent = generateSI(record);

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
