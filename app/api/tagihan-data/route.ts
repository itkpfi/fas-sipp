import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all tagihan data (Dapem + Angsuran)
export async function GET(req: NextRequest) {
  try {
    const dapemList = await prisma.dapem.findMany({
      where: { status: true },
      include: {
        Debitur: true,
        Angsuran: {
          orderBy: { counter: "asc" },
        },
        Pelunasan: true,
      },
      orderBy: { created_at: "desc" },
    });

    // Transform to tagihan format
    const tagihan = dapemList.map((dapem) => ({
      id: dapem.id,
      nopen: dapem.nopen,
      fullname: dapem.Debitur?.fullname || "-",
      plafond: dapem.plafond,
      tenor: dapem.tenor,
      noKontrak: dapem.no_contract,
      totalAngsuran: dapem.Angsuran.length,
      angsuranBelumBayar: dapem.Angsuran.filter((a) => !a.date_paid).length,
      angsuranSudahBayar: dapem.Angsuran.filter((a) => a.date_paid).length,
      angsuranList: dapem.Angsuran,
      pelunasan: dapem.Pelunasan,
      createdAt: dapem.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: tagihan,
    });
  } catch (error) {
    console.error("Error fetching tagihan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
