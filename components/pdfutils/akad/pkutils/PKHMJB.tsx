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

    <div class="flex gap-2">
      <p class="w-4">1.</p>
      <p class="w-44">Jangka Waktu</p>
      <p class="w-4">:</p>
      <p class="flex-1">${record.tenor} bulan, terhitung sejak tanggal ${moment(record.date_contract).format("DD-MM-YYYY")} sampai dengan ${moment(record.date_contract).add(record.tenor, "month").format("DD-MM-YYYY")}</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">2.</p>
      <p class="w-44">Angsuran Perbulan</p>
      <p class="w-4">:</p>
      <p class="flex-1">Rp. ${IDRFormat(angsuranSumdan)}</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">3.</p>
      <p class="w-44">Fee Collection</p>
      <p class="w-4">:</p>
      <p class="flex-1">Rp. ${IDRFormat(angsuran - angsuranSumdan)}</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">4.</p>
      <p class="w-44">Total Angsuran</p>
      <p class="w-4">:</p>
      <p class="flex-1">Rp. ${IDRFormat(angsuran)}</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">5.</p>
      <p class="w-44">Tanggal Pembayaran</p>
      <p class="w-4">:</p>
      <p class="flex-1">25</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">5.</p>
      <p class="w-44">Suku Bunga Anuitas</p>
      <p class="w-4">:</p>
      <p class="flex-1">${(record.c_margin + record.c_margin_sumdan).toFixed(2)}% /tahun</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">7.</p>
      <p class="w-44">Tujuan Penggunaan</p>
      <p class="w-4">:</p>
      <p class="flex-1">${record.used_for}</p>
    </div>
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 3</p>
      <p>BIAYA - BIAYA</p>
    </div>

    <div class="flex gap-2">
      <p class="w-4">1.</p>
      <p class="flex-1">Untuk pembebanan angsuran, bunga, provisi, biaya-biaya, denda dan segala biaya lainnya yang terhutang berkenaan dengan pemberian kredit ini, DEBITUR memberi kuasa kepada BANK untuk mendebet rekening DEBITUR yang ada pada BANK.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">2.</p>
      <div class="flex-1">
        <p>DEBITUR berjanji dan dengan ini mengikat diri untuk menanggung seluruh biaya yang diperlukan berkenaan dengan pelaksanaan Akad ini sepanjang hal ini diberitahukan BANK kepada DEBITUR sebelum ditandatangani Akad ini dan DEBITUR menyatakan persetujuannya. Adapun biaya-biaya tersebut adalah sebagai berikut :</p>
        <div class="flex gap-2 ml-10">
          <p class="w-4">a.</p>
          <p class="w-44">Administrasi</p>
          <p class="w-4">:</p>
          <div class="w-28 flex justify-between gap-2">
            <p class="w-4">Rp. </p>
            <p class="flex-1 text-right">${IDRFormat(biayaAdm)}</p>
          </div>
        </div>
        <div class="flex gap-2 ml-10">
          <p class="w-4">b.</p>
          <p class="w-44">Asuransi</p>
          <p class="w-4">:</p>
          <div class="w-28 flex justify-between gap-2">
            <p class="w-4">Rp. </p>
            <p class="flex-1 text-right">${IDRFormat(biayaAsuransi)}</p>
          </div>
        </div>
        <div class="flex gap-2 ml-10">
          <p class="w-4">c.</p>
          <p class="w-44">Pembukaan Tabungan</p>
          <p class="w-4">:</p>
          <div class="w-28 flex justify-between gap-2">
            <p class="w-4">Rp. </p>
            <p class="flex-1 text-right">${IDRFormat(record.c_account)}</p>
          </div>
        </div>
        <div class="flex gap-2 ml-10">
          <p class="w-4">d.</p>
          <p class="w-44">Materai</p>
          <p class="w-4">:</p>
          <div class="w-28 flex justify-between gap-2">
            <p class="w-4">Rp. </p>
            <p class="flex-1 text-right">${IDRFormat(record.c_stamp)}</p>
          </div>
        </div>
        <div class="flex gap-2 ml-10">
          <p class="w-4">d.</p>
          <p class="w-44">Data Informasi</p>
          <p class="w-4">:</p>
          <div class="w-28 flex justify-between gap-2">
            <p class="w-4">Rp. </p>
            <p class="flex-1 text-right">${IDRFormat(record.c_infomation)}</p>
          </div>
        </div>
        <div class="flex gap-2 ml-10">
          <p class="w-4">e.</p>
          <p class="w-44">Biaya Lain-lain</p>
          <p class="w-4">:</p>
          <div class="w-28 flex justify-between gap-2">
            <p class="w-4">Rp. </p>
            <p class="flex-1 text-right">${IDRFormat(record.c_gov + record.c_mutasi + record.c_provisi)}</p>
          </div>
        </div>
        <div class="flex gap-2 ml-10 font-bold">
          <p class="w-4"></p>
          <p class="w-44">Total Biaya</p>
          <p class="w-4">:</p>
          <div class="w-28 border-t border-dashed flex justify-between gap-2">
            <p class="w-4">Rp. </p>
            <p class="flex-1 text-right">${IDRFormat(biayaTotal)}</p>
          </div>
        </div>
      </div>
    </div>
    <p>Segala biaya yang timbul sehubungan dengan Akad ini merupakan tanggung jawab dan wajib dibayar oleh DEBITUR.</p>

  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 4</p>
      <p>JAMINAN</p>
    </div>

    <div class="flex gap-2">
      <p class="w-4">1.</p>
      <div class="flex-1">
        <p>Bahwa guna menjamin lebih lanjut pembayaran kembali kewajiban DEBITUR kepada BANK seperti yang disebut pada perjanjian ini, perubahan dan/atau novasi atau Perjanjian Kredit yang dibuat dikemudian hari atau sebab apapun juga, maka DEBITUR menyerahkan jaminan kepada BANK berupa :</p>
        <p class="ml-10 font-bold">Surat Keputusan Pensiun nomor : ${record.Debitur.no_skep} yang selanjutnya disebut sebagai JAMINAN</p>
      </div>
    </div>
    <div class="flex gap-2">
      <p class="w-4">2.</p>
      <div class="flex-1">
        <p>DEBITUR wajib menyerahkan dokumen jaminan yang akan disimpan oleh BANK berupa :</p>
          <div class="ml-10">
            ${ListStyle(
              [
                "Asli surat keputusan pensiun;",
                "Salinan Kartu Registrasi Induk Pensiun (KARIP) jika ada;",
              ],
              "lower-alpha",
            )}
          </div>
        </div>
    </div>
    <div class="flex gap-2">
      <p class="w-4">3.</p>
      <p class="flex-1">DEBITUR memberi kuasa kepada BANK untuk melakukan tindakan dan perbuatan hukum yang dianggap wajar dan perlu oleh BANK yang berkaitan dengan pemberian jaminan tersebut diatas.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">4.</p>
      <p class="flex-1">DEBITUR dengan ini menyatakan dan menjamin bahwa JAMINAN tersebut diatas adalah benar dan milik DEBITUR, dan hanya DEBITUR sajalah yang berhak untuk menyerahkannya sebagai Jaminan, tidak sedang diberikan sebagai Jaminan untuk sesuatu hutang pada pihak lain dengan jalan bagaimanapun juga, tidak dalam keadaan sengketa serta bebas dari sitaan, serta belum dijual atau dijanjikan untuk dijual atau dialihkan kepada pihak lain dengan cara apapun juga.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">5.</p>
      <p class="flex-1">DEBITUR menjamin bahwa mengenai hal – hal tersebut pada pasal 4 ayat 1 diatas, baik sekarang maupun dikemudian hari, BANK tidak akan mendapat tuntutan atau gugatan dari pihak manapun juga yang menyatakan mempunyai hak terlebih dahulu atau turut mempunyai hak atas JAMINAN tersebut diatas.</p>
    </div>

  </div>
  
  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 5</p>
      <p>KEWAJIBAN DEBITUR</p>
    </div>

    <p>Untuk lebih menjamin pelaksanaan Perjanjian ini oleh DEBITUR, maka DEBITUR berkewajiban untuk :</p>
    <div class="flex gap-2">
      <p class="w-4">1.</p>
      <p class="flex-1">Mempergunakan kredit tersebut semata-mata hanya sebagaimana yang tertera dalam pasal 1 Perjanjian ini.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">2.</p>
      <p class="flex-1">DEBITUR menyetujui dan wajib mengikat diri untuk menyerahkan semua surat dan dokumen apapun, yang asli serta sah dan membuktikan pemilikan atas segala benda yang dijadikan jaminan termasuk dalam Pasal 4 ayat 1 tersebut di atas kepada BANK guna dipergunakan untuk pelaksanaan pengikatan benda tersebut sebagai jaminan kredit, dan selanjutnya dikuasai oleh BANK sampai dilunasi seluruh jumlah hutangnya.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">3.</p>
      <p class="flex-1">DEBITUR Wajib mengikuti Asuransi Jiwa dan atau Asuransi Kredit.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">4.</p>
      <p class="flex-1">DEBITUR wajib memperpanjang masa pertanggungan termasuk bilamana masa berakhir, sampai lunasnya fasilitas kredit dibayar kembali oleh DEBITUR kepada BANK, apabila DEBITUR dengan alasan apapun tidak memperpanjang masa pertanggungan tersebut, maka segala resiko yang terjadi pada agunan tersebut menjadi resiko DEBITUR sendiri.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">5.</p>
      <p class="flex-1">DEBITUR wajib membayar premi-premi dan lain-lain biaya asuransi tepat pada waktunya dan menyerahkan asli dari setiap polis atau setiap perpanjangannya dan setiap tanda-tanda pembayarannya kepada BANK. BANK dengan ini diberi kuasa oleh DEBITUR untuk menutup dan memperpanjang asuransi yang dimaksud di atas, satu dan lain atas biaya DEBITUR, yakni bilamana DEBITUR lalai menutup atau memperpanjang berlakunya asuransi tersebut.</p>
    </div>
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 6</p>
      <p>PEMBAYARAN KEMBALI KREDIT</p>
    </div>

    <div class="flex gap-2">
      <p class="w-4">1.</p>
      <p class="flex-1">Pembayaran kembali kredit/pinjaman uang tersebut dilakukan secara angsuran bulanan, yang terdiri dari angsuran pokok kredit dan bunga dalam jumlah tetap. Jumlah-jumlah uang yang terutang oleh DEBITUR kepada BANK berdasarkan/sesuai dengan catatan-catatan dan/atau pembukuan BANK merupakan bukti yang mengikat bagi DEBITUR mengenai utang DEBITUR dibayar lunas, untuk itu DEBITUR tidak akan menyangkal dan/atau mengajukan keberatan-keberatan akan jumlah-jumlah uang yang terhutang oleh DEBITUR.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">2.</p>
      <p class="flex-1">Demikian pula apabila jangka waktu fasilitas kredit telah berakhir atau diakhiri sebelum jangka waktu berakhir dan ternyata masih terdapat sisa utang sebagai akibat perubahan tingkat suku bunga, maka DEBITUR wajib menandatangani perpanjangan Perjanjian Kredit.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">3.</p>
      <p class="flex-1">Setiap perubahan besarnya pembayaran bunga pinjaman selalu akan diberitahukan secara tertulis oleh BANK kepada DEBITUR. Dan surat pemberitahuan perubahan suku bunga tersebut, dan/atau jadwal angsuran pinjaman pokok dan bunga pinjaman, merupakan satu kesatuan dan tidak terpisahkan dari perjanjian ini, serta DEBITUR tidak akan menyangkal dalam bentuk apapun juga atas perubahan suku bunga tersebutnga, maka DEBITUR wajib menandatangani perpanjangan Perjanjian Kredit.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">4.</p>
      <p class="flex-1">DEBITUR membayar angsuran pokok dan bunga pinjaman melalui pemotongan gaji yang dilakukan oleh KANTOR POS berdasarkan surat kuasa pemotongan gaji sampai seluruh kewajibanya dinyatakan lunas oleh BANK.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">5.</p>
      <p class="flex-1">Semua pembayaran pada BANK harus dilakukan di tempat kedudukan BANK melalui rekening DEBITUR atau rekening lain yang ditentukan oleh BANK.</p>
    </div>
  </div>

  <div class="my-7">
    <div class="my-3 text-center font-bold">
      <p>PASAL 7</p>
      <p>DENDA KETERLAMBATAN DAN PINALTY</p>
    </div>

    <div class="flex gap-2">
      <p class="w-4">1.</p>
      <p class="flex-1">Bahwa atas setiap keterlambatan pembayaran cicilan/angsuran oleh DEBITUR kepada BANK, maka DEBITUR dikenakan denda menurut ketentuan BANK yang berlaku pada saat ditandatanganinya Perjanjian ini, yaitu sebesar 0,33%,- (nol koma tiga puluh tiga persen) perhari.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">2.</p>
      <p class="flex-1">Pelunasan sebagian atau seluruh pinjaman sebelum jatuh tempo dapat dilakukan DEBITUR dengan ketentuan bahwa setiap pelunasan baik sebagian atau seluruh pinjaman tersebut DEBITUR dikenakan penalty sebesar 1% (satu perseratus) yang dihitung dari sisa Pokok Pinjaman DEBITUR yang tertera pada pembukuan pihak BANK.</p>
    </div>
  </div>

  <div class="my-8">
    <div class="my-3 text-center font-bold">
      <p>PASAL 8</p>
      <p>SYARAT & KETENTUAN</p>
    </div>

    <div class="flex gap-2">
      <p class="w-4">1.</p>
      <div class="flex-1">
        <p>BANK berhak untuk sewaktu-waktu menghentikan dan memutuskan perjanjian ini dengan mengesampingkan ketentuan-ketentuan Pasal 1266 dan Pasal 1267 Kitab Undang-Undang Hukum Perdata sehingga tidak diperlukan lagi suatu surat pemberitahuan (Somasi) atau surat peringatan dari juru sita atau surat lain yang serupa itu, dalam hal demikian seluruh hutang DEBITUR kepada BANK harus dibayar seketika dan sekaligus, yaitu dalam hal terjadi salah satu kejadian dibawah ini :</p>
        ${ListStyle(
          [
            "Bilamana DEBITUR menggunakan fasilitas pinjaman ini menyimpang dari tujuan penggunaan yang telah disetujui oleh BANK;",
            "Bilamana DEBITUR lalai atau tidak memenuhi syarat-syarat atau ketentuan-ketentuan / kewajibankewajiban yang dimaksud dalam Perjanjian ini dan atau perubahan/tambahan dan atau perjanjian-perjanjian pengikatan jaminan;",
            "Bilamana menurut pertimbangan BANK keadaan keuangan, bonafiditas dan solvabilitas DEBITUR mundur sedemikian rupa sehingga DEBITUR tidak dapat membayar hutangnya;",
            "Bilamana DEBITUR menanggung hutang pihak ketiga tanpa persetujuan tertulis terlebih dahulu dari BANK;",
            "Bilamana pernyataan-pernyataan, surat-surat, keterangan-keterangan yang diberikan DEBITUR kepada BANK ternyata tidak benar;",
            "Bilamana menurut pertimbangan BANK ada hal-hal lain yang meragukan pengembalian pelunasan kredit tersebut;",
          ],
          "lower-alpha",
        )}
      </div>
    </div>
    <div class="flex gap-2">
      <p class="w-4">2.</p>
      <p class="flex-1">Bahwa segala pembukuan/catatan yang dibuat oleh BANK menjadi tanda bukti yang mengikat dan sah atas jumlah hutang DEBITUR kepada BANK.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">3.</p>
      <p class="flex-1">Apabila DEBITUR meninggal dunia, maka semua hutang dan kewajiban DEBITUR kepada BANK yang timbul berdasarkan Perjanjian ini berikut semua perubahannya dikemudian dan atau berdasarkan apapun juga tetap merupakan satu kesatuan hutang dari para ahli waris DEBITUR atau PENANGGUNG (jika ada).</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">4.</p>
      <p class="flex-1">DEBITUR dengan ini berjanji, akan tunduk kepada segala ketentuan dan sesuai dengan ketentuan peraturan perundang-undangan termasuk ketentuan peraturan Otoritas Jasa Keuangan.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">5.</p>
      <p class="flex-1">Perjanjian ini telah disesuaikan dengan ketentuan peraturan perundang-undangan termasuk ketentuan peraturan Otoritas Jasa Keuangan.</p>
    </div>
  </div>

  <div class="my-8">
    <div class="my-3 text-center font-bold">
      <p>PASAL 9</p>
      <p>KOMUNIKASI DAN PEMBERITAHUAN</p>
    </div>

    <p>Setiap pemberitahuan atau komunikasi lainnya yang berhubungan dengan Perjanjian Pembiayaan ini dapat dikirimkan ke alamat sebagai berikut:</p>

    <div class="ml-4 my-3">
      <p class="font-bold">${process.env.NEXT_PUBLIC_APP_COMPANY_NAME}</p>
      <div class="flex gap-2">
        <p class="w-44">Up</p>
        <p class="w-4">:</p>
        <p class="flex-1">${process.env.NEXT_PUBLIC_APP_PIC}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-44">Alamat</p>
        <p class="w-4">:</p>
        <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_ADDRESS_SK}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-44">Email</p>
        <p class="w-4">:</p>
        <p class="flex-1">${process.env.NEXT_PUBLIC_APP_COMPANY_EMAIL}</p>
      </div>
    </div>

    <div class="ml-4 my-3">
      <p class="font-bold">${record.ProdukPembiayaan.Sumdan.name}</p>
      <div class="flex gap-2">
        <p class="w-44">Up</p>
        <p class="w-4">:</p>
        <div class="flex-1">
          <p>${record.ProdukPembiayaan.Sumdan.pic1}</p>
          <p>${record.ProdukPembiayaan.Sumdan.pic2}</p>
        </div>
      </div>
      <div class="flex gap-2">
        <p class="w-44">Alamat</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.ProdukPembiayaan.Sumdan.address}</p>
      </div>
      <div class="flex gap-2">
        <p class="w-44">Email</p>
        <p class="w-4">:</p>
        <p class="flex-1">${record.ProdukPembiayaan.Sumdan.email}</p>
      </div>
    </div>

  </div>

  <div class="my-8">
    <div class="my-3 text-center font-bold">
      <p>PASAL 10</p>
      <p>DOMISILI HUKUM</p>
    </div>

    <p>Segala perselisihan dan perbedaan pendapat yang mungkin timbul di antara Para Pihak dalam melaksanakan Perjanjian ini, akan diselesaikan terlebih dahulu secara musyawarah untuk mencapai mufakat. Namun apabila tidak berhasil mencapai mufakat, maka Para Pihak sepakat akan menyelesaikan perselisihan tersebut melalui Pengadilan. Para Pihak sepakat memilih tempat kedudukan hukum yang tetap dan seumumnya di Kantor Kepaniteraan Pengadilan Negeri Tabanan, namun tidak mengurangi hak BANK untuk mengajukan tuntutan hukum kepada DEBITUR untuk mengajukan gugatan atau memohon pelaksanaan eksekusi jaminan berdasarkan Perjanjian ini melalui pengadilan lain di dalam wilayah negara Republik Indonesia.</p>
  </div>

  <div class="my-8">
    <div class="my-3 text-center font-bold">
      <p>PASAL 11</p>
      <p>KEADAAN MEMAKSA (FORCE MAJEURE)</p>
    </div>

    <p>Terjadinya peristiwa yang diluar kekuasaan kemampuan ${record.ProdukPembiayaan.Sumdan.name} (Force Majeure atau Overmacht) antara lain keadaan yang diakibatkan bencana alam dan non bencana alam seperti keadaan krisis atau kemacetan likuiditas sebagai akibat dari perubahan kebijakan pemerintah dibidang moneter dan fiskal atau telah sesuai dengan unsur-unsur keadaan memaksa (Force Majeure) dan peraturan tentang keadaan memaksa (Force Majeure) yakni pasal 1244 dan pasal 1245 Kitab Undang-Undang Hukum Perdata (KUHP), dimana peraturan dimaksud tersebut terlebih dahulu harus diumumkan pemerintah (Regulator) secara resmi.</p>
  </div>

  <div class="my-8">
    <div class="my-3 text-center font-bold">
      <p>PASAL 12</p>
      <p>LAIN - LAIN</p>
    </div>

    <div class="flex gap-2">
      <p class="w-4">1.</p>
      <p class="flex-1">Sebelum Akad ini ditandatangani oleh DEBITUR, DEBITUR mengakui dengan sebenarnya, bahwa DEBITUR telah membaca dengan cermat atau dibacakan kepada DEBITUR, sehingga oleh karena itu DEBITUR memahami sepenuhnya segala yang akan menjadi akibat hukum setelah DEBITUR menandatangani Perjanjian Pembiayaan ini.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">2.</p>
      <p class="flex-1">Apabila ada hal-hal yang belum diatur atau belum cukup diatur dalam Perjanjian Pembiayaan ini, maka DEBITUR dan BANK akan mengaturnya Bersama secara musyawarah untuk mufakat dalam suatu Addendum.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">3.</p>
      <p class="flex-1">Mengenai Perjanjian ini dan segala dokumen yang berhubungan dan yang timbul akibat Perjanjian ini, termasuk namun tidak terbatas pada perjanjian-perjanjian jaminan, ditafsirkan dan tunduk pada ketentuan hukum Negara Republik Indonesia.</p>
    </div>
    <div class="flex gap-2">
      <p class="w-4">4.</p>
      <p class="flex-1">Perjanjian ini dapat diubah atau diperbaharui dengan syarat adanya persetujuan dari Para Pihak terlebih dahulu dan akan dibuatkan perubahan perjanjian atau addendum yang menjadi satu kesatuan dan tidak terpisahkan dari Perjanjian ini.</p>
    </div>
  </div>

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
