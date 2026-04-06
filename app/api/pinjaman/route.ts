import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";

interface IPinjamanRow {
  id: string;
  nip: string;
  fullname: string;
  phone: string | null;
  plafond: number;
  tenor: number;
  marginRate: number;
  adminRate: number;
  biayaAdmin: number;
  terimaBersih: number;
  totalMargin: number;
  totalBayar: number;
  angsuranPerBulan: number;
  berkasFileUrl: string | null;
  akadFileUrl: string | null;
  scheduleJson: string;
  status: number | boolean;
  created_at: Date;
  updated_at: Date;
}

interface IAngsuranScheduleRow {
  no: number;
  tanggal: string;
  margin: number;
  pokok: number;
  sisaPokok: number;
}

// GET all pinjaman data
export async function GET() {
  try {
    const pinjaman = await prisma.$queryRaw<IPinjamanRow[]>`
      SELECT
        id,
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
        berkasFileUrl,
        akadFileUrl,
        scheduleJson,
        status,
        created_at,
        updated_at
      FROM Pinjaman
      WHERE status = true
      ORDER BY created_at DESC
    `;

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
    const normalizedPhone =
      typeof phone === "string" && phone.trim().length > 0 ? phone.trim() : null;

    // Validate required fields
    if (!nip || !fullname || !plafond || !tenor) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Create pinjaman with AngsuranPinkar using transaction
    const result = await prisma.$transaction(async (tx) => {
      const pinjamanId = crypto.randomUUID();
      const scheduleJsonString = JSON.stringify(scheduleJson);

      await tx.$executeRaw`
        INSERT INTO Pinjaman (
          id,
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
          scheduleJson
        ) VALUES (
          ${pinjamanId},
          ${nip},
          ${fullname},
          ${normalizedPhone},
          ${plafond},
          ${tenor},
          ${marginRate},
          ${adminRate},
          ${biayaAdmin},
          ${terimaBersih},
          ${totalMargin},
          ${totalBayar},
          ${angsuranPerBulan},
          ${scheduleJsonString}
        )
      `;

      // Create AngsuranPinkar entries
      const angsuranData = scheduleJson.map((jadwal: IAngsuranScheduleRow) => ({
        counter: jadwal.no,
        principal: jadwal.pokok,
        margin: jadwal.margin,
        date_pay: new Date(jadwal.tanggal.split("/").reverse().join("-")), // Convert DD/MM/YYYY to Date
        remaining: jadwal.sisaPokok,
        status: "PENDING",
        pinjamanId,
      }));

      await tx.angsuranPinkar.createMany({
        data: angsuranData,
      });

      return {
        id: pinjamanId,
        nip,
        fullname,
        phone: normalizedPhone,
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
      };
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
