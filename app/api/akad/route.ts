import { GetAngsuran } from "@/components/utils/PembiayaanUtil";
import prisma from "@/libs/Prisma";
import { Angsuran, Dapem } from "@prisma/client";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const data: { id: string; date_contract: Date; no_contract: string } =
    await req.json();
  const find = await prisma.dapem.findFirst({
    where: { id: data.id },
    include: { Angsuran: true },
  });

  if (!find)
    return NextResponse.json(
      { msg: "Dapem ID tidak ditemukan!", status: 400 },
      { status: 400 },
    );
  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.dapem.update({
        where: { id: data.id },
        data: {
          date_contract: data.date_contract,
          no_contract: data.no_contract,
        },
      });
      const generateAngsurans = GenerateTableAngsuran({
        ...find,
        date_contract: data.date_contract,
        no_contract: data.no_contract,
      });
      await tx.angsuran.deleteMany({ where: { dapemId: data.id } });
      const newAngsurans =
        find.Angsuran && find.Angsuran.length !== 0
          ? generateAngsurans.map((item) => ({
              ...item,
              date_paid:
                find.Angsuran.find((a) => a.counter === item.counter)
                  ?.date_paid || null,
            }))
          : generateAngsurans;
      await tx.angsuran.createMany({
        data: newAngsurans,
      });
      return newAngsurans;
    });
    result.unshift({
      id: "",
      counter: 0,
      date_pay: moment(data.date_contract).toDate(),
      date_paid: null,
      dapemId: "",
      principal: 0,
      margin: 0,
      remaining: find.plafond,
      inst_sumdan: 0,
      fee_banpot: 0,
    });
    return NextResponse.json(
      { msg: "Berhasil memperbarui data akad!", status: 200, data: result },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { msg: "Terjadi kesalahan pada server!", status: 500 },
      { status: 500 },
    );
  }
};

function GenerateTableAngsuran(dapem: Dapem) {
  if (dapem.margin_type === "FLAT") {
    return GenerateFlat(dapem);
  } else {
    return GenerateAnuitas(dapem);
  }
}

function GenerateAnuitas(dapem: Dapem): Angsuran[] {
  const prefix = `${dapem.id}TX`;
  const padLength = 3;

  let angsurans: Angsuran[] = [];

  const angsuran = GetAngsuran(
    dapem.plafond,
    dapem.tenor,
    dapem.c_margin + dapem.c_margin_sumdan,
    dapem.margin_type,
    dapem.rounded,
  ).angsuran;
  let sisa = dapem.plafond;

  for (let i = 1; i <= dapem.tenor; i++) {
    const newId = `${prefix}${String(i).padStart(padLength, "0")}`;
    const bungaBulan = Math.round(
      sisa * ((dapem.c_margin + dapem.c_margin_sumdan) / 12 / 100),
    );
    const pokok = angsuran - bungaBulan;
    sisa -= pokok;

    if (sisa < 0) sisa = 0;

    angsurans.push({
      id: newId,
      counter: i,
      date_paid:
        i <= dapem.c_blokir ? moment(dapem.date_contract).toDate() : null,
      date_pay: moment(dapem.date_contract).add(i, "month").toDate(),
      principal: pokok,
      margin: bungaBulan,
      remaining: sisa,
      dapemId: dapem.id,
      inst_sumdan: 0,
      fee_banpot: 0,
    });
  }
  return angsurans;
}
function GenerateFlat(dapem: Dapem): Angsuran[] {
  const prefix = `${dapem.id}TX`;
  const padLength = 3;

  let angsurans: Angsuran[] = [];

  const angsuran = GetAngsuran(
    dapem.plafond,
    dapem.tenor,
    dapem.c_margin + dapem.c_margin_sumdan,
    dapem.margin_type,
    dapem.rounded,
  ).angsuran;
  let sisa = dapem.plafond;

  for (let i = 1; i <= dapem.tenor; i++) {
    const newId = `${prefix}${String(i).padStart(padLength, "0")}`;
    const pokok = dapem.plafond / dapem.tenor;
    sisa -= pokok;

    if (sisa < 0) sisa = 0;

    angsurans.push({
      id: newId,
      counter: i,
      date_paid:
        i <= dapem.c_blokir ? moment(dapem.date_contract).toDate() : null,
      date_pay: moment(dapem.date_contract).add(i, "month").toDate(),
      principal: pokok,
      margin: angsuran - pokok,
      remaining: sisa,
      dapemId: dapem.id,
    });
  }
  return angsurans;
}
