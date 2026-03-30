import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import { IJournalEntry } from "@/libs/IInterfaces";
import prisma from "@/libs/Prisma";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const page = request.nextUrl.searchParams.get("page") || "1";
  const limit = request.nextUrl.searchParams.get("limit") || "50";
  const search = request.nextUrl.searchParams.get("search");
  const coaId = request.nextUrl.searchParams.get("coaId");
  const backdate = request.nextUrl.searchParams.get("backdate");
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const find = await prisma.journalEntry.findMany({
    where: {
      ...(search && {
        JournalDetail: {
          some: {
            desciption: { contains: search },
          },
        },
      }),
      ...(coaId && {
        JournalDetail: { some: { categoryOfAccountId: coaId } },
      }),
      ...(backdate && {
        date: {
          gte: moment(backdate.split(",")[0]).toDate(),
          lte: moment(backdate.split(",")[1]).toDate(),
        },
      }),
    },
    skip: skip,
    take: parseInt(limit),
    orderBy: { id: "desc" },
    include: {
      JournalDetail: {
        include: { CategoryOfAccount: true },
      },
    },
  });

  const total = await prisma.journalEntry.count({
    where: {
      ...(search && {
        JournalDetail: {
          some: {
            desciption: { contains: search },
          },
        },
      }),
      ...(coaId && {
        JournalDetail: { some: { categoryOfAccountId: coaId } },
      }),
      ...(backdate && {
        date: {
          gte: moment(backdate.split(",")[0]).toDate(),
          lte: moment(backdate.split(",")[1]).toDate(),
        },
      }),
    },
  });

  return NextResponse.json(
    { data: serializeForApi(find), total, status: 200 },
    { status: 200 },
  );
};

export const POST = async (req: NextRequest) => {
  const data: IJournalEntry = await req.json();

  const { id, JournalDetail, ...saved } = data;

  try {
    await prisma.$transaction(async (tx) => {
      const genId = await generateJurnalId();
      const jurnal = await tx.journalEntry.create({
        data: { id: genId, ...saved },
      });
      const newList = JournalDetail.map((d, i) => {
        const { JournalEntry, CategoryOfAccount, User, ...entry } = d;
        return {
          ...entry,
          id: generateTXId(jurnal.id, i),
          journalEntryId: genId,
        };
      });
      await tx.journalDetail.createMany({ data: newList });
      return true;
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

export const PUT = async (req: NextRequest) => {
  const data: IJournalEntry = await req.json();

  const { id, JournalDetail, ...saved } = data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.journalEntry.update({
        where: { id },
        data: saved,
      });

      await tx.journalDetail.deleteMany({ where: { journalEntryId: data.id } });

      const newList = JournalDetail.map((d, i) => {
        const { JournalEntry, CategoryOfAccount, User, ...entry } = d;
        return {
          ...entry,
          id: generateTXId(id, i),
          journalEntryId: id,
        };
      });
      await tx.journalDetail.createMany({ data: newList });
      return true;
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

export const DELETE = async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get("id");
  if (!id)
    return NextResponse.json(
      { msg: "ID Not found", status: 404 },
      { status: 404 },
    );

  await prisma.journalDetail.deleteMany({ where: { journalEntryId: id } });
  await prisma.journalEntry.delete({ where: { id } });

  return NextResponse.json({ msg: "OK", status: 200 }, { status: 200 });
};

async function generateJurnalId() {
  const prefix = `TX`;
  const padLength = 4;
  const lastRecord = await prisma.journalEntry.count({});
  return `${prefix}${String(lastRecord + 1).padStart(padLength, "0")}`;
}
function generateTXId(jurnalId: string, ind: number) {
  const padLength = 3;
  return `${jurnalId}${String(ind).padStart(padLength, "0")}`;
}
