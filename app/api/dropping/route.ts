import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import { getSession } from "@/libs/Auth";
import { IDropping } from "@/libs/IInterfaces";
import prisma from "@/libs/Prisma";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const page = req.nextUrl.searchParams.get("page") || "1";
  const limit = req.nextUrl.searchParams.get("limit") || "50";
  const search = req.nextUrl.searchParams.get("search") || "";
  const sumdanId = req.nextUrl.searchParams.get("sumdanId") || "";
  const status = req.nextUrl.searchParams.get("status");
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

  const find = await prisma.dropping.findMany({
    where: {
      ...(search && {
        OR: [
          { id: { contains: search } },
          {
            Dapem: {
              some: {
                Debitur: {
                  OR: [
                    { fullname: { contains: search } },
                    { nopen: { contains: search } },
                    { no_skep: { contains: search } },
                  ],
                },
              },
            },
          },
        ],
      }),
      ...(sumdanId && { sumdanId: sumdanId }),
      ...(backdate && {
        created_at: {
          gte: moment(backdate.split(",")[0]).toDate(),
          lte: moment(backdate.split(",")[1]).toDate(),
        },
      }),
      ...(user.sumdanId && { sumdanId: user.sumdanId }),
      ...(status && { status: status === "true" ? true : false }),
    },
    skip: skip,
    take: parseInt(limit),
    orderBy: {
      created_at: "desc",
    },
    include: {
      Sumdan: true,
      Dapem: {
        include: {
          Debitur: true,
          ProdukPembiayaan: true,
          JenisPembiayaan: true,
        },
      },
    },
  });

  const total = await prisma.dropping.count({
    where: {
      ...(search && {
        OR: [
          { id: { contains: search } },
          {
            Dapem: {
              some: {
                Debitur: {
                  OR: [
                    { fullname: { contains: search } },
                    { nopen: { contains: search } },
                    { no_skep: { contains: search } },
                  ],
                },
              },
            },
          },
        ],
      }),
      ...(sumdanId && { sumdanId: sumdanId }),
      ...(backdate && {
        created_at: {
          gte: moment(backdate.split(",")[0]).toDate(),
          lte: moment(backdate.split(",")[1]).toDate(),
        },
      }),
      ...(user.sumdanId && { sumdanId: user.sumdanId }),
      ...(status && { status: status === "true" ? true : false }),
    },
  });

  return NextResponse.json({
    status: 200,
    data: serializeForApi(find),
    total: total,
  });
};

export const PUT = async (req: NextRequest) => {
  const data: IDropping = await req.json();

  try {
    const { Dapem, Sumdan, ...saved } = data;
    await prisma.$transaction(async (tx) => {
      await tx.dropping.update({ where: { id: data.id }, data: saved });
      for (const dpm of Dapem) {
        const {
          ProdukPembiayaan,
          JenisPembiayaan,
          AO,
          MOC,
          CreatedBy,
          Debitur,
          Angsuran,
          Berkas,
          Jaminan,
          Dropping,
          Pelunasan,
          AgentFronting,
          ...dpmData
        } = dpm;
        await prisma.dapem.update({ where: { id: dpm.id }, data: dpmData });
      }
    });
    return NextResponse.json(
      {
        msg: "Data Pencairan berhasil diperbarui.",
        status: 200,
      },
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
      { status: 404, msg: "Not found!" },
      { status: 404 },
    );

  const find = await prisma.dropping.findFirst({
    where: { id },
    include: { Dapem: true },
  });
  if (find) {
    await prisma.$transaction(async (tx) => {
      await tx.dapem.updateMany({
        where: { droppingId: id },
        data: { droppingId: null },
      });
      await tx.dropping.delete({ where: { id } });
      return true;
    });
  }

  return NextResponse.json({ msg: "OK", status: 200 }, { status: 200 });
};
