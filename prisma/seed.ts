import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
const prisma = new PrismaClient();

async function main() {
  const role = await prisma.role.upsert({
    where: { name: "Developer" },
    create: {
      id: "RL001",
      name: "Developer",
      permission: JSON.stringify([
        {
          path: "/master/roles",
          access: ["read", "write", "update", "delete"],
        },
      ]),
      status: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    update: {
      permission: JSON.stringify([
        {
          path: "/master/roles",
          access: ["read", "write", "update", "delete"],
        },
      ]),
    },
  });
  const area = await prisma.area.upsert({
    where: { id: "KW01" },
    create: {
      id: "KW01",
      name: "JAWA BARAT",
      status: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    update: {},
  });
  const unit = await prisma.cabang.upsert({
    where: { id: "UP001" },
    create: {
      id: "UP001",
      name: "PUSAT",
      address: "",
      phone: "",
      areaId: area.id,
      status: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    update: {},
  });

  const pass = await bcrypt.hash("Tsani182", 10);
  await prisma.user.upsert({
    where: { username: "developer" },
    update: {},
    create: {
      id: "USR001",
      nip: "0100120250101",
      fullname: "Developer SIPP",
      username: "developer",
      password: pass,
      email: "developer@gmail.com",
      phone: "0881022157439",
      target: 0,
      status: true,
      created_at: new Date(),
      updated_at: new Date(),
      roleId: role.id,
      cabangId: unit.id,
    },
  });
  const pass2 = await bcrypt.hash("Tsani182", 10);
  await prisma.user.upsert({
    where: { username: "developer2" },
    update: {},
    create: {
      id: "USR002",
      nip: "0100120250102",
      fullname: "Developer SIPP",
      username: "developer2",
      password: pass2,
      email: "developer2@gmail.com",
      phone: "0881022157440",
      target: 0,
      status: true,
      created_at: new Date(),
      updated_at: new Date(),
      roleId: role.id,
      cabangId: unit.id,
    },
  });

  console.log("Seeding succeesfully...");
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
