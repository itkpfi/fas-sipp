import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";

// GET all pinjaman data
export async function GET(req: NextRequest) {
  try {
    const pinjaman = await prisma.pinjaman.findMany({
      where: { status: true },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: pinjaman,
    });
  } catch (error) {
    console.error("Error fetching pinjaman:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch data" },
      { status: 500 },
    );
  }
}

// POST create pinjaman
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nip,
      fullname,
      plafond,
      tenor,
      marginRate,
      adminRate,
      biayaAdmin,
      terimaBersih,
      totalMargin,
      totalBayar,
      angsuranPerBulan,
      scheduleJson,
    } = body;

    // Validate required fields
    if (!nip || !fullname || !plafond || !tenor) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create pinjaman with AngsuranPinkar using transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create Pinjaman
      const pinjaman = await tx.pinjaman.create({
        data: {
          nip,
          fullname,
          plafond,
          tenor,
          marginRate,
          adminRate,
          biayaAdmin,
          terimaBersih,
          totalMargin,
          totalBayar,
          angsuranPerBulan,
          scheduleJson: JSON.stringify(scheduleJson),
        },
      });

      // Create AngsuranPinkar entries
      const angsuranData = scheduleJson.map((jadwal: any) => ({
        counter: jadwal.no,
        principal: jadwal.pokok,
        margin: jadwal.margin,
        date_pay: new Date(jadwal.tanggal.split("/").reverse().join("-")), // Convert DD/MM/YYYY to Date
        remaining: jadwal.sisaPokok,
        status: "PENDING",
        pinjamanId: pinjaman.id,
      }));

      await tx.angsuranPinkar.createMany({
        data: angsuranData,
      });

      return pinjaman;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Data pinjaman dan jadwal angsuran berhasil disimpan",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating pinjaman:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create pinjaman" },
      { status: 500 },
    );
  }
}
