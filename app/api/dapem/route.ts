import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import { getSession } from "@/libs/Auth";
import { IDapem } from "@/libs/IInterfaces";
import prisma from "@/libs/Prisma";
import { EDapemStatus, EDocStatus, ESubmissionStatus } from "@prisma/client";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const page = request.nextUrl.searchParams.get("page") || "1";
  const limit = request.nextUrl.searchParams.get("limit") || "50";
  const search = request.nextUrl.searchParams.get("search");
  const dropping_status = request.nextUrl.searchParams.get("dropping_status");
  const nominatif = request.nextUrl.searchParams.get("nominatif");
  const slik_status = request.nextUrl.searchParams.get("slik_status");
  const verif_status = request.nextUrl.searchParams.get("verif_status");
  const approv_status = request.nextUrl.searchParams.get("approv_status");
  const jenisPembiayaanId =
    request.nextUrl.searchParams.get("jenisPembiayaanId");
  const insurance_type = request.nextUrl.searchParams.get("insurance_type");
  const sumdanId = request.nextUrl.searchParams.get("sumdanId");
  const document_status = request.nextUrl.searchParams.get("document_status");
  const guarantee_status = request.nextUrl.searchParams.get("guarantee_status");
  const takeover_status = request.nextUrl.searchParams.get("takeover_status");
  const mutasi_status = request.nextUrl.searchParams.get("mutasi_status");
  const cash_status = request.nextUrl.searchParams.get("cash_status");
  const flagging_status = request.nextUrl.searchParams.get("flagging_status");
  const paid_status = request.nextUrl.searchParams.get("paid_status");
  const backdate = request.nextUrl.searchParams.get("backdate");
  const currmont = request.nextUrl.searchParams.get("currmont");
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const session = await getSession();
  if (!session)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });
  const user = await prisma.user.findFirst({ where: { id: session.user.id } });
  if (!user)
    return NextResponse.json({ data: [], status: 200 }, { status: 200 });

  const find = await prisma.dapem.findMany({
    where: {
      ...(search && {
        OR: [
          { id: { contains: search } },
          { no_contract: { contains: search } },
          {
            Debitur: {
              OR: [
                { fullname: { contains: search } },
                { nopen: { contains: search } },
                { no_skep: { contains: search } },
                { name_skep: { contains: search } },
              ],
            },
          },
        ],
      }),
      ...(dropping_status
        ? dropping_status === "final"
          ? { dropping_status: { in: ["APPROVED", "PROCCESS", "PAID_OFF"] } }
          : {
              dropping_status: dropping_status as EDapemStatus,
            }
        : {}),
      ...(nominatif && { dropping_status: { in: ["APPROVED", "PAID_OFF"] } }),
      ...(cash_status && {
        cash_status: cash_status as EDapemStatus,
      }),
      ...(slik_status
        ? slik_status === "all"
          ? { slik_status: { not: null } }
          : { slik_status: slik_status as ESubmissionStatus }
        : {}),

      ...(verif_status
        ? verif_status === "all"
          ? { verif_status: { not: null } }
          : { verif_status: verif_status as ESubmissionStatus }
        : {}),

      ...(approv_status
        ? approv_status === "all"
          ? { approv_status: { not: null } }
          : { approv_status: approv_status as ESubmissionStatus }
        : {}),
      ...(jenisPembiayaanId && { jenisPembiayaanId: jenisPembiayaanId }),
      ...(insurance_type && { insurance_type }),
      ...(sumdanId && { ProdukPembiayaan: { sumdanId: sumdanId } }),
      ...(document_status && {
        document_status: document_status as EDocStatus,
      }),
      ...(guarantee_status && {
        guarantee_status: guarantee_status as EDocStatus,
      }),
      ...(mutasi_status && { mutasi_status: mutasi_status as EDapemStatus }),
      ...(takeover_status && {
        takeover_status: takeover_status as EDapemStatus,
      }),
      ...(flagging_status && {
        flagging_status: flagging_status as EDapemStatus,
      }),
      ...(paid_status && {
        Pelunasan: { status_paid: paid_status as ESubmissionStatus },
      }),
      ...(user.sumdanId && { ProdukPembiayaan: { sumdanId: user.sumdanId } }),
      ...(backdate
        ? {
            created_at: {
              gte: moment(backdate.split(",")[0]).toDate(),
              lte: moment(backdate.split(",")[1]).toDate(),
            },
          }
        : currmont
          ? {
              created_at: {
                gte: moment().startOf("month").toDate(),
                lte: moment().endOf("month").toDate(),
              },
            }
          : {}),
      status: true,
    },
    skip: skip,
    take: parseInt(limit),
    orderBy: {
      created_at: "desc",
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

  const total = await prisma.dapem.count({
    where: {
      ...(search && {
        OR: [
          { id: { contains: search } },
          { no_contract: { contains: search } },
          {
            Debitur: {
              OR: [
                { fullname: { contains: search } },
                { nopen: { contains: search } },
                { no_skep: { contains: search } },
                { name_skep: { contains: search } },
              ],
            },
          },
        ],
      }),
      ...(dropping_status
        ? dropping_status === "final"
          ? { dropping_status: { in: ["APPROVED", "PROCCESS"] } }
          : {
              dropping_status: dropping_status as EDapemStatus,
            }
        : {}),
      ...(cash_status && {
        cash_status: cash_status as EDapemStatus,
      }),
      ...(slik_status
        ? slik_status === "all"
          ? { slik_status: { not: null } }
          : { slik_status: slik_status as ESubmissionStatus }
        : {}),

      ...(verif_status
        ? verif_status === "all"
          ? { verif_status: { not: null } }
          : { verif_status: verif_status as ESubmissionStatus }
        : {}),

      ...(approv_status
        ? approv_status === "all"
          ? { approv_status: { not: null } }
          : { approv_status: approv_status as ESubmissionStatus }
        : {}),
      ...(jenisPembiayaanId && { jenisPembiayaanId: jenisPembiayaanId }),
      ...(insurance_type && { insurance_type }),
      ...(sumdanId && { ProdukPembiayaan: { sumdanId: sumdanId } }),
      ...(document_status && {
        document_status: document_status as EDocStatus,
      }),
      ...(guarantee_status && {
        guarantee_status: guarantee_status as EDocStatus,
      }),
      ...(mutasi_status && { mutasi_status: mutasi_status as EDapemStatus }),
      ...(takeover_status && {
        takeover_status: takeover_status as EDapemStatus,
      }),
      ...(paid_status && {
        Pelunasan: { status_paid: paid_status as ESubmissionStatus },
      }),
      ...(user.sumdanId && { ProdukPembiayaan: { sumdanId: user.sumdanId } }),
      ...(backdate
        ? {
            created_at: {
              gte: moment(backdate.split(",")[0]).toDate(),
              lte: moment(backdate.split(",")[1]).toDate(),
            },
          }
        : currmont
          ? {
              created_at: {
                gte: moment().startOf("month").toDate(),
                lte: moment().endOf("month").toDate(),
              },
            }
          : {}),
      status: true,
    },
  });

  return NextResponse.json(
    { data: serializeForApi(find), total, status: 200 },
    { status: 200 },
  );
};

export const POST = async (req: NextRequest) => {
  const data: IDapem = await req.json();
  const {
    id,
    Debitur,
    CreatedBy,
    AO,
    ProdukPembiayaan,
    JenisPembiayaan,
    Berkas,
    Jaminan,
    Angsuran,
    Dropping,
    Pelunasan,
    ...saved
  } = data;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.debitur.upsert({
        where: { nopen: Debitur.nopen },
        update: Debitur,
        create: Debitur,
      });
      const dapemId = await generateDapemId();
      await tx.dapem.create({ data: { ...saved, id: dapemId } });
      return true;
    });
    return NextResponse.json(
      { msg: "Data berhasil ditambahkan", status: 200 },
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
  const data: IDapem = await req.json();
  const {
    id,
    Debitur,
    CreatedBy,
    AO,
    ProdukPembiayaan,
    JenisPembiayaan,
    Berkas,
    Jaminan,
    Angsuran,
    Dropping,
    Pelunasan,
    ...saved
  } = data;
  try {
    const prevDapem = await prisma.dapem.findFirst({ where: { id } });
    if (!prevDapem)
      return NextResponse.json(
        { msg: "Not Found", status: 404 },
        { status: 404 },
      );
    await prisma.$transaction(async (tx) => {
      if (prevDapem.nopen !== Debitur.nopen) {
        const findSameWithNewNopen = await tx.debitur.findFirst({
          where: { nopen: Debitur.nopen },
        });
        if (!findSameWithNewNopen) {
          await tx.debitur.update({
            where: { nopen: prevDapem.nopen },
            data: Debitur,
          });
        } else {
          await tx.debitur.update({
            where: { nopen: Debitur.nopen },
            data: Debitur,
          });
        }
      } else {
        await tx.debitur.upsert({
          where: { nopen: Debitur.nopen },
          update: Debitur,
          create: Debitur,
        });
      }
      await tx.dapem.update({ where: { id }, data: { ...saved } });
      return true;
    });
    return NextResponse.json(
      { msg: "Data berhasil ditambahkan", status: 200 },
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

export const PATCH = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json(
      { msg: "Not Found", status: 404 },
      { status: 404 },
    );

  const find = await prisma.dapem.findFirst({
    where: { id },
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
  if (!id)
    return NextResponse.json(
      { msg: "Not Found", status: 404 },
      { status: 404 },
    );

  return NextResponse.json(
    { data: serializeForApi(find), status: 200 },
    { status: 200 },
  );
};

export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json(
      { msg: "Not Found", status: 404 },
      { status: 404 },
    );
  try {
    await prisma.dapem.update({ where: { id }, data: { status: false } });
    return NextResponse.json({ msg: "Berhasil", status: 200 }, { status: 200 });
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      { msg: "Internal Server Error", status: 500 },
      { status: 500 },
    );
  }
};

export async function generateDapemId() {
  const prefix = `PP`;
  const padLength = 4;
  const lastRecord = await prisma.dapem.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
