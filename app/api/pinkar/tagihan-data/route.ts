import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all tagihan pinkar (dari Pinjaman + AngsuranPinkar)
export async function GET(req: NextRequest) {
  try {
    const pinjamanList = await prisma.pinjaman.findMany({
      where: { status: true },
      include: {
        User: {
          select: {
            id: true,
            nip: true,
            fullname: true,
            phone: true,
            email: true,
            address: true,
            position: true,
          },
        },
        AngsuranPinkar: {
          orderBy: { counter: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Transform to tagihan format
    const tagihan = pinjamanList.map((pinjaman) => ({
      id: pinjaman.id,
      nip: pinjaman.User?.nip || pinjaman.nip,
      fullname: pinjaman.User?.fullname || pinjaman.fullname,
      phone: pinjaman.User?.phone || pinjaman.phone,
      plafond: pinjaman.plafond,
      tenor: pinjaman.tenor,
      totalAngsuran: pinjaman.AngsuranPinkar.length,
      angsuranBelumBayar: pinjaman.AngsuranPinkar.filter((a) => !a.date_paid)
        .length,
      angsuranSudahBayar: pinjaman.AngsuranPinkar.filter((a) => a.date_paid)
        .length,
      angsuranList: pinjaman.AngsuranPinkar,
      createdAt: pinjaman.created_at,
      User: pinjaman.User,
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
