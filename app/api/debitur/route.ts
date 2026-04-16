import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import { getSession } from "@/libs/Auth";
import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const page = request.nextUrl.searchParams.get("page") || "1";
  const limit = request.nextUrl.searchParams.get("limit") || "50";
  const search = request.nextUrl.searchParams.get("search") || "";
  const group_skep = request.nextUrl.searchParams.get("group_skep");
  const pay_office = request.nextUrl.searchParams.get("pay_office");
  const aktif = request.nextUrl.searchParams.get("aktif");
  const address = request.nextUrl.searchParams.get("address");
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const session = await getSession();

  if (!session)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });
  const user = await prisma.user.findFirst({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });

  const find = await prisma.debitur.findMany({
    where: {
      ...(search && {
        OR: [
          { nopen: { contains: search } },
          { fullname: { contains: search } },
          { account_number: { contains: search } },
          { no_skep: { contains: search } },
        ],
      }),
      ...(address && {
        OR: [
          { address: { contains: address } },
          { ward: { contains: address } },
          { district: { contains: address } },
          { city: { contains: address } },
          { province: { contains: address } },
          { pos_code: { contains: address } },
        ],
      }),
      ...(group_skep && { group_skep: group_skep }),
      ...(pay_office && { pay_office: { contains: pay_office } }),
      ...(user.sumdanId && {
        Dapem: { some: { ProdukPembiayaan: { sumdanId: user.sumdanId } } },
      }),
      ...(aktif && {
        Dapem: {
          some: {
            dropping_status: {
              in: ["PAID_OFF", "APPROVED", "PROCCESS"],
            },
            status: true,
          },
        },
      }),
    },
    skip: skip,
    take: parseInt(limit),
    include: {
      Dapem: {
        where: {
          dropping_status: {
            in: ["PAID_OFF", "APPROVED", "PROCCESS"],
          },
          status: true,
          ...(user.sumdanId && {
            ProdukPembiayaan: { sumdanId: user.sumdanId },
          }),
        },
        include: {
          ProdukPembiayaan: { include: { Sumdan: true } },
          JenisPembiayaan: true,
          AO: { include: { Cabang: { include: { Area: true } } } },
          Angsuran: true,
        },
      },
    },
    orderBy: {
      Dapem: {
        _count: "desc",
      },
    },
  });

  const total = await prisma.debitur.count({
    where: {
      ...(search && {
        OR: [
          { nopen: { contains: search } },
          { fullname: { contains: search } },
          { account_number: { contains: search } },
          { no_skep: { contains: search } },
        ],
      }),
      ...(address && {
        OR: [
          { address: { contains: address } },
          { ward: { contains: address } },
          { district: { contains: address } },
          { city: { contains: address } },
          { province: { contains: address } },
          { pos_code: { contains: address } },
        ],
      }),
      ...(group_skep && { group_skep: group_skep }),
      ...(pay_office && { pay_office: { contains: pay_office } }),
      ...(user.sumdanId && {
        Dapem: { some: { ProdukPembiayaan: { sumdanId: user.sumdanId } } },
      }),
      ...(aktif && {
        Dapem: {
          some: {
            dropping_status: {
              in: ["PAID_OFF", "APPROVED", "PROCCESS"],
            },
            status: true,
          },
        },
      }),
    },
  });

  return NextResponse.json({
    status: 200,
    data: serializeForApi(find),
    total: total,
  });
};

export const PATCH = async (request: NextRequest) => {
  const nopen = request.nextUrl.searchParams.get("nopen");
  if (!nopen) {
    return NextResponse.json(
      { status: 400, msg: "Tidak ada nopen dalam parameter!" },
      { status: 400 },
    );
  }

  const find = await prisma.debitur.findFirst({
    where: { nopen: nopen },
  });
  if (!find) {
    return NextResponse.json(
      { status: 404, msg: "Debitur dengan nopen tersebut tidak ditemukan!" },
      { status: 404 },
    );
  }
  return NextResponse.json(
    { status: 200, msg: "OK", data: serializeForApi(find) },
    { status: 200 },
  );
};
