import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";
import moment from "moment";

interface IPinjamanDetailRow {
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
  angsuran?: number;
  tanggal: string;
  margin: number;
  pokok: number;
  sisaPokok: number;
}

const roundToThousand = (num: number) => Math.ceil(num / 1000) * 1000;

const getDefaultPinkarStartDate = () => moment().add(1, "month").startOf("month");

const parsePinkarStartDate = (scheduleJson: string) => {
  try {
    const parsed = JSON.parse(scheduleJson) as IAngsuranScheduleRow[];
    const firstSchedule = parsed[0];

    if (!firstSchedule?.tanggal) {
      return getDefaultPinkarStartDate();
    }

    const [day, month, year] = firstSchedule.tanggal.split("/");
    const parsedDate = moment(`${year}-${month}-${day}`, "YYYY-MM-DD", true);

    return parsedDate.isValid() ? parsedDate : getDefaultPinkarStartDate();
  } catch {
    return getDefaultPinkarStartDate();
  }
};

const buildPinkarSchedule = ({
  plafond,
  tenor,
  marginRate,
  adminRate,
  startDate,
}: {
  plafond: number;
  tenor: number;
  marginRate: number;
  adminRate: number;
  startDate: moment.Moment;
}) => {
  const marginPerBulan = (plafond * (marginRate / 100)) / 12;
  const pokokPerBulan = plafond / tenor;
  const angsuranPerBulan = roundToThousand(pokokPerBulan + marginPerBulan);
  const biayaAdmin = roundToThousand((plafond * adminRate) / 100);
  const terimaBersih = plafond - biayaAdmin;
  const totalMargin = roundToThousand(marginPerBulan * tenor);
  const totalBayar = angsuranPerBulan * tenor;

  const jadwal: IAngsuranScheduleRow[] = [];
  let sisaPokok = plafond;

  for (let i = 1; i <= tenor; i++) {
    const tgl = startDate.clone().add(i - 1, "month");
    const pokok = i === tenor ? sisaPokok : roundToThousand(pokokPerBulan);
    const margin = roundToThousand(marginPerBulan);
    const angsuran = pokok + margin;
    sisaPokok = Math.max(0, sisaPokok - pokok);

    jadwal.push({
      no: i,
      tanggal: tgl.format("DD/MM/YYYY"),
      angsuran,
      margin,
      pokok,
      sisaPokok,
    });
  }

  return {
    biayaAdmin,
    terimaBersih,
    totalMargin,
    totalBayar,
    angsuranPerBulan,
    jadwal,
  };
};

// GET detail pinjaman by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tidak ditemukan" },
        { status: 400 }
      );
    }

    const pinjaman = await prisma.$queryRaw<IPinjamanDetailRow[]>`
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
      WHERE id = ${id}
        AND status = true
      LIMIT 1
    `;

    if (!pinjaman[0]) {
      return NextResponse.json(
        { success: false, message: "Data pinjaman tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: pinjaman[0],
    });
  } catch (error) {
    console.error("Error fetching pinjaman detail:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch detail" },
      { status: 500 },
    );
  }
}

// PUT update pinjaman by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tidak ditemukan" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const {
      nip,
      fullname,
      phone,
      plafond,
      tenor,
      marginRate,
      adminRate,
      berkasFileUrl,
      akadFileUrl,
    } = body;

    const hasDocumentOnlyPayload =
      (typeof berkasFileUrl === "string" || berkasFileUrl === null) ||
      (typeof akadFileUrl === "string" || akadFileUrl === null);

    if (hasDocumentOnlyPayload && !nip && !fullname && !plafond && !tenor) {
      const updatePayload: { berkasFileUrl?: string | null; akadFileUrl?: string | null } = {};

      if (typeof berkasFileUrl === "string" || berkasFileUrl === null) {
        updatePayload.berkasFileUrl = berkasFileUrl;
      }

      if (typeof akadFileUrl === "string" || akadFileUrl === null) {
        updatePayload.akadFileUrl = akadFileUrl;
      }

      await prisma.pinjaman.update({
        where: { id },
        data: updatePayload,
      });

      return NextResponse.json({
        success: true,
        message: "Dokumen pinjaman berhasil diperbarui",
      });
    }

    const normalizedPhone = typeof phone === "string" ? phone.trim() : "";

    if (!nip || !fullname || !normalizedPhone || !plafond || !tenor) {
      return NextResponse.json(
        { success: false, message: "Data pinjaman tidak lengkap" },
        { status: 400 },
      );
    }

    const existingPinjaman = await prisma.$queryRaw<
      { id: string; scheduleJson: string }[]
    >`
      SELECT id, scheduleJson
      FROM Pinjaman
      WHERE id = ${id}
        AND status = true
      LIMIT 1
    `;

    if (!existingPinjaman[0]) {
      return NextResponse.json(
        { success: false, message: "Data pinjaman tidak ditemukan" },
        { status: 404 },
      );
    }

    const paidInstallmentCount = await prisma.angsuranPinkar.count({
      where: {
        pinjamanId: id,
        date_paid: {
          not: null,
        },
      },
    });

    if (paidInstallmentCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Pinjaman tidak bisa diupdate karena sudah memiliki angsuran yang dibayar",
        },
        { status: 400 },
      );
    }

    const anchoredStartDate = parsePinkarStartDate(existingPinjaman[0].scheduleJson);
    const calculatedPinjaman = buildPinkarSchedule({
      plafond,
      tenor,
      marginRate,
      adminRate,
      startDate: anchoredStartDate,
    });
    const scheduleJsonString = JSON.stringify(calculatedPinjaman.jadwal);

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        UPDATE Pinjaman
        SET
          nip = ${nip},
          fullname = ${fullname},
          phone = ${normalizedPhone},
          plafond = ${plafond},
          tenor = ${tenor},
          marginRate = ${marginRate},
          adminRate = ${adminRate},
          biayaAdmin = ${calculatedPinjaman.biayaAdmin},
          terimaBersih = ${calculatedPinjaman.terimaBersih},
          totalMargin = ${calculatedPinjaman.totalMargin},
          totalBayar = ${calculatedPinjaman.totalBayar},
          angsuranPerBulan = ${calculatedPinjaman.angsuranPerBulan},
          scheduleJson = ${scheduleJsonString},
          updated_at = ${new Date()}
        WHERE id = ${id}
      `;

      await tx.angsuranPinkar.deleteMany({
        where: { pinjamanId: id },
      });

      await tx.angsuranPinkar.createMany({
        data: calculatedPinjaman.jadwal.map((jadwal) => ({
          counter: jadwal.no,
          principal: jadwal.pokok,
          margin: jadwal.margin,
          date_pay: new Date(jadwal.tanggal.split("/").reverse().join("-")),
          remaining: jadwal.sisaPokok,
          status: "PENDING",
          pinjamanId: id,
        })),
      });
    });

    return NextResponse.json({
      success: true,
      message: "Data pinjaman berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error updating pinjaman:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update pinjaman" },
      { status: 500 },
    );
  }
}

// DELETE pinjaman
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID tidak ditemukan" },
        { status: 400 }
      );
    }

    const pinjaman = await prisma.pinjaman.update({
      where: { id },
      data: { status: false },
    });

    return NextResponse.json({
      success: true,
      message: "Data pinjaman berhasil dihapus",
      data: pinjaman,
    });
  } catch (error) {
    console.error("Error deleting pinjaman:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete pinjaman" },
      { status: 500 },
    );
  }
}
