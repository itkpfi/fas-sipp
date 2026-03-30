import { GetAngsuran, IDRFormat } from "@/components/utils/PembiayaanUtil";
import prisma from "@/libs/Prisma";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const POST = async (req: NextRequest) => {
  const formData = await req.formData();
  const periode = req.nextUrl.searchParams.get("periode");
  const file = formData.get("file") as File;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return NextResponse.json(
        {
          status: 400,
          msg: ["File Excel kosong"],
        },
        { status: 400 },
      );
    }

    const tagihan = await prisma.angsuran.findMany({
      where: {
        Dapem: { dropping_status: "APPROVED", status: true },
        date_pay: {
          gte: moment(periode || new Date())
            .startOf("month")
            .toDate(),
          lte: moment(periode || new Date())
            .endOf("month")
            .toDate(),
        },
      },
      include: {
        Dapem: {
          include: {
            Debitur: true,
            ProdukPembiayaan: { include: { Sumdan: true } },
          },
        },
      },
    });

    const msg: { name: string; value: string[] }[] = [];

    for (const col of data as any) {
      const row = {
        name: String(col["Nama"]),
        nopen: String(col["Nopen"]),
        no_skep: String(col["No SKEP"]),
        no_pk: String(col["No PK"]),
        plafond: Number(col["Plafond"]),
        tenor: Number(col["Tenor"]),
        angsuran: Number(col["Angsuran"]),
        ke: Number(col["Ke"]),
      };
      const filter = tagihan.filter((t) => t.Dapem.nopen === row.nopen);
      const find =
        filter.length >= 2
          ? {
              ...filter.find(
                (t) => t.Dapem.ProdukPembiayaan.Sumdan.code !== "KPF",
              ),
              Dapem: {
                ...filter.find(
                  (t) => t.Dapem.ProdukPembiayaan.Sumdan.code !== "KPF",
                )?.Dapem,
                plafond: filter.reduce(
                  (acc, curr) => acc + curr.Dapem.plafond,
                  0,
                ),
                angsuran: filter.reduce(
                  (acc, curr) =>
                    acc +
                    GetAngsuran(
                      curr.Dapem.plafond,
                      curr.Dapem.tenor,
                      curr.Dapem.c_margin + curr.Dapem.c_margin_sumdan,
                      curr.Dapem.margin_type,
                      curr.Dapem.rounded,
                    ).angsuran,
                  0,
                ),
              },
            }
          : filter[0];
      if (!find) {
        msg.push({
          name: `${row.name} (${row.nopen})`,
          value: [`Nopen tidak ditemukan pada tagihan periode yg dipilih.`],
        });
        continue;
      }
      const temp: string[] = [];
      if (
        row.name.toLocaleLowerCase() !==
        find?.Dapem?.Debitur?.fullname.toLocaleLowerCase()
      ) {
        temp.push(
          `Nama tidak sesuai ${row.name} - ${find?.Dapem?.Debitur?.fullname}`,
        );
      }
      if (
        row.no_skep.toLocaleLowerCase() !==
        find?.Dapem?.Debitur?.no_skep?.toLocaleLowerCase()
      ) {
        temp.push(
          `Nomor SKEP tidak sesuai ${row.no_skep} - ${find?.Dapem?.Debitur?.no_skep}`,
        );
      }
      if (
        row.no_pk.toLocaleLowerCase() !==
        find?.Dapem.no_contract?.toLocaleLowerCase()
      ) {
        temp.push(
          `Nomor PK tidak sesuai ${row.no_pk} - ${find?.Dapem.no_contract}`,
        );
      }
      if (row.plafond !== find?.Dapem.plafond) {
        temp.push(
          `Plafond tidak sesuai ${IDRFormat(row.plafond)} - ${IDRFormat(find?.Dapem.plafond || 0)}`,
        );
      }
      if (row.tenor !== find?.Dapem.tenor) {
        temp.push(
          `Tenor tidak sesuai ${IDRFormat(row.tenor)} - ${find.Dapem.tenor}`,
        );
      }

      if (row.angsuran !== (find as any).angsuran) {
        temp.push(
          `Angsuran tidak sesuai ${IDRFormat(row.angsuran)} - ${IDRFormat((find as any).angsuran)}`,
        );
      }
      if (row.ke !== find.counter) {
        temp.push(`Angsuran Ke tidak sesuai ${row.ke} - ${find.counter}`);
      }
      if (find.date_paid) {
        temp.push(`Angsuran Ke ${row.ke} masih terdapat blokir`);
      }
      if (find.Dapem.takeover_status !== "APPROVED") {
        temp.push(`Belum dilakukan pelunasan ke instansi lain`);
      }
      if (find.Dapem.mutasi_status !== "APPROVED") {
        temp.push(`Belum dilakukan mutasi kantor bayar`);
      }
      if (temp.length !== 0) {
        msg.push({
          name: `${row.name} (${row.nopen})`,
          value: temp,
        });
      }
    }
    const nopenDiExcel = (data as any[]).map((col) => String(col["Nopen"]));
    const debiturTidakAdaDiExcel = tagihan.filter(
      (t) =>
        !nopenDiExcel.includes(t.Dapem.nopen) &&
        t.Dapem.takeover_status === "APPROVED" &&
        t.Dapem.mutasi_status === "APPROVED",
    );
    msg.push({
      name: `EXCLUDE EXCEL FILE`,
      value: debiturTidakAdaDiExcel.map(
        (d) => `${d.Dapem.Debitur.fullname} (${d.Dapem.nopen})`,
      ),
    });

    return NextResponse.json(
      {
        status: 200,
        msg: ["File Excel berhasil diunggah", data.length + " data ditemukan"],
        data: msg,
      },
      { status: 200 },
    );
  } catch (err) {
    console.log(err);
    return NextResponse.json(
      {
        status: 500,
        msg: ["Internal Server Error"],
      },
      { status: 500 },
    );
  }
};
