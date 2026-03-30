import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import prisma from "@/libs/Prisma";
import { AccountType, CategoryOfAccount } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const page = request.nextUrl.searchParams.get("page") || "1";
  const limit = request.nextUrl.searchParams.get("limit") || "50";
  const search = request.nextUrl.searchParams.get("search");
  const type = request.nextUrl.searchParams.get("type");
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const find = await prisma.categoryOfAccount.findMany({
    where: {
      ...(search && {
        OR: [{ id: { contains: search } }, { name: { contains: search } }],
      }),
      ...(type && { type: type as AccountType }),
    },
    skip: skip,
    take: parseInt(limit),
    include: { Children: true, Parent: true },
  });

  return NextResponse.json(
    { data: serializeForApi(find), status: 200 },
    { status: 200 },
  );
};

export const POST = async (req: NextRequest) => {
  const data: CategoryOfAccount = await req.json();
  const find = await prisma.categoryOfAccount.findFirst({
    where: { id: data.id },
  });
  if (find)
    return NextResponse.json(
      { msg: "ID atau No Akun sudah digunakan!", status: 400 },
      { status: 400 },
    );
  try {
    await prisma.categoryOfAccount.create({ data: data });

    return NextResponse.json({ msg: "OK", status: 200 }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { msg: "Internal Server Error", status: 500 },
      { status: 500 },
    );
  }
};

export const PUT = async (req: NextRequest) => {
  const data: CategoryOfAccount = await req.json();
  const id = req.nextUrl.searchParams.get("id") || "1";
  const find = await prisma.categoryOfAccount.findFirst({
    where: { id: data.id },
  });
  if (id !== data.id && find)
    return NextResponse.json(
      { msg: "ID atau No Akun sudah digunakan!", status: 400 },
      { status: 400 },
    );

  try {
    await prisma.categoryOfAccount.update({ where: { id }, data: data });

    return NextResponse.json({ msg: "OK", status: 200 }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { msg: "Internal Server Error", status: 500 },
      { status: 500 },
    );
  }
};

export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id") || "1";
  if (!id)
    return NextResponse.json(
      { msg: "ID atau No Akun tidak ditemukan!", status: 404 },
      { status: 404 },
    );
  try {
    const find = await prisma.categoryOfAccount.findFirst({
      where: { id },
      include: { JournalDetail: true },
    });
    if (find && find.JournalDetail.length !== 0)
      return NextResponse.json(
        {
          msg: "COA ini memiliki journal yang terhubung. tidak dapat hapus data!",
          status: 400,
        },
        { status: 400 },
      );
    await prisma.categoryOfAccount.delete({
      where: { id },
    });

    return NextResponse.json({ msg: "OK", status: 200 }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { msg: "Internal Server Error", status: 500 },
      { status: 500 },
    );
  }
};
