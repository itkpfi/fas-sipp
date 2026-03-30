import { serializeForApi } from "@/components/utils/PembiayaanUtil";
import prisma from "@/libs/Prisma";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const backdate = request.nextUrl.searchParams.get("backdate");
  const [asset, kewajiban, modal, pendapatan, beban] =
    await prisma.$transaction([
      prisma.categoryOfAccount.findMany({
        where: {
          type: "ASSET",
          parentId: null,
        },
        include: {
          Parent: true,
          Children: {
            include: {
              JournalDetail: {
                where: {
                  ...(backdate && {
                    JournalEntry: {
                      date: {
                        gte: moment(backdate.split(",")[0]).toDate(),
                        lte: moment(backdate.split(",")[1]).toDate(),
                      },
                    },
                  }),
                },
              },
            },
          },
          JournalDetail: true,
        },
      }),
      prisma.categoryOfAccount.findMany({
        where: {
          type: "KEWAJIBAN",
          parentId: null,
        },
        include: {
          Parent: true,
          Children: {
            include: {
              JournalDetail: {
                where: {
                  ...(backdate && {
                    JournalEntry: {
                      date: {
                        gte: moment(backdate.split(",")[0]).toDate(),
                        lte: moment(backdate.split(",")[1]).toDate(),
                      },
                    },
                  }),
                },
              },
            },
          },
          JournalDetail: true,
        },
      }),
      prisma.categoryOfAccount.findMany({
        where: {
          type: "MODAL",
          parentId: null,
        },
        include: {
          Parent: true,
          Children: {
            include: {
              JournalDetail: {
                where: {
                  ...(backdate && {
                    JournalEntry: {
                      date: {
                        gte: moment(backdate.split(",")[0]).toDate(),
                        lte: moment(backdate.split(",")[1]).toDate(),
                      },
                    },
                  }),
                },
              },
            },
          },
          JournalDetail: true,
        },
      }),
      prisma.journalDetail.findMany({
        where: {
          CategoryOfAccount: { type: "PENDAPATAN" },
          ...(backdate && {
            JournalEntry: {
              date: {
                gte: moment(backdate.split(",")[0]).toDate(),
                lte: moment(backdate.split(",")[1]).toDate(),
              },
            },
          }),
        },
        include: { CategoryOfAccount: true },
      }),
      prisma.journalDetail.findMany({
        where: {
          CategoryOfAccount: { type: "BEBAN" },
          ...(backdate && {
            JournalEntry: {
              date: {
                gte: moment(backdate.split(",")[0]).toDate(),
                lte: moment(backdate.split(",")[1]).toDate(),
              },
            },
          }),
        },
        include: { CategoryOfAccount: true },
      }),
    ]);

  const nomPendapatan = pendapatan.reduce(
    (acc, curr) => acc + (curr.credit - curr.debit),
    0,
  );
  const nomBeban = beban.reduce(
    (acc, curr) => acc + (curr.debit - curr.credit),
    0,
  );
  return NextResponse.json(
    {
      data: serializeForApi({
        asset,
        kewajiban,
        modal,
        pendapatan,
        beban,
        shu: nomPendapatan - nomBeban,
      }),
      status: 200,
    },
    { status: 200 },
  );
};

// RUGILABA
export const POST = async (request: NextRequest) => {
  const backdate = request.nextUrl.searchParams.get("backdate");
  const [pendapatan, beban] = await prisma.$transaction([
    prisma.categoryOfAccount.findMany({
      where: {
        type: "PENDAPATAN",
        parentId: { not: null },
      },
      include: {
        JournalDetail: {
          include: { JournalEntry: true },
          where: {
            ...(backdate && {
              JournalEntry: {
                date: {
                  gte: moment(backdate.split(",")[0]).toDate(),
                  lte: moment(backdate.split(",")[1]).toDate(),
                },
              },
            }),
          },
        },
      },
    }),
    prisma.categoryOfAccount.findMany({
      where: {
        type: "BEBAN",
        parentId: { not: null },
      },
      include: {
        JournalDetail: {
          include: { JournalEntry: true },
          where: {
            ...(backdate && {
              JournalEntry: {
                date: {
                  gte: moment(backdate.split(",")[0]).toDate(),
                  lte: moment(backdate.split(",")[1]).toDate(),
                },
              },
            }),
          },
        },
      },
    }),
  ]);

  return NextResponse.json(
    {
      data: serializeForApi({
        pendapatan,
        beban,
      }),
      status: 200,
    },
    { status: 200 },
  );
};
