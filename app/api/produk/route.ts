import prisma from "@/libs/Prisma";
import { ProdukPembiayaan } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const page = request.nextUrl.searchParams.get("page") || "1";
  const limit = request.nextUrl.searchParams.get("limit") || "50";
  const search = request.nextUrl.searchParams.get("search") || "";
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const find = await prisma.produkPembiayaan.findMany({
    where: {
      ...(search && { name: { contains: search } }),
      status: true,
    },
    skip: skip,
    take: parseInt(limit),
    orderBy: {
      id: "desc",
    },
    include: { Sumdan: true },
  });

  const total = await prisma.produkPembiayaan.count({
    where: {
      ...(search && { name: { contains: search } }),
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
  const body: ProdukPembiayaan = await request.json();
  const { id, ...saved } = body;
  try {
    const generateId = await generateProdukId(body.sumdanId);
    await prisma.produkPembiayaan.create({
      data: { id: generateId, ...saved },
    });
    return NextResponse.json({
      status: 201,
      msg: "Berhasil menyimpan data produk pembiayaan.",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      status: 500,
      msg: "Gagal menyimpan data produk pembiayaan. internal server error.",
    });
  }
};

export const PUT = async (request: NextRequest) => {
  const body: ProdukPembiayaan = await request.json();
  const { id, ...updated } = body;
  try {
    await prisma.produkPembiayaan.update({
      where: { id: id },
      data: { ...updated, updated_at: new Date() },
    });
    return NextResponse.json({
      status: 200,
      msg: "Berhasil memperbarui data produk pembiayaan.",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      status: 500,
      msg: "Gagal memperbarui data produk pembiayaan. internal server error.",
    });
  }
};

export const DELETE = async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get("id") || "";
  try {
    await prisma.produkPembiayaan.update({
      where: { id: id },
      data: { status: false, updated_at: new Date() },
    });
    return NextResponse.json({
      status: 200,
      msg: "Berhasil menghapus data produk pembiayaan.",
    });
  } catch (err) {
    return NextResponse.json({
      status: 500,
      msg: "Gagal menghapus data produk pembiayaan. internal server error.",
    });
  }
};

export async function generateProdukId(sumdanId: string) {
  const find = await prisma.sumdan.findFirst({ where: { id: sumdanId } });
  const prefix = `${find ? find.code : "BPR"}`;
  const padLength = 2;
  const lastRecord = await prisma.produkPembiayaan.count({
    where: { sumdanId: sumdanId },
  });
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
