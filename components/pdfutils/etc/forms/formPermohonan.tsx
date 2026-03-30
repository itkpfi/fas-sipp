import { IDapem } from "@/libs/IInterfaces";
import { FormList } from "../../utils";
import moment from "moment";
import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";

export const FormPermohonan = (record?: IDapem) =>
  `<div class="flex justify-between gap-4 items-center p-1" style="background:orange;">
          <div class="bg-white p-1 h-16 w-20">
            <img src="${process.env.NEXT_PUBLIC_APP_LOGO || ""}" alt="Logo" class="w-full h-full" />
          </div>
          <div class="text-center font-bold text-lg text-white">
            <p>FORM PERMOHONAN PINJAMAN</p>
            <p>${process.env.NEXT_PUBLIC_APP_FULLNAME}</p>
          </div>
          <div class="bg-white p-1 h-16 w-20">
            ${record ? `<img src="${record.ProdukPembiayaan.Sumdan.logo}" alt="Logo" class="w-full h-full" />` : ""}
          </div>
        </div>

        <div class="flex gap-5">
          <div class="flex-1">
            ${FormList([
              {
                key: "Tanggal Permohonan",
                value: record
                  ? moment(record.created_at).format("DD-MM-YYY")
                  : "",
              },
              {
                key: "Unit Pelayanan",
                value: record
                  ? `${record.AO.Cabang.name} - ${record.AO.Cabang.Area.name}`
                  : "",
              },
            ])}
          </div>
          <div class="flex-1">
            ${FormList([
              {
                key: "MOC/SPV/KORWIL",
                value: record ? `${record.AO.fullname} (${record.AO.nip})` : "",
              },
              {
                key: "ADMIN",
                value: record
                  ? `${record.CreatedBy.fullname} (${record.CreatedBy.nip})`
                  : "",
              },
            ])}
          </div>
        </div>

        <div>
          <div style="background:orange;" class="p-1 text-center font-bold text-white my-1">
            <p>IDENTITAS PEMOHON</p>
          </div>
          <div class="flex gap-5">
            <div class="flex-1">
              ${FormList([
                { key: "Nama Lengkap", value: record?.Debitur.fullname || "" },
                { key: "Nomor NIK", value: record?.Debitur.nik || "" },
                {
                  key: "Tempat Tanggal Lahir",
                  value: record
                    ? `${record.Debitur.birthplace}, ${moment(record.Debitur.birthdate).format("DD-MM-YYYY")}`
                    : "",
                },
                {
                  key: "Jenis Kelamin",
                  value: record?.Debitur.gender || "",
                  option: ["Laki - laki", "Perempuan"],
                },
              ])}
            </div>
            <div class="flex-1">
              ${FormList([
                { key: "Agama", value: record?.Debitur.religion || "" },
                { key: "Pekerjaan", value: record?.job || "" },
                {
                  key: "Status Perkawinan",
                  value: record?.marriage_status || "",
                  option: ["Lajang", "Kawin", "Janda/Duda"],
                },
              ])}
            </div>
          </div>
        </div>

        <div class="flex gap-5">
          <div class="flex-1">
            <p class="font-bold mt-2 mb-1 underline text-center">Alamat KTP</p>
            ${FormList([
              { key: "Alamat", value: record?.Debitur.address || "" },
              { key: "Kelurahan", value: record?.Debitur.ward || "" },
              {
                key: "Kecamatan",
                value: record?.Debitur.district || "",
              },
              { key: "Kota", value: record?.Debitur.city || "" },
              { key: "Provinsi", value: record?.Debitur.province || "" },
              { key: "Kode Pos", value: record?.Debitur.pos_code || "" },
            ])}
          </div>
          <div class="flex-1">
            <p class="font-bold mt-2 mb-1 underline text-center">Alamat Domisili</p>
            ${FormList([
              {
                key: "Alamat",
                value: record?.address || record?.Debitur.address || "",
              },
              {
                key: "Kelurahan",
                value: record?.ward || record?.Debitur.ward || "",
              },
              {
                key: "Kecamatan",
                value: record?.district || record?.Debitur.district || "",
              },
              {
                key: "Kota",
                value: record?.city || record?.Debitur.city || "",
              },
              {
                key: "Provinsi",
                value: record?.province || record?.Debitur.province || "",
              },
              {
                key: "Kode Pos",
                value: record?.pos_code || record?.Debitur.pos_code || "",
              },
            ])}
          </div>
        </div>

        <div class="border-b my-2">
        </div>

        <div>
          ${FormList([
            {
              key: "Nama Ibu Kandung",
              value: record?.Debitur.mother_name || "",
            },
            {
              key: "Status Rumah",
              value: record?.house_status || "",
              option: [
                "Milik Sendiri",
                "Sewa",
                "Milik Keluarga",
                "Tidak Punya Rumah",
                "Lainnya",
              ],
            },
            {
              key: "Tahun Menempati",
              value: record?.house_year || "",
            },
            { key: "No Telepon", value: record?.Debitur.phone || "" },
          ])}
        </div>

        <div>
          <p class="font-bold mt-2 mb-1 underline text-center">Data Ahli Waris & Keluarga Tidak Serumah</p>
          <div class="flex gap-5">
            <div class="flex-1">
              ${FormList([
                {
                  key: "Nama Ahli waris",
                  value: record?.aw_name || "",
                },
                { key: "No Telepon", value: record?.aw_phone || "" },
                { key: "Alamat", value: record?.aw_address || "" },
                { key: "Hubungan", value: record?.aw_relate || "" },
              ])}
            </div>
            <div class="flex-1">
              ${FormList([
                {
                  key: "Nama Keluarga",
                  value: record?.f_name || "",
                },
                { key: "No Telepon", value: record?.f_phone || "" },
                { key: "Alamat", value: record?.f_address || "" },
                { key: "Hubungan", value: record?.f_relate || "" },
              ])}
            </div>
          </div>
        </div>

        <div style="background:orange;" class="p-1 text-center font-bold text-white my-1">
          <p>DATA PENSIUN</p>
        </div>
        <div class="flex gap-5">
          <div class="flex-1">
            ${FormList([
              { key: "Nomor Pensiun", value: record?.nopen || "" },
              { key: "Nomor SKEP", value: record?.Debitur.no_skep || "" },
              {
                key: "Tanggal SKEP",
                value: record
                  ? moment(record.Debitur.date_skep).format("DD-MM-YYYY")
                  : "",
              },
            ])}
          </div>
          <div class="flex-1">
            ${FormList([
              {
                key: "Kelompok Pensiun",
                value: record?.Debitur.group_skep || "",
              },
              {
                key: "Penerbi SKEP",
                value: record?.Debitur.publisher_skep || "",
              },
              {
                key: "Kantor Bayar",
                value: record?.Debitur.pay_office || "",
              },
            ])}
          </div>
        </div>

        <div style="background:orange;" class="p-1 text-center font-bold text-white my-1">
          <p>DATA PERMOHONAN PEMBIAYAAN</p>
        </div>
        <div>
          ${FormList([
            {
              key: "Produk Pembiayaan",
              value: record?.ProdukPembiayaan.name || "",
              option: ["Gold", "Platinum", "Platinum Lintas", "Platinum Plus"],
            },
            {
              key: "Jenis Pembiayaan",
              value: record?.JenisPembiayaan.name || "",
              option: [
                "SK On Hand",
                "Mutasi",
                "Takeover",
                "Mutasi Takeover",
                "Top up",
              ],
            },
            {
              key: "Instansi Takeover",
              value: record?.takeover_from || "",
            },
            {
              key: "Nominal Takeover",
              value: record?.takeover_from
                ? "Rp.  " + IDRFormat(record.c_takeover)
                : "",
            },
            {
              key: "Tujuan Pinjaman",
              value: record?.used_for || "",
            },
          ])}

          <div class="border-b my-2"></div>

          <div>
            ${FormList([
              {
                key: "Gaji Pensiun",
                value: record ? "Rp.  " + IDRFormat(record.Debitur.salary) : "",
              },
              {
                key: "Plafond Pembiayaan",
                value: record ? "Rp.  " + IDRFormat(record.plafond) : "",
              },
              {
                key: "Jangka Waktu",
                value: record ? record.tenor + " Bulan" : "",
              },
              {
                key: "Angsuran Perbulan",
                value: record
                  ? "Rp.  " +
                    IDRFormat(
                      GetAngsuran(
                        record.plafond,
                        record.tenor,
                        record.c_margin + record.c_margin_sumdan,
                        record.margin_type,
                        record.rounded,
                      ).angsuran,
                    )
                  : "",
              },
            ])}
          </div>

        </div>

        <p class="text-justify my-2">
          Demikian informasi yang diberikan sesuai dengan keadaan yg sebenarnya. Dan dengan ini saya menyatakan bersedia tunduk pada peraturan danpersyaratan dan ditentukan oleh ${process.env.NEXT_PUBLIC_APP_FULLNAME} termasuk mengizinkan untuk melakukan verifikasi data dan memeriksa seluruh informasi yang diperlukan.
        </p>

        <div class="flex gap-4 text-center font-bold">
          <div class="flex-1">
            <p>MOC</p>
            <div class="h-24"></div>
            <div class="border-b h-5"></div>
          </div>
          <div class="flex-1">
            <p>SPV</p>
            <div class="h-24"></div>
            <div class="border-b h-5"></div>
          </div>
          <div class="flex-1">
            <p>Pemohon</p>
            <div class="h-24"></div>
            <div class="border-b h-5">${record?.Debitur.fullname || ""}</div>
          </div>
          <div class="flex-1">
            <p>Ahli waris</p>
            <div class="h-24"></div>
            <div class="border-b h-5">${record?.aw_name || ""}</div>
          </div>
        </div>

        <div class="italic flex gap-8 text-xs mt-4">
          <p>NOTE :</p>
          <p>DIISI DENGAN HURUF CETAK DAN DIBERI TANDA [X] PADA KOTAK PILIHAN YANG SESUAI!</p>
        </div>`;
