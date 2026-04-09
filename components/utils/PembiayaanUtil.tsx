import moment from "moment";
import { PV } from "@formulajs/formulajs";
import { EMarginType } from "@prisma/client";
import { IDapem } from "@/libs/IInterfaces";

export const IDRFormat = (number: number) => {
  const temp = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    style: "decimal",
    currency: "IDR",
  }).format(number);
  return temp;
};

export const IDRToNumber = (str: string) => {
  return parseInt(str.replace(/\D/g, ""));
};

export function GetFullAge(startDate: Date, endDate: Date) {
  const momentBirthdate = moment(startDate);
  const dateNow = moment(endDate);

  const durasi = moment.duration(dateNow.diff(momentBirthdate));

  const year = durasi.years();
  const month = durasi.months();
  const day = durasi.days();

  return { year, month, day };
}

export function GetMaxTenor(
  max_usia: number,
  usia_tahun: number,
  usia_bulan: number,
) {
  const tmp = max_usia - usia_tahun;
  const max_tenor = usia_tahun <= max_usia ? tmp * 12 - (usia_bulan + 1) : 0;
  return max_tenor;
}

export function GetMaxPlafond(
  mg_bunga: number,
  tenor: number,
  max_angsuran: number,
) {
  const maxPlafond =
    Number(PV(mg_bunga / 100 / 12, tenor, max_angsuran, 0, 0)) * -1;
  return maxPlafond;
}

export const GetAngsuran = (
  plafond: number,
  tenor: number,
  bunga: number,
  type: EMarginType,
  rounded: number,
  round?: boolean,
) => {
  if (type === "FLAT") {
    const pokok = plafond / tenor;
    const margin = (plafond * (bunga / 100)) / 12;
    const angsuran = pokok + margin;
    return {
      pokok,
      margin,
      angsuran: round
        ? Math.round(angsuran / rounded) * rounded
        : Math.ceil(angsuran / rounded) * rounded,
    };
  } else if (type === "ANUITAS") {
    const r = bunga / 12 / 100;

    const angsuran =
      (plafond * (r * Math.pow(1 + r, tenor))) / (Math.pow(1 + r, tenor) - 1);
    const pokok = plafond / tenor;
    const margin = angsuran - pokok;

    return {
      angsuran: round
        ? Math.round(angsuran / rounded) * rounded
        : Math.ceil(angsuran / rounded) * rounded,
      pokok,
      margin,
    };
  } else {
    return {
      pokok: 0,
      margin: 0,
      angsuran: 0,
    };
  }
};

export const GetBiaya = (data: IDapem) => {
  const adm = data.plafond * ((data.c_adm + data.c_adm_sumdan) / 100);
  const asuransi = data.plafond * (data.c_insurance / 100);
  const angs = GetAngsuran(
    data.plafond,
    data.tenor,
    data.c_margin + data.c_margin_sumdan,
    data.margin_type,
    data.rounded,
  ).angsuran;
  const blok = data.c_blokir * angs;
  return (
    adm +
    asuransi +
    data.c_gov +
    data.c_account +
    data.c_stamp +
    data.c_mutasi +
    data.c_infomation +
    data.c_provisi +
    blok
  );
};

export const GetSisaPokokMargin = (data: IDapem) => {
  const periode = data.Angsuran.find((d) =>
    moment(d.date_pay).isSame(moment().toDate(), "month"),
  );
  const prev = data.Angsuran.filter(
    (d) =>
      moment(d.date_pay).isBefore(moment().toDate(), "month") &&
      d.date_paid === null,
  );
  return {
    principal: periode
      ? periode.date_paid
        ? periode.remaining
        : periode.remaining + periode.principal
      : data.plafond,
    count: periode
      ? periode.date_paid
        ? periode.counter
        : periode.counter + 1
      : 1,
    prevcount: periode
      ? periode.date_paid
        ? prev.length
        : prev.length + 1
      : 0,
    prevvalueprincipal: periode
      ? periode.date_paid
        ? prev.reduce((acc, curr) => acc + curr.principal, 0)
        : prev.reduce((acc, curr) => acc + curr.principal, 0) +
          periode.principal
      : 0,
    prevvalueall: periode
      ? periode.date_paid
        ? prev.reduce((acc, curr) => acc + curr.principal + curr.margin, 0)
        : prev.reduce((acc, curr) => acc + curr.principal + curr.margin, 0) +
          periode.margin +
          periode.principal
      : 0,
    install: periode ? periode.principal + periode.margin : 0,
  };
};

export function GetRoman(number: number): string {
  const romawi = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ];
  return romawi[number - 1] || "";
}

export function serializeForApi<T>(data: T): T {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}
