import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "@/libs/Prisma";
import { getSession, signIn, signOut } from "@/libs/Auth";
import { Role } from "@prisma/client";

export const POST = async (req: NextRequest) => {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json(
      { msg: "Mohon lengkapi username & password!", status: 404 },
      { status: 404 },
    );
  }

  try {
    const find = await prisma.user.findFirst({
      where: { username: username },
      include: {
        Role: true,
        Sumdan: true,
        Cabang: { include: { Area: true } },
      },
    });
    if (!find) {
      return NextResponse.json(
        { msg: "Username atau password salah!", status: 401 },
        { status: 401 },
      );
    }
    const comparePass = await bcrypt.compare(password, find.password);
    if (!comparePass) {
      return NextResponse.json(
        { msg: "Username atau password salah!", status: 401 },
        { status: 401 },
      );
    }

    const { Sumdan, Cabang, Role, ...payload } = find;
    await signIn({
      ...payload,
      Role: { id: Role.id, name: Role.name } as Role,
      sumdan: Sumdan ? Sumdan.name : null,
      cabang: Cabang.name || "",
      area: Cabang.Area.name || "",
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

export const GET = async () => {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { msg: "Unauthorize", status: 401 },
      { status: 401 },
    );
  }
  try {
    const user = await prisma.user.findFirst({
      where: { id: session.user.id },
      include: {
        Role: true,
        Cabang: { include: { Area: true } },
        Sumdan: true,
      },
    });
    if (!user) {
      await signOut();
      return NextResponse.json(
        { msg: "Unauthorize", status: 401 },
        { status: 401 },
      );
    }
    const { Cabang, Sumdan, ...datauser } = user;
    return NextResponse.json(
      {
        data: {
          ...datauser,
          cabang: Cabang.name,
          area: Cabang.Area.name,
          sumdan: Sumdan?.name,
        },
        status: 200,
        msg: "OK",
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
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { msg: "Unauthorize", status: 401 },
        { status: 401 },
      );
    }
    const user = await prisma.user.findFirst({
      where: { id: session.user.id },
      include: {
        Role: true,
      },
    });
    await signOut();
    return NextResponse.json({ msg: "OK", status: 200 }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { msg: "Internal Server Error", status: 500 },
      { status: 500 },
    );
  }
};
