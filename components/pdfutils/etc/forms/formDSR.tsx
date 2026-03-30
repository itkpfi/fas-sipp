import { IDapem } from "@/libs/IInterfaces";
import { Header, ListNonStyle, ListStyle } from "../../utils";
import moment from "moment";

export const FormDSR = (record?: IDapem) => {
  return `
    <div>
      ${Header("SURAT PERNYATAN", "PEMOTONGAN GAJI DIATAS 70%", undefined, process.env.NEXT_PUBLIC_APP_LOGO, process.env.NEXT_PUBLIC_APP_LOGO)}
      <p class="mt-3">Yang bertanda tangan dibawah ini :</p>
      <div class="my-5">
        ${ListNonStyle([
          { key: "Nama Lengkap", value: record?.Debitur.fullname || "" },
          { key: "Nomor Pensiun", value: record?.Debitur.nopen || "" },
          { key: "Nomor NIK", value: record?.Debitur.nik || "" },
          {
            key: "Tempat Tanggal Lahir",
            value: record
              ? `${record.Debitur.birthplace}, ${moment(record.Debitur.birthdate).format("DD-MM-YYYY")}`
              : "",
          },
          {
            key: "Alamat",
            value: record
              ? `${record?.Debitur.address}, KELURAHAN ${record?.Debitur.ward} KECAMATAN ${record?.Debitur.district}, ${record?.Debitur.city} ${record?.Debitur.province} ${record?.Debitur.pos_code}`
              : "",
          },
        ])}
      </div>
      <p>Sehubungan saya memerlukan dana yang cukup besar, dengan ini saya menyatakan :</p>
      <div class="my-2">
        ${ListStyle(
          [
            `<p>Bersedia membayar angsuran pembiayaan kepada ${process.env.NEXT_PUBLIC_APP_FULLNAME} sebesar diatas 70% (Tujuh puluh persen) dari gaji pensiun yang saya terima setiap bulan, hal ini dikarenakan :</p>
            <div>${ListStyle(
              [
                `Saya memiliki penghasilan lain dari gaji pensiun.`,
                `Saya mendapatkan tunjangan dari keluarga (anak-anak) setiap bulan yang jumlahnya dapat menutupi kekurangan jika sisa gaji pensiun tidak mencukupi untuk kebutuhan sehari-hari.`,
              ],
              "lower-alpha",
            )}</div>
          `,
            `Saya bertanggung jawab atas pengambilan sisa gaji saya setiap bulannya di Kantor Bayar tempat gaji saya dibayarkan.`,
          ],
          "number",
        )}
      </div>
      <p class="my-2">
        Demikian surat pernyataan ini dibuat dengan sebenarnya dengan dilandasi itikad baik tanpa paksaan dari siapapun dan pihak manapun.
      </p>

      <div class="flex gap-4 justify-around font-bold text-center mt-10">
        <div class="w-52">
          <p>${record ? record?.Debitur.city?.toLocaleLowerCase().replace("kota", "").replace("kabupaten", "").toUpperCase() : ".................."}, ${record ? moment(record?.created_at).format("DD-MM-YYYY") : "............................."}</p>
          <p>Yang membuat pernyataan</p>
          <div class="h-36 flex justify-center items-center">
            <p class="text-xs opacity-70">Materai</p>
          </div>
          <p class="border-b h-5">${record?.Debitur.fullname || ""}</p>
          <p class="h-32">DEBITUR</p>
        </div>
        <div class="w-52">
          <p class="h-5"></p>
          <p>Mengetahui</p>
          <div class="h-36"></div>
          <p class="border-b h-5">${record?.AO.fullname || ""}</p>
          <p class="h-5">MOC/SPV/KORWIL</p>
        </div>
      </div>
    </div>
  `;
};
