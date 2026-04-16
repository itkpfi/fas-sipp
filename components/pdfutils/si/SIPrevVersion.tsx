import moment from "moment";
import { IDropping } from "@/libs/IInterfaces";
import { Header, PrintTableStyles } from "../utils";
import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";

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
          <p class="flex-1">1 (Satu) Daftar Permohonan Dropping</p>
        </div>
        <div class="flex gap-3">
          <p class="w-44">Perihal</p>
          <p class="w-4">:</p>
          <p class="flex-1">Permohonan Dropping Dana Pembiayaan Pensiun Periode ${moment(record.created_at).format("MMMM")} Tahun, ${moment(record.created_at).format("YYYY")}</p>
        </div>
      </div>

      <div class="mt-4">
        <p>Kepada Yth</p>
        <p class="font-bold">Direktur ${record.Sumdan.name}</p>
        <p>Di tempat</p>
      </div>
      <div class="mt-2">
        <p>Bersama surat ini kami ajukan permohonan pencairan dan pemindahbukuan atas pengajuan yang sudah disetujui oleh komite bank. Adapun rekap
dropping tersebut kami sampaikan sebagai berikut:</p>
        
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

        <p>Rincian data kami lampirkan bersama dengan surat ini.</p>
<p>Dana tersebut pada butir 2. diatas mohon dapat disetorkan/ ditransfer kepada kami di::</p>

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

        <p>Demikian kami sampaikan dan atas perhatian serta kerjasama yang terjalin baik selama ini diucapkan terima kasih.</p>
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

  <div class="mt-4 flex gap-2 ml-3">
          <p class="w-44">No Surat</p>
          <p class="w-4">:</p>
          <p class="flex-1">${record.id}</p>
        </div>
        <div class="flex gap-2 ml-3">
          <p class="w-44">No Rekening</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_NUMBER}</p>
        </div>
        <div class="flex gap-2 ml-3">
          <p class="w-44">Atas Nama</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_NAME}</p>
        </div>
        <div class="flex gap-2 ml-3">
          <p class="w-44">Nama Bank</p>
          <p class="w-4">:</p>
          <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ACCOUNT_BANK}</p>
        </div>
      <div class="mt-20">
        <div class="print-table-wrap">
        <table class="print-table">
  <thead>
    <tr>
      <th class="text-center">NO</th>
      <th class="text-right">Nopen</th>
      <th>Nama Debitur</th>
      <th class="text-right">Jenis Produk</th>
      <th class="text-right">Plafond</th>
      <th class="text-right">Adm Bank</th>
      <th class="text-right">Pembukaan Rekening(Rp)</th>
      <th class="text-right">Blokir Angsuran(Rp)</th>
      <th class="text-right">Dropping Koperasi</th>
    </tr>
  </thead>
  <tbody>
    ${record.Dapem.map((r, i) => {
      // Kita hitung variabel bantuan agar lebih rapi dan mudah dibaca
      const admBank = r.plafond * (r.c_adm_sumdan / 100);
      const angsuranInfo = GetAngsuran(
        r.plafond,
        r.tenor,
        r.c_margin + r.c_margin_sumdan,
        r.margin_type,
        r.rounded,
      );
      const totalBlokir = angsuranInfo.angsuran * r.c_blokir;
      const dropping = r.plafond - (admBank + r.c_account + totalBlokir);

      return `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td><div>${r.Debitur.nopen}</div></td>
        <td class="text-right">${r.Debitur.fullname}</td>
        <td class="text-right">${r.JenisPembiayaan.name}</td>
        <td class="text-right">${IDRFormat(r.plafond)}</td>
        <td class="text-right">${IDRFormat(admBank)}</td>
        <td class="text-right">${IDRFormat(r.c_account)}</td>
        <td class="text-right">${IDRFormat(totalBlokir)}</td>
        <td class="text-right">${IDRFormat(dropping)}</td>
      </tr>
      `;
    }).join("")}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="4" class="text-center"><b>JUMLAH</b></td>
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
        ${IDRFormat(
          record.Dapem.reduce((acc, curr) => {
            const angsuran = GetAngsuran(
              curr.plafond,
              curr.tenor,
              curr.c_margin + curr.c_margin_sumdan,
              curr.margin_type,
              curr.rounded,
            ).angsuran;
            return acc + angsuran * curr.c_blokir;
          }, 0),
        )}
      </td>
      <td class="text-right">
        ${IDRFormat(
          record.Dapem.reduce((acc, curr) => {
            const adm = curr.plafond * (curr.c_adm_sumdan / 100);
            const blokir =
              GetAngsuran(
                curr.plafond,
                curr.tenor,
                curr.c_margin + curr.c_margin_sumdan,
                curr.margin_type,
                curr.rounded,
              ).angsuran * curr.c_blokir;
            const dropping = curr.plafond - (adm + curr.c_account + blokir);
            return acc + dropping;
          }, 0),
        )}
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

export const printSIPrevVersion = (record: IDropping) => {
  const htmlContent = generateSI(record);

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
