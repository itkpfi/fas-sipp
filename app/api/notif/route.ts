import { getSession } from "@/libs/Auth";
import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ data: null, status: 400 }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json({ data: null, status: 400 }, { status: 400 });

  try {
    const [
      draft,
      verif,
      slik,
      approv,
      akad,
      printSI,
      SI,
      printSD,
      SD,
      printTTPJ,
      TTPJ,
      pelunasan,
    ] = await prisma.$transaction([
      prisma.dapem.count({
        where: {
          status: true,
          dropping_status: "DRAFT",
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
      }),
      prisma.dapem.count({
        where: {
          status: true,
          dropping_status: "PENDING",
          verif_status: "PENDING",
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
      }),
      prisma.dapem.count({
        where: {
          status: true,
          dropping_status: "PENDING",
          slik_status: "PENDING",
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
      }),
      prisma.dapem.count({
        where: {
          status: true,
          dropping_status: "PENDING",
          approv_status: "PENDING",
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
      }),
      prisma.dapem.count({
        where: {
          status: true,
          dropping_status: "PROCCESS",
          approv_status: "APPROVED",
          file_contract: null,
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
      }),
      prisma.dapem.count({
        where: {
          status: true,
          dropping_status: "PROCCESS",
          approv_status: "APPROVED",
          file_contract: { not: null },
          droppingId: null,
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
      }),
      prisma.dropping.count({
        where: {
          status: false,
          ...(user.sumdanId && { sumdanId: user.sumdanId }),
        },
      }),
      prisma.dapem.count({
        where: {
          status: true,
          dropping_status: "APPROVED",
          berkasId: null,
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
      }),
      prisma.berkas.count({
        where: {
          status: "DELIVERY",
          ...(user.sumdanId && { sumdanId: user.sumdanId }),
        },
      }),
      prisma.dapem.count({
        where: {
          status: true,
          dropping_status: "APPROVED",
          jaminanId: null,
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
      }),
      prisma.jaminan.count({
        where: {
          status: "DELIVERY",
          ...(user.sumdanId && { sumdanId: user.sumdanId }),
        },
      }),
      prisma.pelunasan.count({
        where: {
          ...(user.sumdanId && {
            Dapem: { ProdukPembiayaan: { sumdanId: user.sumdanId } },
          }),
          OR: [
            { status_paid: "PENDING" },
            { guarantee_status: { not: { in: ["PUSAT", "UNIT"] } } },
          ],
        },
      }),
    ]);

    return NextResponse.json(
      {
        data: {
          draft,
          verif,
          slik,
          approv,
          akad,
          printSI,
          SI,
          printSD,
          SD,
          printTTPJ,
          TTPJ,
          pelunasan,
        },
        status: 200,
      },
      { status: 200 },
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      data: {
        draft: 0,
        verif: 0,
        slik: 0,
        approv: 0,
        akad: 0,
        printSI: 0,
        SI: 0,
        printSD: 0,
        SD: 0,
        printTTPJ: 0,
        TTPJ: 0,
        pelunasan: 0,
      },
    });
  }
};
