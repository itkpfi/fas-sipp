import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import { getSession } from "@/libs/Auth";
import prisma from "@/libs/Prisma";
import { EDapemStatus, Sumdan } from "@prisma/client";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const page = request.nextUrl.searchParams.get("page") || "1";
  const include = request.nextUrl.searchParams.get("include");
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

  const dapemWhere = {
    status: true,
    dropping_status: { in: [EDapemStatus.APPROVED, EDapemStatus.PAID_OFF] },
    ...(backdate && {
      Dropping: {
        process_at: {
          gte: moment(backdate.split(",")[0]).toDate(),
          lte: moment(backdate.split(",")[1]).toDate(),
        },
      },
    }),
    ...(areaId && {
      AO: {
        Cabang: {
          areaId,
        },
      },
    }),
  };

  const find = await prisma.sumdan.findMany({
    where: {
      ...(search && {
        OR: [{ name: { contains: search } }, { code: { contains: search } }],
      }),
      ...(user.sumdanId && { id: user.sumdanId }),
      ...(areaId && {
        ProdukPembiayaan: {
          some: {
            Dapem: {
              some: dapemWhere,
            },
          },
        },
      }),
      status: true,
    },
    skip: skip,
    take: parseInt(limit),
    include: {
      ProdukPembiayaan: {
        where: { status: true },
        ...(include && {
          include: {
            Dapem: {
              where: dapemWhere,
              include: { Angsuran: true },
            },
          },
        }),
      },
    },
  });

  const total = await prisma.sumdan.count({
    where: {
      ...(search && {
        OR: [{ name: { contains: search } }, { code: { contains: search } }],
      }),
      ...(user.sumdanId && { id: user.sumdanId }),
      status: true,
    },
  });

  return NextResponse.json({
    status: 200,
    data: serializeForApi(find),
    total: total,
  });
};

export const POST = async (request: NextRequest) => {
  const body: Sumdan = await request.json();
  const { id, ...saved } = body;
  try {
    const generateId = await generateSumdanId();
    await prisma.sumdan.create({
      data: { id: generateId, ...saved },
    });
    return NextResponse.json({
      status: 201,
      msg: "Berhasil menyimpan data sumdan.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      msg: "Gagal menyimpan data sumdan. internal server error.",
    });
  }
};

export const PUT = async (request: NextRequest) => {
  const body: Sumdan = await request.json();
  const { id, ...updated } = body;
  try {
    await prisma.sumdan.update({
      where: { id: id },
      data: { ...updated, updated_at: new Date() },
    });
    return NextResponse.json({
      status: 200,
      msg: "Berhasil memperbarui data sumdan.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      msg: "Gagal memperbarui data sumdan. internal server error.",
    });
  }
};

export const DELETE = async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get("id") || "";
  try {
    await prisma.sumdan.update({
      where: { id: id },
      data: { status: false, updated_at: new Date() },
    });
    return NextResponse.json({
      status: 200,
      msg: "Berhasil menghapus data sumdan.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      msg: "Gagal menghapus data sumdan. internal server error.",
    });
  }
};

export const PATCH = async (request: NextRequest) => {
  const page = request.nextUrl.searchParams.get("page") || "1";
  const limit = request.nextUrl.searchParams.get("limit") || "50";
  const search = request.nextUrl.searchParams.get("search") || "";
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const session = await getSession();

  if (!session)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });
  const user = await prisma.user.findFirst({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });

  const find = await prisma.sumdan.findMany({
    where: {
      ...(search && {
        OR: [{ name: { contains: search } }, { code: { contains: search } }],
      }),
      ...(user.sumdanId && { id: user.sumdanId }),
      status: true,
    },
    skip: skip,
    take: parseInt(limit),
    include: {
      ProdukPembiayaan: { where: { status: true }, include: { Sumdan: true } },
    },
  });

  const total = await prisma.sumdan.count({
    where: {
      ...(search && {
        OR: [{ name: { contains: search } }, { code: { contains: search } }],
      }),
      ...(user.sumdanId && { id: user.sumdanId }),
      status: true,
    },
  });

  return NextResponse.json({
    status: 200,
    data: serializeForApi(find),
    total: total,
  });
};

export async function generateSumdanId() {
  const prefix = "MITRA";
  const padLength = 2;
  const lastRecord = await prisma.sumdan.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
