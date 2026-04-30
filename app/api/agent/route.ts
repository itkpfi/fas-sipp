import prisma from "@/libs/Prisma";

import { SumdanAgentFronting } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/libs/Auth";
import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import moment from "moment";

export const GET = async (request: NextRequest) => {
  const page = request.nextUrl.searchParams.get("page") || "1";
  const limit = request.nextUrl.searchParams.get("limit") || "50";
  const search = request.nextUrl.searchParams.get("search") || "";
  const backdate = request.nextUrl.searchParams.get("backdate") || "";
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const session = await getSession();
  if (!session)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });
  const user = await prisma.user.findFirst({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });

  const find = await prisma.agentFronting.findMany({
    where: {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          {
            User: {
              some: {
                OR: [
                  { fullname: { contains: search } },
                  { username: { contains: search } },
                  { phone: { contains: search } },
                  { nik: { contains: search } },
                  { nip: { contains: search } },
                ],
              },
            },
          },
        ],
      }),
      ...(user.sumdanId
        ? { SumdanAgentFronting: { some: { sumdanId: user.sumdanId } } }
        : {}),
      status: true,
    },
    skip: skip,
    take: parseInt(limit),
    orderBy: {
      updated_at: "desc",
    },
    include: {
      SumdanAgentFronting: {
        include: { Sumdan: { include: { ProdukPembiayaan: true } } },
      },
      User: { include: { Role: true } },
      Dapem: {
        where: {
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
  });

  const total = await prisma.agentFronting.count({
    where: {
      ...(search && {
        OR: [
          { name: { contains: search } },
          { code: { contains: search } },
          {
            User: {
              some: {
                OR: [
                  { fullname: { contains: search } },
                  { username: { contains: search } },
                  { phone: { contains: search } },
                  { nik: { contains: search } },
                  { nip: { contains: search } },
                ],
              },
            },
          },
        ],
      }),
      ...(user.sumdanId
        ? { SumdanAgentFronting: { some: { sumdanId: user.sumdanId } } }
        : {}),
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
  const body = await request.json();
  const { id, User, sumdanIds, Dapem, ...saved } = body;
  try {
    const genId = await generateId();
    await prisma.$transaction(async (tx) => {
      const agent = await tx.agentFronting.create({
        data: { ...saved, id: genId },
      });

      await tx.sumdanAgentFronting.createMany({
        data: sumdanIds.map((s: string) => ({
          sumdanId: s,
          agentFrontingId: agent.id,
        })),
      });
      return true;
    });
    return NextResponse.json({
      status: 201,
      msg: "Berhasil menyimpan data agent fronting.",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      status: 500,
      msg: "Gagal menyimpan data agent fronting. internal server error.",
    });
  }
};

export const PUT = async (request: NextRequest) => {
  const body = await request.json();
  const { id: idAgent, User, sumdanIds, Dapem, ...updated } = body;
  const id = request.nextUrl.searchParams.get("id");

  try {
    const find = await prisma.agentFronting.findFirst({
      where: { id: id as string },
    });

    if (!find) {
      return NextResponse.json(
        { status: 404, msg: "Not found data!" },
        { status: 404 },
      );
    }

    await prisma.$transaction(async (tx) => {
      const agent = await tx.agentFronting.update({
        where: { id: id as string },
        data: { ...updated, updated_at: new Date() },
      });
      await tx.sumdanAgentFronting.deleteMany({
        where: { agentFrontingId: updated.id as string },
      });
      await tx.sumdanAgentFronting.createMany({
        data: sumdanIds.map((s: string) => ({
          sumdanId: s,
          agentFrontingId: agent.id,
        })),
      });
      return true;
    });

    return NextResponse.json({
      status: 200,
      msg: "Berhasil memperbarui data agent fronting.",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      status: 500,
      msg: "Gagal memperbarui data agent fronting. internal server error.",
    });
  }
};

export const DELETE = async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get("id") || "";
  try {
    await prisma.agentFronting.update({
      where: { id: id },
      data: { status: false, updated_at: new Date() },
    });
    return NextResponse.json({
      status: 200,
      msg: "Berhasil menghapus data agent fronting.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      msg: "Gagal menghapus data agent fronting. internal server error.",
    });
  }
};

export const PATCH = async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get("id");
  try {
    const find = await prisma.agentFronting.findFirst({
      where: { id: id as string },
      include: {
        SumdanAgentFronting: {
          include: { Sumdan: { include: { ProdukPembiayaan: true } } },
        },
        Dapem: { include: { JenisPembiayaan: true } },
        User: { include: { Role: true } },
      },
    });

    return NextResponse.json({
      status: 200,
      msg: "ok",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      {
        status: 500,
        msg: "Internal Server Error!",
      },
      { status: 500 },
    );
  }
};

async function generateId() {
  const prefix = "AGENT";
  const padLength = 3;
  const lastRecord = await prisma.agentFronting.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
