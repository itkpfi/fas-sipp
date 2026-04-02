import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all tagihan pinkar (dari Pinjaman + AngsuranPinkar)
export async function GET(req: NextRequest) {
  try {
    const pinjamanList = await prisma.pinjaman.findMany({
      where: { status: true },
      include: {
        AngsuranPinkar: {
          orderBy: { counter: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Transform to tagihan format
    const tagihan = pinjamanList.map((pinjaman) => ({
      id: pinjaman.id,
      nip: pinjaman.nip,
      fullname: pinjaman.fullname,
      plafond: pinjaman.plafond,
      tenor: pinjaman.tenor,
      totalAngsuran: pinjaman.AngsuranPinkar.length,
      angsuranBelumBayar: pinjaman.AngsuranPinkar.filter((a) => !a.date_paid)
        .length,
      angsuranSudahBayar: pinjaman.AngsuranPinkar.filter((a) => a.date_paid)
        .length,
      angsuranList: pinjaman.AngsuranPinkar,
      createdAt: pinjaman.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: tagihan,
    });
  } catch (error) {
    console.error("Error fetching tagihan pinkar:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
