import prisma from "@/libs/Prisma";
import { NextRequest, NextResponse } from "next/server";

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

    const pinjaman = await prisma.pinjaman.findUnique({
      where: { id },
    });

    if (!pinjaman) {
      return NextResponse.json(
        { success: false, message: "Data pinjaman tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: pinjaman,
    });
  } catch (error) {
    console.error("Error fetching pinjaman detail:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch detail" },
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
