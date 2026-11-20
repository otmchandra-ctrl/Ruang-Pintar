import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const u = await prisma.pengguna.findUnique({
    where: { username: "siswa" },
  });
  console.log(
    "User siswa:",
    u ? { id: u.id, username: u.username, hash: u.password_hash } : "Not found"
  );

  if (u) {
    const list = ["siswa", "siswa123", "Siswa123!", "Siswa2026!", "otomindo", "password"];
    for (const p of list) {
      if (bcrypt.compareSync(p, u.password_hash)) {
        console.log("PASSWORD SISWA IS:", p);
        break;
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
