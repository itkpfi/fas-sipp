import { getSession } from "@/libs/Auth";
import prisma from "@/libs/Prisma";

import { Area } from "@prisma/client";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const page = request.nextUrl.searchParams.get("page") || "1";
  const ao = request.nextUrl.searchParams.get("ao");
  const limit = request.nextUrl.searchParams.get("limit") || "50";
  const search = request.nextUrl.searchParams.get("search") || "";
  const backdate = request.nextUrl.searchParams.get("backdate");
  const areaId = request.nextUrl.searchParams.get("areaId") || "";
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const session = await getSession();
  if (!session)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });
  const user = await prisma.user.findFirst({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });

  const find = await prisma.area.findMany({
    where: {
      ...(areaId && { id: areaId }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { Cabang: { some: { name: { contains: search } } } },
        ],
      }),
      status: true,
    },
    skip: skip,
    take: parseInt(limit),
    orderBy: {
      updated_at: "desc",
    },
    include: {
      Cabang: {
        where: {
          status: true,
          ...(search && { name: { contains: search } }),
        },
        ...(ao && {
          include: {
            User: {
              where: { status: true, sumdanId: null },
              include: {
                AODapem: {
                  where: {
                    status: true,
                    ...(user.sumdanId && {
                      ProdukPembiayaan: { sumdanId: user.sumdanId },
                    }),
                    dropping_status: { in: ["APPROVED", "PAID_OFF"] },
                    ...(backdate && {
                      Dropping: {
                        process_at: {
                          gte: moment(backdate.split(",")[0]).toDate(),
                          lte: moment(backdate.split(",")[1]).toDate(),
                        },
                      },
                    }),
                  },
                },
              },
            },
          },
        }),
      },
    },
  });

  const total = await prisma.area.count({
    where: {
      ...(areaId && { id: areaId }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { Cabang: { some: { name: { contains: search } } } },
        ],
      }),
      status: true,
    },
  });

  return NextResponse.json({
    status: 200,
    data: find,
    total: total,
  });
};

export const POST = async (request: NextRequest) => {
  const body: Area = await request.json();
  const { id, ...saved } = body;
  try {
    const generateId = await generateAreaId();
    await prisma.area.create({
      data: { id: generateId, ...saved },
    });
    return NextResponse.json({
      status: 201,
      msg: "Berhasil menyimpan data area.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      msg: "Gagal menyimpan data area. internal server error.",
    });
  }
};

export const PUT = async (request: NextRequest) => {
  const body: Area = await request.json();
  const { id, ...updated } = body;
  try {
    await prisma.area.update({
      where: { id: id },
      data: { ...updated, updated_at: new Date() },
    });
    return NextResponse.json({
      status: 200,
      msg: "Berhasil memperbarui data area.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      msg: "Gagal memperbarui data area. internal server error.",
    });
  }
};

export const DELETE = async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get("id") || "";
  try {
    await prisma.area.update({
      where: { id: id },
      data: { status: false, updated_at: new Date() },
    });
    return NextResponse.json({
      status: 200,
      msg: "Berhasil menghapus data area.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      msg: "Gagal menghapus data area. internal server error.",
    });
  }
};

export async function generateAreaId() {
  const prefix = "KW";
  const padLength = 2;
  const lastRecord = await prisma.area.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
