import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";
import { IDapem } from "@/libs/IInterfaces";
import moment from "moment";
import { Header, ListNonStyle, ListStyle, NumberToWordsID } from "../../utils";

moment.locale("id");

export const PKDassa = (record: IDapem) => {
  const angsuran = GetAngsuran(
    record.plafond,
    record.tenor,
    record.c_margin + record.c_margin_sumdan,
    record.margin_type,
    record.rounded,
  ).angsuran;

  const biayaAdm =
    record.plafond * ((record.c_adm + record.c_adm_sumdan) / 100);
  const biayaAsuransi = record.plafond * (record.c_insurance / 100);
  const biayaTotal =
    biayaAdm +
    biayaAsuransi +
    record.c_gov +
    record.c_account +
    record.c_stamp +
    record.c_infomation +
    record.c_provisi +
    record.c_mutasi;
  const jumlahTransfer = record.plafond - biayaTotal;

  const tanggalAkad = record.date_contract
    ? moment(record.date_contract).format("DD MMMM YYYY")
    : "";
  const tanggalAkadAngka = record.date_contract
    ? moment(record.date_contract).format("DD-MM-YYYY")
    : "";
  const tanggalBerakhir = record.date_contract
    ? moment(record.date_contract)
        .add(record.tenor, "month")
        .format("DD-MM-YYYY")
    : "";
  const hariAkad = record.date_contract
    ? moment(record.date_contract).format("dddd")
    : "";
  const tenorTerbilang = NumberToWordsID(record.tenor);
  const tempatLahir = record.Debitur.birthplace || "";
  const tanggalLahir = record.Debitur.birthdate
    ? moment(record.Debitur.birthdate).format("DD-MM-YYYY")
    : "";

  return `
  ${Header("PERJANJIAN KREDIT", `No. `, undefined, undefined, undefined)}

  <div class="space-y-4">
    <p>Perjanjian Kredit ini (selanjutnya disebut "Perjanjian") dibuat dan ditandatangani pada hari ${hariAkad}, tanggal ${tanggalAkad} (${tanggalAkadAngka}), oleh dan antara :</p>

    <ul style="list-style-type: disc; padding-left: 30px;">
      <li style="padding-left: 8px; margin-bottom: 8px;">PT Bank Perekonomian Rakyat Dassa suatu perseroan terbatas yang didirikan menurut Undang-undang Negara Republik Indonesia berkedudukan di Kabupaten Tangerang dan beralamat di North Point Commercial, Nava Park Number 8 BSD City, Jalan BSD Boulevard Utara, dalam hal ini diwakili oleh <strong>Pahala David</strong> dan <strong>Ferry</strong> masing-masing bertindak selaku Direktur Utama dan Direktur Bisnis, sehingga sah bertindak untuk dan atas nama PT Bank Perekonomian Rakyat Dassa.</li>
    </ul>
    <p>Selanjutnya disebut Kreditur.</p>

    <ul style="list-style-type: disc; padding-left: 30px;">
      <li style="padding-left: 8px; margin-bottom: 8px;"><strong>${record.Debitur.fullname}</strong> lahir di ${tempatLahir.toUpperCase()} pada tanggal ${tanggalLahir} ${record.job || ""} bertempat tinggal di ${record.Debitur.address} Kecamatan ${record.Debitur.district} Kelurahan ${record.Debitur.ward} ${record.Debitur.city?.toUpperCase()} Provinsi ${record.Debitur.province?.toUpperCase()}, Pemegang Kartu Tanda Penduduk, berwenang melakukan tindakan hukum dalam Perjanjian ini serta dalam hal ini tidak memerlukan persetujuan dari pihak manapun untuk menandatangani Perjanjian.</li>
    </ul>
    <p>Selanjutnya disebut Debitur.</p>

    <p>Debitur dan Kreditur selanjutnya secara bersama-sama disebut <strong>“PARA PIHAK”</strong>.</p>
    <p>Para Pihak telah sepakat untuk membuat Perjanjian dengan syarat dan ketentuan sebagai berikut :</p>
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 1</p>
      <p>FASILITAS KREDIT</p>
    </div>

    <p>Atas permintaan Debitur, Kreditur setuju memberikan fasilitas kredit kepada Debitur dengan ketentuan :</p>
    <div class="ml-6 mt-2">
      ${ListNonStyle([
        {
          key: "Plafon Pembiayaan",
          value: IDRFormat(record.plafond),
          currency: true,
        },
        {
          key: "Bunga",
          value: `${(record.c_margin + record.c_margin_sumdan).toFixed(2)} % effektif pertahun`,
        },
        {
          key: "Jenis Fasilitas",
          value: record.ProdukPembiayaan.name || "Kredit Pensiun",
        },
        {
          key: "Adm",
          value: `${(record.c_adm + record.c_adm_sumdan).toFixed(1)}% (${NumberToWordsID(Math.round((record.c_adm + record.c_adm_sumdan) * 10))} persepuluh persen)`,
        },
      ])}
    </div>
    <p class="mt-3">Dalam hal terjadi perubahan suku bunga yang menambah biaya Debitur sebagaimana dimaksud pada pasal 1.1 diatas, maka perubahan tersebut akan disampaikan secara tertulis oleh Kreditur kepada Debitur.</p>
    <p class="mt-3">Dilakukan blokir sebanyak ${record.c_blokir} (${NumberToWordsID(record.c_blokir)}) kali angsuran yang disimpan pada rekening tabungan Debitur di Kreditur, untuk proses take over.</p>
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 2</p>
      <p>Jangka Waktu dan Jadwal</p>
      <p>Angsuran</p>
    </div>

    ${ListStyle(
      [
        `Jangka waktu fasilitas ${record.tenor} (${tenorTerbilang}) bulan terhitung sejak tanggal ${tanggalAkadAngka} dan akan berakhir pada tanggal ${tanggalBerakhir}.`,
        `Angsuran bulanan sesuai dengan jadwal angsuran yang telah disepakati Para Pihak serta menjadi lampiran dari Perjanjian.`,
        `Pembayaran angsuran dilakukan dalam ${record.tenor} kali angsuran yang harus dibayar setiap bulan sesuai dengan jadwal angsuran dan harus sudah lunas selambat-lambatnya tanggal 25.`,
        `Debitur sewaktu-waktu dapat melunasi fasilitas kredit tersebut di atas dalam masa jangka waktu fasilitas yang telah ditetapkan dengan membayar denda pinalti disesuaikan dengan ketentuan yang berlaku.`,
        `Apabila pembayaran kewajiban yang harus dilakukan Debitur kepada Kreditur jatuh tempo bukan pada hari kerja, maka pembayaran harus dilakukan pada 1 (satu) hari kerja sebelumnya.`,
      ],
      "bullet",
    )}
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 3</p>
      <p>Penarikan Fasilitas Kredit dan Pengakuan Hutang</p>
    </div>

    ${ListStyle(
      [
        `Penarikan fasilitas Kredit yang diberikan Kreditur kepada Debitur dicairkan sekaligus yaitu sebesar Rp. ${IDRFormat(record.plafond)} (${NumberToWordsID(record.plafond)} Rupiah), jumlah tersebut sebelum dikurangi dengan biaya-biaya yang terkait dengan pemberian fasilitas kredit ini.`,
        `Debitur memberikan kuasa kepada Kreditur untuk melakukan penarikan fasilitas kredit pada rekening sebagai berikut :
          <div class="ml-6 mt-2">${ListNonStyle([
            { key: "Nama Bank", value: "" },
            { key: "Nomor Rekening", value: "" },
            { key: "Atas Nama", value: "" },
          ])}</div>`,
        `Atas penarikan fasilitas kredit setelah dikurangi biaya-biaya, harap di transfer pada rekening sebagai berikut :
          <div class="ml-6 mt-2">${ListNonStyle([
            { key: "Nama Bank", value: "BANK RAKYAT INDONESIA" },
            { key: "Nomor Rekening", value: "013201001538308" },
            { key: "Atas Nama", value: "KOPERASI PEMASARAN FADILLAH" },
            {
              key: "Jumlah yang ditransfer",
              value: IDRFormat(jumlahTransfer),
              currency: true,
            },
          ])}</div>`,
      ],
      "bullet",
    )}
  </div>

  <div style="page-break-before: always;"></div>

  <div class="space-y-5">
    ${ListStyle(
      [
        `Penandatanganan Perjanjian ini merupakan tanda penerimaan yang sah atas seluruh jumlah hutang pokok sebagaimana dimaksud pasal 1.1 Perjanjian dan Debitur dengan ini mengaku benar-benar secara sah telah berhutang kepada Kreditur atas jumlah hutang pokok tersebut demikian berikut bunga, denda dan biaya-biaya lain serta lain-lain jumlah yang wajib dibayar oleh Debitur kepada Kreditur berdasarkan Perjanjian ini.`,
        `Debitur menyetujui bahwa jumlah yang terutang oleh Debitur kepada Kreditur berdasarkan Perjanjian ini pada waktu-waktu tertentu akan terbukti dari : ${ListStyle(
          [
            "Rekening Debitur yang dipegang dan dipelihara oleh Kreditur dan/atau",
            "Surat-surat dan Dokumen-dokumen lain yang dikeluarkan oleh Kreditur.",
          ],
          "bullet",
        )}`,
      ],
      "bullet",
    )}
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 4</p>
      <p>Peristiwa Cidera Janji</p>
    </div>
    <p>Dengan tetap memperhatikan ketentuan Pasal 2 ayat 1 Perjanjian ini, Kreditur berhak untuk sewaktu-waktu dengan mengesampingkan ketentuan Pasal 1266 Kitab Undang-Undang Hukum Perdata, Khususnya ketentuan yang mengatur keharusan untuk mengajukan permohonan pembatalan Perjanjian melalui pengadilan sehingga tidak diperlukan suatu pemberitahuan (somasi) atau surat lain yang serupa dengan itu serta surat peringatan dari juru sita, menagih hutang Debitur berdasarkan Perjanjian ini atau sisanya, berikut bunga-bunga, denda-denda dan biaya yang lain yang timbul berdasarkan Perjanjian dan wajib dibayar oleh Debitur dengan seketika dan sekaligus lunas, apabila terjadi salah satu atau lebih kejadian-kejadian tersebut dibawah ini :</p>
    ${ListStyle(
      [
        "Debitur tidak atau lalai membayar lunas pada waktunya kepada Kreditur baik angsuran pokok, bunga-bunga, denda-denda dan biaya lain yang sudah jatuh tempo berdasarkan Perjanjian.",
        "Debitur meninggal dunia atau berada dibawah pengampuan.",
        "Debitur dinyatakan pailit, diberikan penundaan membayar hutang-hutang (surseance van betaling) atau bilamana Debitur dan/atau orang/pihak lain mengajukan permohonan kepada instansi yang berwenang agar Debitur dinyatakan dalam keadaan pailit.",
        "Kekayaan Debitur baik sebagian maupun seluruhnya disita atau dinyatakan dalam sitaan oleh instansi yang berwenang.",
        "Debitur lalai atau tidak memenuhi syarat-syarat dan ketentuan/kewajiban dalam Perjanjian ini dan setiap perubahannya.",
        "Debitur lalai atau tidak memenuhi kewajibannya kepada pihak lain berdasarkan Perjanjian dengan pihak lain sehingga Debitur dinyatakan cidera janji.",
        "Debitur tersangkut dalam suatu perkara hukum yang dapat menghalangi Debitur memenuhi kewajiban berdasarkan Perjanjian ini sebagaimana mestinya.",
        "Apabila ternyata suatu pernyataan-pernyataan atau dokumen-dokumen atau keterangan-keterangan yang diberikan Debitur kepada Kreditur ternyata tidak benar atau tidak sesuai dengan kenyataan.",
      ],
      "bullet",
    )}
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 5</p>
      <p>Jaminan</p>
    </div>
    <p>Untuk menjamin pembayaran hutang pokok, bunga dan pembayaran lainnya sebagaimana tercantum dalam Perjanjian ini, Debitur setuju memberikan jaminan kepada Kreditur berupa :</p>
    ${ListStyle(
      [
        `Asli Surat Kuasa Debet rekening atas nama ${record.Debitur.fullname}`,
        `Asli Surat Keputusan Pensiun Asli Nomor : ${record.Debitur.no_skep || ""} Tanggal ${record.Debitur.date_skep ? moment(record.Debitur.date_skep).format("DD-MM-YYYY") : ""} atas nama ${record.Debitur.fullname.split(" ")[0]}`,
      ],
      "bullet",
    )}
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 6</p>
      <p>Pernyataan dan Jaminan</p>
    </div>
    <p>Debitur dengan ini menyatakan dan menjamin Kreditur hal-hal sebagai berikut :</p>
    ${ListStyle(
      [
        "Debitur mempunyai wewenang untuk menandatangani Perjanjian ini.",
        "Debitur dengan ini menyatakan dan menjamin bahwa Perjanjian ini tidak bertentangan dengan perjanjian apapun yang dibuat oleh Debitur dengan pihak ketiga.",
        "Debitur dengan ini menyatakan dan menjamin bahwa pada waktu ini tidak ada sesuatu hal atau peristiwa yang merupakan suatu kejadian kelalaian/pelanggaran sebagaimana dimaksudkan dalam pasal 4 Perjanjian ini.",
        "Debitur dengan ini menyatakan dan menjamin akan mengganti segala kerugian yang diderita Kreditur sehubungan dengan adanya tuntutan atau gugatan dari pihak ketiga yang diakibatkan oleh karena adanya keterangan/pernyataan yang tidak benar yang disampaikan Debitur kepada Kreditur.",
        "Debitur dengan ini menyatakan dan menjamin bahwa apa yang dijaminkan dalam Perjanjian ini adalah benar merupakan hak Debitur sendiri dan tidak sedang terikat sebagai jaminan dan tidak akan dialihkan haknya pada pihak lain sampai dengan seluruh hutang Debitur dinyatakan lunas oleh Kreditur.",
      ],
      "bullet",
    )}
  </div>

  <div style="page-break-before: always;"></div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 7</p>
      <p>Pemberian Kuasa</p>
    </div>
    ${ListStyle(
      [
        "Debitur dengan ini memberikan kuasa kepada Kreditur untuk mendebet dan menggunakan dana yang tersimpan pada Kreditur baik dari rekening tabungan/deposito milik Debitur guna pembayaran angsuran pokok maupun bunga, denda, premi asuransi, biaya-biaya lainnya yang mungkin timbul sehubungan dengan pemberian fasilitas kredit ini dan segala yang terhutang berkenaan dengan pemberian fasilitas kredit berdasarkan perjanjian ini.",
        "Kreditur diberi kuasa oleh Debitur untuk menutup asuransi jiwa dan biaya premi menjadi beban Debitur, apabila Debitur meninggal dunia maka uang klaim asuransi untuk menjamin pelunasan seluruh kewajiban Debitur.",
        "Kuasa-kuasa yang diberikan Debitur kepada Kreditur berdasarkan Perjanjian ini kata demi kata harus telah dianggap telah termaktub dalam Perjanjian ini dan merupakan satu kesatuan serta bagian yang tidak terpisahkan dengan Perjanjian ini yang tidak dibuat tanpa adanya kuasa tersebut dan oleh karenanya kuasa-kuasa tersebut tidak akan dicabut dan tidak akan berakhir oleh karena sebab apapun juga, termasuk oleh sebab-sebab berakhirnya kuasa sebagaimana dimaksud dalam Pasal 1813, 1814 dan 1816 kitab Undang-Undang Hukum Perdata. Namun demikian, apabila ternyata terdapat suatu ketentuan hukum yang mengharuskan adanya suatu surat kuasa khusus untuk melaksanakan hak Kreditur berdasarkan Perjanjian, maka Debitur atas permintaan pertama dari Kreditur wajib untuk memberikan kuasa khusus dimaksud kepada Kreditur.",
      ],
      "bullet",
    )}
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 8</p>
      <p>Lain - lain</p>
    </div>
    ${ListStyle(
      [
        "Debitur menyetujui dan dengan ini memberi kuasa kepada Kreditur untuk sewaktu-waktu menjual, mengalihkan, menjaminkan atau dengan cara apapun memindahkan piutang/tagihan-tagihan Kreditur kepada Debitur berdasarkan Perjanjian ini kepada pihak ketiga lainnya dengan siapa Kreditur membuat perjanjian kerjasama berikut semua hak, kekuasaan-kekuasaan dan jaminan-jaminan yang ada pada Kreditur berdasarkan Perjanjian ini atau perjanjian jaminan, dengan syarat-syarat dan ketentuan-ketentuan yang dianggap baik oleh Kreditur, tanpa diperlukan surat persetujuan/kuasa tersendiri.",
        "Debitur tidak diperkenankan untuk mengalihkan hak-hak dan kewajibannya berdasarkan Perjanjian ini kepada pihak manapun tanpa persetujuan tertulis terlebih dahulu dari Kreditur.",
        "Selama fasilitas kredit belum lunas, Debitur tidak diperkenankan untuk menerima pinjaman dari bank/pihak ketiga lainnya tanpa persetujuan dari Kreditur.",
        "Selama fasilitas kredit belum lunas, Debitur tidak diperkenankan untuk menunda pengambilan gajinya setiap bulan untuk memenuhi pembayaran angsuran kepada Kreditur dan mengalihkan lokasi pembayaran uang pensiun Debitur ketempat lain selain Bank Perekonomian Rakyat Dassa yang telah menerima Surat Kuasa pemotongan uang pensiun Debitur.",
        "Debitur wajib mengizinkan Kreditur untuk melakukan pemeriksaan atas kekayaan dan/usaha Debitur serta dan memeriksa pembukuan, catatan-catatan dan administrasi Debitur dan membuat salinan-salinan atau foto copy atau catatan-catatan lainnya.",
        "Seluruh lampiran-lampiran Perjanjian ini termasuk namun tidak terbatas pada Perjanjian kerjasama, surat kuasa pemotongan uang pensiun, merupakan suatu kesatuan dan bagian yang tidak terpisahkan dengan Perjanjian.",
        "Debitur dengan ini menyatakan setuju, Kreditur menyampaikan informasi data Debitur kepada Bank Indonesia dan Otoritas Jasa Keuangan melalaui Sistem Informasi Debitur dan SLIK.",
        "Perjanjian ini telah disesuaikan dengan ketentuan peraturan perundang-undangan termasuk ketentuan peraturan Otoritas Jasa Keuangan (OJK).",
        "Perjanjian Kredit ini dibuat rangkap 1 (Satu), telah di mengerti isinya dan memiliki Kekuatan Hukum.",
        "Hal-hal yang belum diatur dalam Perjanjian ini serta perubahan dan/atau penambahan akan ditentukan kemudian antara Para Pihak serta dituangkan secara tertulis dalam suatu Addendum yang ditandatangani bersama oleh Para Pihak serta merupakan bagian dan satu kesatuan yang tidak dapat dipisahkan dan mempunyai kekuatan hukum yang sama dengan Perjanjian ini.",
      ],
      "bullet",
    )}
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 9</p>
      <p>Hukum Yang Berlaku dan</p>
      <p>Domisili Hukum</p>
    </div>
    ${ListStyle(
      [
        "Perjanjian ini tunduk pada dan karenanya harus ditafsirkan berdasarkan hukum Republik Indonesia.",
        "Untuk pelaksanaan Perjanjian ini dan segala akibatnya Para Pihak memilih tempat tinggal yang tetap dan tidak berubah di kantor Panitera Pengadilan Negeri Kota Bandung, dengan tidak mengurangi hak Kreditur untuk memohon pelaksanaan/eksekusi dari Perjanjian ini atau mengajukan tuntutan hukum terhadap Debitur melalui Pengadilan Negeri lainnya dalam wilayah Republik Indonesia.",
      ],
      "bullet",
    )}
  </div>

  <p>Demikian Perjanjian ini dibuat dan ditandatangani oleh Para Pihak pada hari ini dan tanggal sebagaimana disebutkan di awal Perjanjian ini.</p>

  <div class="mt-16 flex justify-between gap-10 text-center items-end">
    <div class="flex-1">
      <p class="font-bold">KREDITUR</p>
      <p class="font-bold">PT BANK PEREKONOMIAN RAKYAT DASSA</p>
      <div class="h-24"></div>
      <div class="grid grid-cols-2 gap-6">
        <div>
          <p class="border-b border-black font-bold">Pahala David</p>
          <p>Direktur Utama</p>
        </div>
        <div>
          <p class="border-b border-black font-bold">Ferry</p>
          <p>Direktur Bisnis</p>
        </div>
      </div>
    </div>
    <div class="flex-1">
      <p class="font-bold">DEBITUR</p>
      <div class="h-24"></div>
      <p class="border-b border-black font-bold">${record.Debitur.fullname}</p>
    </div>
  </div>
`;
};
