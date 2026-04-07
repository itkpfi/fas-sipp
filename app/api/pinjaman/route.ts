import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";

interface IAngsuranScheduleRow {
  no: number;
  tanggal: string;
  margin: number;
  pokok: number;
  sisaPokok: number;
}

// GET all pinjaman data with User relation
export async function GET() {
  try {
    const pinjaman = await prisma.pinjaman.findMany({
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
      },
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
      userId,
      nip,
      fullname,
      phone,
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
    if (!userId && !nip) {
      return NextResponse.json(
        { success: false, message: "userId or nip harus disediakan" },
        { status: 400 },
      );
    }

    if (!plafond || !tenor) {
      return NextResponse.json(
        { success: false, message: "plafond dan tenor harus disediakan" },
        { status: 400 },
      );
    }

    // Find user by userId or nip
    let userRecord = null;
    if (userId) {
      userRecord = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else if (nip) {
      userRecord = await prisma.user.findFirst({
        where: { nip },
      });
    }

    if (!userRecord) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // Create pinjaman with AngsuranPinkar using transaction
    const result = await prisma.$transaction(async (tx) => {
      const scheduleJsonString = JSON.stringify(scheduleJson);

      const pinjaman = await tx.pinjaman.create({
        data: {
          nip: nip || userRecord.nip || undefined, // Keep nip for backward compatibility
          fullname: fullname || userRecord.fullname,
          phone: phone || userRecord.phone || undefined,
          plafond,
          tenor,
          marginRate,
          adminRate,
          biayaAdmin,
          terimaBersih,
          totalMargin,
          totalBayar,
          angsuranPerBulan,
          scheduleJson: scheduleJsonString,
          userId: userRecord.id,
        },
      });

      // Create AngsuranPinkar entries
      const angsuranData = scheduleJson.map((jadwal: IAngsuranScheduleRow) => ({
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
