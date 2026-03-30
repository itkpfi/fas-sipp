import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import { getSession } from "@/libs/Auth";
import prisma from "@/libs/Prisma";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ data: null, status: 400 }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json({ data: null, status: 400 }, { status: 400 });

  const [alldata, droppingall, droppingmonthly, byjepem, sumdan] =
    await prisma.$transaction([
      prisma.dapem.findMany({
        where: {
          status: true,
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
      }),
      prisma.dapem.findMany({
        where: {
          dropping_status: { in: ["APPROVED", "PAID_OFF"] },
          status: true,
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
        include: {
          Dropping: true,
          Debitur: true,
          Angsuran: true,
        },
      }),
      prisma.dapem.findMany({
        where: {
          dropping_status: { in: ["APPROVED", "PAID_OFF"] },
          status: true,
          Dropping: {
            process_at: {
              gte: moment().startOf("month").toDate(),
              lte: moment().endOf("month").toDate(),
            },
          },
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
        include: {
          Dropping: true,
          Debitur: true,
          Angsuran: {
            where: { date_paid: null },
          },
        },
      }),
      prisma.jenisPembiayaan.findMany({
        include: {
          Dapem: {
            where: {
              dropping_status: { in: ["APPROVED", "PAID_OFF"] },
              status: true,
            },
          },
        },
      }),
      prisma.sumdan.findMany({
        include: {
          ProdukPembiayaan: {
            include: {
              Dapem: {
                where: {
                  dropping_status: { in: ["APPROVED", "PAID_OFF"] },
                  status: true,
                  ...(user.sumdanId && {
                    ProdukPembiayaan: { sumdanId: user.sumdanId },
                  }),
                },
              },
            },
          },
        },
      }),
    ]);

  const prevmonth = [];

  // Mulai dari bulan sekarang
  for (let i = 5; i >= 0; i--) {
    // .clone() sangat penting agar tidak merubah variabel bulan utama
    // .subtract(i, 'months') untuk mundur ke belakang
    const targetMonth = moment().subtract(i, "months");

    const temp = droppingall.filter((dp) => {
      return (
        dp.Dropping &&
        moment(dp.Dropping.process_at).isSame(targetMonth, "month") &&
        moment(dp.Dropping.process_at).isSame(targetMonth, "year")
      ); // Pastikan tahunnya juga sama
    });

    prevmonth.push({
      month: targetMonth.format("MMM YY"),
      data: temp,
    });
  }

  return NextResponse.json(
    {
      alldata: serializeForApi(alldata),
      droppingall: serializeForApi(droppingall),
      droppingmonthly: serializeForApi(droppingmonthly),
      prevmonth: serializeForApi(prevmonth),
      byjepem: serializeForApi(byjepem),
      bysumdan: serializeForApi(
        sumdan.map((s) => ({
          ...s,
          Dapem: s.ProdukPembiayaan.flatMap((p) => p.Dapem),
        })),
      ),
      status: 200,
    },
    { status: 200 },
  );
};
