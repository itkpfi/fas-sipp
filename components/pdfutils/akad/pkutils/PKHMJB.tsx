import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";
import { IDapem } from "@/libs/IInterfaces";
import moment from "moment";
import { Header, ListNonStyle, ListStyle, NumberToWordsID } from "../../utils";
moment.locale("id");

export const PKDHMJB = (record: IDapem) => {
  const angsuran = GetAngsuran(
    record.plafond,
    record.tenor,
    record.c_margin + record.c_margin_sumdan,
    record.margin_type,
    record.rounded,
  ).angsuran;
  const angsuranSumdan = GetAngsuran(
    record.plafond,
    record.tenor,
    record.c_margin_sumdan,
    record.margin_type,
    record.rounded_sumdan,
  ).angsuran;

  const biayaAdm =
    record.plafond * ((record.c_adm + record.c_adm_sumdan) / 100);
  const biayaAsuransi = record.plafond * (record.c_insurance / 100);
  const blokir = record.c_blokir * angsuran;
  const biayaTotal =
    biayaAdm +
    biayaAsuransi +
    record.c_gov +
    record.c_account +
    record.c_stamp +
    record.c_infomation +
    record.c_provisi +
    record.c_mutasi;

  return `
  ${Header("PERJANJIAN KREDIT", `No. ${record.no_contract}`, undefined, undefined, undefined)}
  
  <p>Perjanjian Kredit ini (selanjutnya disebut "Perjanjian") dibuat di pada hari ini ${moment(record.date_contract).format("dddd")}, tanggal ${moment(record.date_contract).format("DD MMMM YYYY")} oleh dan antara : :</p>
  <div class="my-2 ml-2 flex gap-2">
    <div class="w-5">I.</div>
    <div>
      <p><strong>${record.Debitur.fullname}</strong> pemegang Kartu Tanda Penduduk (KTP) no ${record.Debitur.nik} bertempat di ${record.Debitur.address}, KELURAHAN ${record.Debitur.ward} KECAMATAN ${record.Debitur.district}, ${record.Debitur.city} ${record.Debitur.province} ${record.Debitur.pos_code}. bertindak untuk dan atas nama diri sendiri. (Selanjutnya disebut "Debitur").</p>
    </div>
  </div>
  <div class="my-2 ml-2 flex gap-2">
    <div class="w-5">II.</div>
    <div>
      <p>${process.env.NEXT_PUBLIC_APP_AKAD_NAME} dalam jabatannya selaku ${process.env.NEXT_PUBLIC_APP_AKAD_POSITION} ${process.env.NEXT_PUBLIC_APP_COMPANY_NAME} berdasarkan Perjanjian Kerjasama No.027/FAS/PKS/II/2026 dan No. 023/BPR-HM-JB/PKS/II/2026. Tanggal 12-02-2026 (Duabelas Februari Dua Ribu Dua Puluh Enam) antara ${process.env.NEXT_PUBLIC_APP_COMPANY_NAME} dan ${record.ProdukPembiayaan.Sumdan.name} dan Surat Kuasa Nomor ${record.ProdukPembiayaan.Sumdan.sk_no} tanggal ${moment(record.ProdukPembiayaan.Sumdan.sk_date).format("DD MMMM YYYY")}, berwenang bertindak untuk dan atas nama ${record.ProdukPembiayaan.Sumdan.name}, berkedudukan di Depok. (Selanjutnya disebut Kreditur).</p>
    </div>
  </div>
  <div>
    <p>Debitur dan Kreditur selanjutnya secara bersama-sama disebut "PARA PIHAK". Para Pihak telah sepakat untuk membuat perjanjian ini dengan syarat dan ketentuan sebagai berikut :</p>
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 1</p>
      <p>FASILITAS KREDIT</p>
    </div>
    <div class="flex flex-1 gap-2">
      <p class="w-4">1. </p>
      <div class="flex-1">
        <p>Atas permintaan Debitur, Kreditur setuju memberikan fasilitas kepada Debitur dengan ketentuan :</p>
        <div class="ml-6">
          ${ListNonStyle([
            {
              key: "Jumlah Hutang Pokok",
              value: IDRFormat(record.plafond),
              currency: true,
            },
            {
              key: "Bunga",
              value:
                (record.c_margin_sumdan + record.c_margin).toFixed(2) +
                " % /tahun",
              currency: true,
            },
            {
              key: "Biaya Administrasi",
              value: IDRFormat(
                (record.plafond * (record.c_adm_sumdan + record.c_adm)) / 100,
              ),
              currency: true,
            },
            {
              key: "Biaya Tatalaksana",
              value: IDRFormat(record.c_gov),
              currency: true,
            },
            {
              key: "Biaya Buka Rekening",
              value: IDRFormat(record.c_account),
              currency: true,
            },
            {
              key: "Biaya Asuransi",
              value: IDRFormat(record.plafond * (record.c_insurance / 100)),
              currency: true,
            },
            {
              key: "Biaya Mutasi",
              value: IDRFormat(record.c_mutasi),
              currency: true,
            },
            {
              key: "Biaya Materai",
              value: IDRFormat(record.c_stamp),
              currency: true,
            },
            {
              key: "Biaya Data Informasi",
              value: IDRFormat(record.c_infomation),
              currency: true,
            },
            {
              key: "Jenis Fasilitas",
              value: "Kredit Multiguna",
            },
            {
              key: "Bentuk Fasilitas",
              value: "Installment",
            },
            {
              key: "Angsuran Perbulan",
              value: IDRFormat(angsuran),
              currency: true,
            },
            {
              key: "Angsuran Dibayar Dimuka " + record.c_blokir + "x",
              value: IDRFormat(angsuran),
              currency: true,
            },
            {
              key: "Total Penerimaan",
              value: IDRFormat(record.plafond - blokir - biayaTotal),
              currency: true,
            },
          ])}
        </div>
      </div>
    </div>
    <div class="flex flex-1 gap-2">
      <p class="w-4">2. </p>
      <p>Dalam hal terjadi perubahan suku bunga yang menambah biaya Debitur sebagaimana dimaksud pada pasal 1.1 huruf b diatas, maka perubahan tersebut akan disampaikan secara tertulis oleh Kreditur kepada Debitur.</p>
    </div>
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 2</p>
      <p>Jangka Waktu dan Jadwal Angsuran</p>
    </div>

    ${ListStyle(
      [
        `Jangka waktu fasilitas kredit ${record.tenor} bulan terhitung sejak tanggal ${moment(record.date_contract).format("DD-MM-YYYY")} dan akan berakhir pada tanggal ${moment(record.date_contract).add(record.tenor, "month").format("DD-MM-YYYY")}.`,
        `Angsuran bulanan sebesar Rp. ${IDRFormat(angsuran)};- (${NumberToWordsID(angsuran)})/ bulan sesuai jadwal angsuran yang telah disepakati
para pihak`,
        `Pembayaran angsuran dilakukan dalam ${record.tenor} kali angsuran yang harus dibayar tiap tanggal 25 dan harus sudah lunas selambat- lambatnya
tanggal 25`,
        `Denda keterlambatan pembayaran angsuran sebesar 4.00% perbulan dan harus dibayar dengan seketika dan sekaligus lunas bersamaan
dengan pembayaran angsuran tertunggak.`,
        `Untuk pelunasan dipercepat dikenakan denda sebesar 10% dari outstanding kredit (dikecualikan untuk Top Up kredit tidak dikenakan denda/penalty)`,
        `Debitur tidak diperkenankan melakukan pelunasan dipercepat sampai dengan jangka waktu kredit 1 tahun kecuali Top Up kredit`,
        `Apabila pembayaran kewajiban yang harus dilakukan Debitur kepada Kreditur jatuh tempo bukan pada hari kerja, maka pembayaran harus
dilakukan 1 (Satu) hari kerja sebelumnya.`,
      ],
      "number",
    )}
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 3</p>
      <p>Penarikan Fasilitas Kredit dan Pengakuan Hutang</p>
    </div>
    ${ListStyle(
      [
        `Penarikan fasilitas kredit yang diberikan Kreditur kepada Debitur dicairkan sekaligus, yaitu sebesar Rp. ${IDRFormat(record.plafond)};- (${NumberToWordsID(record.plafond)}), jumlah tersebut setelah dikurangi dengan angsuran dibayar dimuka dan biaya- biaya yang terkait dengan
fasilitas kredit.`,
        `Debitur menyetujui bahwa Dropping fasilitas kredit akan ditransaksikan paling lambat 5 (lima) hari kerja sejak Perjanjian Kredit ini ditandatangani.`,
        `Penandatanganan Perjanjian ini merupakan tanda penerimaan yang sah atas seluruh jumlah hutang pokok sebagaimana dimaksud pasal
1 ayat 1 huruf a, Perjanjian dan Debitur dengan ini mengaku benar-benar secara sah telah berhutang kepada Kreditur atas jumlah hutang
pokok tersebut demikian berikut bunga, denda dan biaya-biaya lain serta lain-lain jumlah yang wajib dibayar oleh Debitur kepada Kreditur
berdasarkan Perjanjian ini`,
        `Debitur menyetujui bahwa jumlah yang terhutang oleh Debitur kepada Kreditur berdasarkan Perjanjian ini pada waktu-waktu tertentu akan
terbukti dari: ${ListStyle(
          [
            `Rekening Debitur yang dipegang dan dipelihara oleh Kreditur dan/atau`,
            `Buku-buku, catatan-catatan yang dipegang dan dipelihara oleh Kreditur; dan/atau`,
            `Surat-surat dan Dokumen-dokumen lain yang dikeluarkan oleh Kreditur; dan/atau`,
            `Salinan/Kutipan rekening Debitur`,
          ],
          "lower",
        )}`,
      ],
      "number",
    )}

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 4</p>
      <p>Peristiwa Cidera Janji</p>
    </div>
    Dengan tetap memperhatikan ketentuan Pasal 2 ayat 1 Perjanjian ini, Kreditur berhak untuk sewaktu-waktu dengan mengesampingkan ketentuan Pasal 1266 kitab Undang-Undang Hukum Perdata, khususnya ketentuan yang mengatur keharusan untuk mengajukan permohonan pembatalan perjanjian melaluli pengadilan, sehingga tidak diperlukan suatu pemberitahuan (somasi) atau surat lain yang serupa dengan itu serta
surat peringatan dari juru sita, menagih hutang hutang Debitur berdasarkan Perjanjian ini ata sisanya, berikut bunga-bunga, denda-denda dan
biaya lain yang timbul berdasarkan Perjanjian dan wajib dibayar oleh Debitur dengan seketika dan sekaligus lunas, apabila terjadi salah satu
atau lebih kejadiankejadian tersebut dibawah ini:
${ListStyle(
  [
    `Debitur tidak atau lalai membayar lunas pada waktunya kepada Kreditur baik angsuran pokok, bunga-bunga, denda-denda dan biaya lainnya
yang sudah jatuh tempo berdasarkan Perjanjian;`,
    `Debitur meninggal dunia atau berada dibawah pengampunan;`,
    `Debitur dinyatak pailit, diberikan penundaan membayar hutang-hutang (Surseance van betaling) atau bilamana Debitur dan/atau orang/pihak lain mengajukan permohonan kepada instansi yang berwenang agar Debitur dinyatakan dalam keadaan pailit;`,
    `Kekayaan Debitur baik sebagian maupun seluruhnya disita dan dinyatakan dalam sitaan oleh instansi yang berwenang;`,
    `Debitur lalai atau tidak memenuhi syarat-syarat dan ketentuan/kewajiban dalam Perjanjian ini dan setiap perubahannya;`,
    `Debitur lalai atau tidak memenuhi kewajibannya kepada pihak lain berdasarkan Perjanjian dengan pihak lain sehingga Debitur dinyatakan
cidera janji;`,
    `Debitur tersangkut dalam suatu perkara hukum yang dapat menghalangi Debitur memenuhi kewajiban berdasarkan Perjanjian ini sebagaimana mestinya;`,
    `Apabila ternyata suatu pernyataan-pernyataan atau dokumen-dokumen atau keterangan-keterangan yang diberikan Debitur kepada Kreditur
ternyata tidak benar atau tidak sesuai dengan kenyataan;</b>`,
  ],
  "lower",
)}

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 5</p>
      <p>Jaminan</p>
    </div>
Untuk menjamin pembayaran hutang pokok, bunga dan pembayaran lainnya sebagaimana tercantum dalam Perjanjian ini, Debitur setuju memberikan jaminan kepada Kreditur berupa uang pensiun Debitur setiap bulan, dan oleh karenanya Debitur dengan ini telah menyampaikan kepada
Kreditur dokumen jaminan berupa
${ListStyle(
  [
    `Menyerahkan Asli Surat Keputusan (SK) Pensiunan Nomor : ${record.Debitur.date_skep} atas nama <strong>${record.Debitur.fullname}</strong>`,
    `Menyerahkan Asli Surat Pernyataan Kuasa Potong Gaji dari Debitur atas nama <strong>${record.Debitur.fullname}</strong>`,
  ],
  "lower",
)}

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 6</p>
      <p>Pernyataan dan Jaminan
</p>
    </div>
Debitur dengan ini menyatakan dan menjamin kepada Kreditur hal-hal sebagai berikut:
${ListStyle(
  [
    ` Debitur mempunyai wewenang untuk menandatangani Perjanjian ini.`,
    ` Debitur dengan ini menyatakan dan menjamin bahwa Perjanjian ini tidak bertentangan dengan perjanjian apapun yang dibuat oleh Debitur
kepada pihak ketiga.`,
    ` Debitur dengan ini menyatakan dan menjamin bahwa pada waktu ini tidak ada sesuatu hal atau peristiwa yang merupakan suatu kejadian
kelalaian/pelanggaran sebagaimana dimaksudkan dalam pasal 4 Perjanjian ini.`,
    ` Debitur dengan ini menyatakan dan menjamin akan mengganti segala kerugian yang diderita oleh kreditur sehubungan dengan adanya tuntutan atau gugatan dari pihak ketiga yang diakibatkan oleh karena adanya keterangan/pernyataan yang tidak benar yang disampaikan Debitur kepada Kreditur.
`,
    ` Debitur dengan ini menyatakan dan menjamin bahwa apa yang dijaminkan dalam Perjanjian ini adalah benar merupakan hak Debitur sendiri
dan tidak sedang terikat sebagai jaminan dan tidak akan dialihkan haknya pada pihak lain sampai dengan seluruh hutang Debitur dinyatakan
lunas oleh Kreditur`,
    ` Debitur dengan ini menyatakan bersedia untuk menyerahkan barang bergerak maupun tidak bergerak yang ada maupun yang akan ada
kepada Kreditur untuk pelunasan hutang Debitur, berikut bunga-bunga, denda-denda dan biaya lain yang timbul berdasarkan Perjanjian ini,
apabila terjadi peristiwa cidera janji sebagaimana dimaksud Pasal 4 Perjanjian ini.`,
  ],
  "lower",
)}

  <div class="my-8">
    <div class="my-3 text-center font-bold">
      <p>PASAL 7</p>
      <p>Pemberian Kuasa
</p>
    </div>
${ListStyle(
  [
    ` Debitur dengan ini memberikan kuasa kepada Kreditur untuk mendebet dan menggunakan dana yang tersimpan pada Kreditur baik dari
rekening tabungan/deposito milik Debitur guna pembayaran angsuran pokok maupun bunga, denda, premi asuransi, biaya-biaya lainnya
yang mungkin timbul sehubungan dengan pemberian fasilitas kredit ini dan segala yang terhutang berkenaan dengan pemberian fasilitas
kredit berdasarkan Perjanjian ini.`,
    ` Kreditur diberi kuasa oleh Debitur untuk menutup asuransi jiwa dan biaya premi menjadi beban Debitur, apabila Debitur meninggal dunia,
maka uang klaim asuransi untuk menjamin pelunasan seluruh kewajiban Debitur.`,
    `Kuasa-kuasa yang diberikan Debitur kepada Kreditur berdasarkan Perjanjian ini kata demi kata harus telah dianggap telah termaktub dalam
Perjanjian ini dan merupakan satu kesatuan serta bagian yang tidak terpisahkan dengan Perjanjian ini yang tidak dibuat tanpa adanya kuasa
tersebut, dan oleh karenanya kuasa-kuasa tersebut tidak akan dicabut dan tidak akan berakhir oleh karena sebab apapun juga, termasuk
oleh sebab-sebab berakhirnya kuasa sebagaimana dimaksud dalam pasal 1813, 1814 dan 1816 kitab Undang-Undang Hukum Perdata. Namun demikian, apabila ternyata terdapat suatu ketentuan hukum yang mengharuskan adanya suatu kuasa khusus untuk melaksanakan hak
Kreditur berdasarkan Perjanjian, maka Debitur atas permintaan pertama dari Kreditur wajib untuk memberikan kuasa khusus dimaksud
kepada Kreditur .
`,
  ],
  "number",
)}

  <div class="my-8">
    <div class="my-3 text-center font-bold">
      <p>PASAL 8</p>
      <p>Lain - Lain</p>
    </div>
${ListStyle(
  [
    `Debitur menyetujui dan dengan ini memberi kuasa kepada Kreditur untuk sewaktu-waktu menjual, mengalihkan, menjaminkan atau dengan
cara apapun memindahkan piutang/tagihan-tagihan Kreditur kepada Debitur berdasarkan Perjanjian ini kepada pihak ketiga lainnya dengan siapa Kreditur membuat perjanjian kerja sama berikut semua hak, kekuasaan-kekuasaan dan jaminan-jaminan yang ada pada Kreditur
berdasarkan Perjanjian ini atau Perjanjian Jaminan, dengan syarat-syarat dan ketentuan ketentuan yang dianggap baik oleh Kreditur.`,
    `Debitur tidak diperkenankan untuk mengalihkan hak-hak dan kewajibannya berdasarkan Perjanjian ini kepada pihak manapun tanpa persetujuan tertulis terlebih dahulu dari Kreditur.`,
    `Selama fasilitas kredit belum lunas, Debitur tidak diperkenankan untuk menerima pinjaman dari bank/pihak ketiga lainnya tanpa persetujuan dari Kreditur`,
    `Selama fasilitas kredit belum lunas, Debitur tidak diperkenankan untuk menunda pengambilan gajinya setiap bulan untuk memenuhi pembayaran angsuran kepada Kreditur dan mengalihkan lokasi pembayaran uang pensiun Debitur ketempat lain selain BPR HASAMITRA yang
telah menerima surat kuasa pemotongan uang pensiun Debitur`,
    `Debitur wajib mengizinkan Kreditur untuk melakukan pemeriksaan atas kekayaan dan/usaha Debitur serta dan memeriksa pembukuan,
catatan catatan dan administrasi Debitur dan membuat salinan-salinan atau foto copy atau catatan-catatan dari padanya.`,
    `Seluruh lampiran-lampiran Perjanjian ini termasuk namun tidak terbatas pada Perjanjian Kerjasama, surat kuasa pemotongan uang pensiun,
merupakan suatu kesatuan dan bagian yang tidak terpisahkan dengan Perjanjian.`,
    `Hal-hal yang belum diatur dalam Perjanjian ini serta perubahan dan/atau penambahan akan ditentukan kemudian antara para pihak serta
dituangkan secara tertulis dalam suatu Addendum yang ditandatangani bersama oleh para pihak serta merupakan bagian dan satu kesatuan
yang tidak dapat dipisahkan dan mempunyai kekuatan hukum yang sama dengan Perjanjian ini.
`,
  ],
  "number",
)}

  <div class="my-8">
    <div class="my-3 text-center font-bold">
      <p>PASAL 9</p>
      <p>Hukum Yang Berlaku Dan Domisili Hukum</p>
    </div>
${ListStyle(
  [
    `Perjanjian ini tunduk pada dan karenanya harus ditafsirkan berdasarkan hukum Republik Indonesia`,
    `Untuk pelaksanaan Perjanjian ini dan segala akibatnya para pihak memilih tempat tinggal yang tetap dan tidak berubah di kantor Panitera
Pengadilan Negeri Surabaya di Surabaya, dengan tidak mengurangi hak Kreditur untuk memohon pelaksanaan/eksekusi dari Perjanjian ini
atau mengajukan tuntutan hukum terhadap Debitur melalui Pengadilan-Pengadilan Negeri lainnya dalam wilayah Republik Indonesia.`,
  ],
  "number",
)}
<p>Demikian Perjanjian ini dibuat dan ditandatangani oleh para pihak pada hari ini dan tanggal sebagaimana disebutkan diawal Perjanjian ini.</p>
    

  <div class="mt-15">
  <div class="flex justify-between gap-6 items-end">
    <div class="flex-1 text-center">
        <p >${(record.Debitur.city || "KOTA BANDUNG").toLowerCase().replace("kota", "").replace("kabupaten", "").toUpperCase()}, ${moment(record.date_contract).format("DD-MM-YYYY")}</p>
        <p class="font-bold">${record.ProdukPembiayaan.Sumdan.name}</p>
        <div class="h-28">
        </div>
        <div>
          <p class="w-full border-b">${process.env.NEXT_PUBLIC_APP_AKAD_NAME}</p>
          <p>${process.env.NEXT_PUBLIC_APP_AKAD_POSITION}</p>
        </div>
      </div>
      <div class="flex-1 text-center">
        <p class="font-bold">DEBITUR</p>
        <div class="h-28 flex items-center justify-center opacity-50">
          <p >Materai 10.000</p>
        </div>
        <div>
          <p class="w-full border-b">${record.Debitur.fullname}</p>
          <p>PENERIMA PEMBIAYAAN</p>
        </div>
      </div>
      <div class="flex-1 text-center">
        <p class="font-bold">Menyetujui</p>
        <div class="h-28">
        </div>
        <div>
          <p class="w-full border-b">${record.aw_name}</p>
          <p>SUAMI/ISTRI/AHLI WARIS</p>
        </div>
      </div>
    </div>
  </div>
`;
};
