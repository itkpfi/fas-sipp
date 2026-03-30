import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import { getSession } from "@/libs/Auth";
import { IPelunasan } from "@/libs/IInterfaces";
import prisma from "@/libs/Prisma";
import { ESettleStatus, ESubmissionStatus } from "@prisma/client";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const page = req.nextUrl.searchParams.get("page") || "1";
  const limit = req.nextUrl.searchParams.get("limit") || "50";
  const search = req.nextUrl.searchParams.get("search") || "";
  const type = req.nextUrl.searchParams.get("type");
  const status_paid = req.nextUrl.searchParams.get("status_paid");
  const sumdanId = req.nextUrl.searchParams.get("sumdanId");
  const backdate = req.nextUrl.searchParams.get("backdate");
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const session = await getSession();
  if (!session)
    return NextResponse.json(
      { data: [], total: 0, status: 200 },
      { status: 200 },
    );
  const user = await prisma.user.findFirst({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json(
      { data: [], total: 0, status: 200 },
      { status: 200 },
    );

  const data = await prisma.pelunasan.findMany({
    where: {
      ...(search && {
        Dapem: {
          OR: [
            { no_contract: { contains: search } },
            {
              Debitur: {
                OR: [
                  { fullname: { contains: search } },
                  { nopen: { contains: search } },
                  { no_skep: { contains: search } },
                  { name_skep: { contains: search } },
                  { account_number: { contains: search } },
                ],
              },
            },
          ],
        },
      }),
      ...(type && { type: type as ESettleStatus }),
      ...(status_paid && { status_paid: status_paid as ESubmissionStatus }),
      ...(sumdanId && { Dapem: { ProdukPembiayaan: { sumdanId } } }),
      ...(backdate && {
        created_at: {
          gte: moment(backdate.split(",")[0]).toDate(),
          lte: moment(backdate.split(",")[1]).toDate(),
        },
      }),
      ...(user.sumdanId && {
        Dapem: {
          ProdukPembiayaan: {
            sumdanId: user.sumdanId,
          },
        },
      }),
    },
    skip: skip,
    take: parseInt(limit),
    orderBy: {
      created_at: "desc",
    },
    include: {
      Dapem: {
        include: {
          Debitur: true,
          ProdukPembiayaan: { include: { Sumdan: true } },
          JenisPembiayaan: true,
          CreatedBy: {
            include: {
              Cabang: {
                include: {
                  Area: true,
                },
              },
            },
          },
          AO: {
            include: {
              Cabang: {
                include: {
                  Area: true,
                },
              },
            },
          },
          Berkas: true,
          Jaminan: true,
          Angsuran: true,
          Dropping: true,
          Pelunasan: true,
        },
      },
    },
  });

  const total = await prisma.pelunasan.count({
    where: {
      ...(search && {
        Dapem: {
          OR: [
            { no_contract: { contains: search } },
            {
              Debitur: {
                OR: [
                  { fullname: { contains: search } },
                  { nopen: { contains: search } },
                  { no_skep: { contains: search } },
                  { name_skep: { contains: search } },
                  { account_number: { contains: search } },
                ],
              },
            },
          ],
        },
      }),
      ...(type && { type: type as ESettleStatus }),
      ...(status_paid && { status_paid: status_paid as ESubmissionStatus }),
      ...(sumdanId && { Dapem: { ProdukPembiayaan: { sumdanId } } }),
      ...(backdate && {
        created_at: {
          gte: moment(backdate.split(",")[0]).toDate(),
          lte: moment(backdate.split(",")[1]).toDate(),
        },
      }),
      ...(user.sumdanId && {
        Dapem: {
          ProdukPembiayaan: {
            sumdanId: user.sumdanId,
          },
        },
      }),
    },
  });

  return NextResponse.json(
    { msg: "OK", status: 200, data: serializeForApi(data), total },
    { status: 200 },
  );
};

export const POST = async (req: NextRequest) => {
  const data: IPelunasan = await req.json();
  try {
    const { id, Dapem, ...saved } = data;
    const genId = await generatePelunasanId();
    await prisma.pelunasan.create({ data: { ...saved, id: genId } });

    return NextResponse.json(
      { msg: "Data pelunasan berhasil ditambahkan", status: 200 },
      { status: 200 },
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { msg: "Internal Server Error", status: 500 },
      { status: 500 },
    );
  }
};

export const PUT = async (req: NextRequest) => {
  const data: IPelunasan = await req.json();
  try {
    const { id, Dapem, ...saved } = data;
    await prisma.$transaction([
      prisma.pelunasan.update({
        where: { id },
        data: saved,
      }),
      prisma.dapem.update({
        where: { id: Dapem.id },
        data: {
          dropping_status:
            data.status_paid === "APPROVED" ? "PAID_OFF" : "APPROVED",
        },
      }),
    ]);

    return NextResponse.json(
      { msg: "Data pelunasan berhasil diperbarui", status: 200 },
      { status: 200 },
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { msg: "Internal Server Error", status: 500 },
      { status: 500 },
    );
  }
};

export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json(
      { msg: "Not Found", status: 404 },
      { status: 404 },
    );
  await prisma.pelunasan.delete({ where: { id } });

  return NextResponse.json(
    { msg: "Data pelunasan berhasil dihapus", status: 200 },
    { status: 200 },
  );
};

export const PATCH = async (req: NextRequest) => {
  const data = await prisma.dapem.findMany({
    where: {
      OR: [{ Pelunasan: null }, { Pelunasan: { status_paid: "REJECTED" } }],
      status: true,
      dropping_status: "APPROVED",
    },
    include: {
      Debitur: true,
      ProdukPembiayaan: { include: { Sumdan: true } },
      JenisPembiayaan: true,
      CreatedBy: {
        include: {
          Cabang: {
            include: {
              Area: true,
            },
          },
        },
      },
      AO: {
        include: {
          Cabang: {
            include: {
              Area: true,
            },
          },
        },
      },
      Berkas: true,
      Jaminan: true,
      Angsuran: true,
      Dropping: true,
      Pelunasan: true,
    },
  });

  return NextResponse.json(
    { data: serializeForApi(data), msg: "OK", status: 200 },
    { status: 200 },
  );
};

async function generatePelunasanId() {
  const prefix = `PAID`;
  const padLength = 4;
  const lastRecord = await prisma.pelunasan.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
