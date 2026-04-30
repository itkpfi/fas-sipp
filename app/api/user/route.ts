import prisma from "@/libs/Prisma";
import moment from "moment";

import { User } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { getSession } from "@/libs/Auth";
import { serializeForApi } from "@/components/utils/PembiayaanUtil";

export const GET = async (request: NextRequest) => {
  const page = request.nextUrl.searchParams.get("page") || "1";
  const limit = request.nextUrl.searchParams.get("limit") || "50";
  const search = request.nextUrl.searchParams.get("search") || "";
  const roleId = request.nextUrl.searchParams.get("roleId") || "";
  const pkwt_status = request.nextUrl.searchParams.get("pkwt_status") || "";
  const position = request.nextUrl.searchParams.get("position") || "";
  const sumdanId = request.nextUrl.searchParams.get("sumdanId") || "";
  const agentFrontingId =
    request.nextUrl.searchParams.get("agentFrontingId") || "";
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const session = await getSession();
  if (!session)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });
  const user = await prisma.user.findFirst({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });

  const find = await prisma.user.findMany({
    where: {
      ...(search && {
        OR: [
          { fullname: { contains: search } },
          { username: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { address: { contains: search } },
          { nip: { contains: search } },
          { nik: { contains: search } },
          { id: { contains: search } },
        ],
      }),
      ...(roleId && { roleId: roleId }),
      ...(user.sumdanId
        ? { sumdanId: user.sumdanId }
        : sumdanId
          ? { sumdanId: sumdanId }
          : {}),
      ...(pkwt_status && { pkwt_status: pkwt_status }),
      ...(position && { position: position }),
      ...(agentFrontingId && { agentFrontingId: agentFrontingId }),
      status: true,
    },
    skip: skip,
    take: parseInt(limit),
    orderBy: {
      updated_at: "desc",
    },
    include: {
      Cabang: {
        include: { Area: true },
      },
      Sumdan: true,
      Role: true,
      SPVRelation: {
        include: {
          User: { include: { Cabang: true } },
          SPV: { include: { Cabang: true } },
        },
      },
      SPVRelations: {
        include: {
          User: { include: { Cabang: true } },
          SPV: { include: { Cabang: true } },
        },
      },
    },
  });

  const total = await prisma.user.count({
    where: {
      ...(search && {
        OR: [
          { fullname: { contains: search } },
          { username: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
          { address: { contains: search } },
          { nip: { contains: search } },
          { nik: { contains: search } },
          { id: { contains: search } },
        ],
      }),
      ...(roleId && { roleId: roleId }),
      ...(user.sumdanId
        ? { sumdanId: user.sumdanId }
        : sumdanId
          ? { sumdanId: sumdanId }
          : {}),
      ...(pkwt_status && { pkwt_status: pkwt_status }),
      ...(position && { position: position }),
      ...(agentFrontingId && { agentFrontingId: agentFrontingId }),
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
  const {
    id,
    nip,
    password,
    Cabang,
    Sumdan,
    Role,
    SPVRelation,
    SPVRelations,
    AgentFronting,
    ...saved
  } = body;
  try {
    const find = await prisma.user.findFirst({
      where: { username: saved.username },
    });
    if (find) {
      return NextResponse.json(
        { status: 400, msg: "Maaf username telah digunakan!" },
        { status: 400 },
      );
    }
    const generateId = await generateUserId();
    const generateNIP = await generateUserNIP(saved.cabangId);
    const pass = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const spv = await tx.sPVRelation.upsert({
        where: { spvId: SPVRelation.spvId },
        update: {},
        create: { spvId: SPVRelation.spvId },
      });
      await tx.user.create({
        data: {
          id: generateId,
          nip: generateNIP,
          password: pass,
          sPVRelationId: spv.id,
          ...saved,
        },
      });
      return true;
    });

    return NextResponse.json({
      status: 201,
      msg: "Berhasil menyimpan data user.",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      status: 500,
      msg: "Gagal menyimpan data user. internal server error.",
    });
  }
};

export const PUT = async (request: NextRequest) => {
  const body = await request.json();
  const {
    id,
    Cabang,
    Sumdan,
    Role,
    SPVRelation,
    SPVRelations,
    AgentFronting,
    ...updated
  } = body;
  try {
    const find = await prisma.user.findFirst({ where: { id } });

    if (find) {
      if (body.password && body.password !== "" && body.password.length < 20) {
        updated.password = await bcrypt.hash(body.password, 10);
      } else {
        updated.password = find.password;
      }
    }

    await prisma.$transaction(async (tx) => {
      const spv = await tx.sPVRelation.upsert({
        where: { spvId: SPVRelation.spvId },
        create: { spvId: SPVRelation.spvId },
        update: {},
      });
      await tx.user.update({
        where: { id: id },
        data: { ...updated, sPVRelationId: spv.id, updated_at: new Date() },
      });
    });

    return NextResponse.json({
      status: 200,
      msg: "Berhasil memperbarui data user.",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      status: 500,
      msg: "Gagal memperbarui data user. internal server error.",
    });
  }
};

export const DELETE = async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get("id") || "";
  try {
    await prisma.user.update({
      where: { id: id },
      data: { status: false, updated_at: new Date() },
    });
    return NextResponse.json({
      status: 200,
      msg: "Berhasil menghapus data user.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      msg: "Gagal menghapus data user. internal server error.",
    });
  }
};

export const PATCH = async (request: NextRequest) => {
  const body: {
    id: string;
    password: string;
    newPassword: string;
    confirmPassword: string;
  } = await request.json();
  try {
    const find = await prisma.user.findFirst({ where: { id: body.id } });

    if (!find) {
      return NextResponse.json(
        {
          status: 404,
          msg: "Gagal ganti password, User tidak ditemukan!",
        },
        { status: 404 },
      );
    }
    const verify = await bcrypt.compare(body.password, find.password);
    if (!verify) {
      return NextResponse.json(
        {
          status: 400,
          msg: "Password lama salah!!",
        },
        { status: 400 },
      );
    }

    const newPass = await bcrypt.hash(body.confirmPassword, 10);

    await prisma.user.update({
      where: { id: body.id },
      data: { password: newPass, updated_at: new Date() },
    });
    return NextResponse.json({
      status: 200,
      msg: "Update password berhasil!.",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      {
        status: 500,
        msg: "Gagal memperbarui password. internal server error.",
      },
      { status: 500 },
    );
  }
};

export async function generateUserId() {
  const prefix = "U";
  const padLength = 3;
  const lastRecord = await prisma.user.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}

export async function generateUserNIP(cabangId: string) {
  const prefix = `${moment().year()}${moment().month()}`;
  const padLength = 2;
  const lastRecord = await prisma.user.count({});
  const cabang = await prisma.cabang.findFirst({ where: { id: cabangId } });
  return `${prefix}${cabang ? cabang.id.replace("UP", "") : "001"}${String(
    lastRecord,
  ).padStart(padLength, "0")}`;
}
