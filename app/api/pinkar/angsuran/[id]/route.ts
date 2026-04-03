import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT update AngsuranPinkar (tandai sudah bayar)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { date_paid, status } = body;

    const angsuran = await prisma.angsuranPinkar.update({
      where: { id },
      data: {
        date_paid: date_paid ? new Date(date_paid) : null,
        status: status || "PAID",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Angsuran berhasil diupdate",
      data: angsuran,
    });
  } catch (error) {
    console.error("Error updating angsuran:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update angsuran" },
      { status: 500 },
    );
  }
}

// DELETE AngsuranPinkar (undo pembayaran)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const angsuran = await prisma.angsuranPinkar.update({
      where: { id },
      data: {
        date_paid: null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pembayaran berhasil dikembalikan",
      data: angsuran,
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete payment" },
      { status: 500 },
    );
  }
}
