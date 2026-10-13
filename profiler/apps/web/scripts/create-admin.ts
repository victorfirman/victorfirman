/**
 * Buat (atau reset) akun Admin HR pertama.
 *   npm run create-admin -- --email hr@perusahaan.co.id --name "Nama HR"
 *
 * Password TIDAK ditulis di kode. Skrip membuat password sementara acak, mencetaknya
 * sekali, dan memaksa ganti password saat login pertama. Bisa juga diberikan lewat
 * env ADMIN_PASSWORD (min. 6 karakter).
 */
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../src/lib/auth/password";

async function main() {
  const { values } = parseArgs({ options: { email: { type: "string" }, name: { type: "string" } } });
  const email = values.email?.trim().toLowerCase();
  if (!email) throw new Error("Wajib: --email");
  const name = values.name?.trim() || "Admin HR";

  const given = process.env.ADMIN_PASSWORD;
  if (given !== undefined && given.length < PASSWORD_MIN_LENGTH) {
    throw new Error(`ADMIN_PASSWORD minimal ${PASSWORD_MIN_LENGTH} karakter`);
  }
  const password = given ?? randomBytes(9).toString("base64url");

  const db = new PrismaClient();
  try {
    const passwordHash = await hashPassword(password);
    const user = await db.user.upsert({
      where: { email },
      create: { email, name, role: "HR_ADMIN", passwordHash, mustChangePassword: true },
      update: { role: "HR_ADMIN", passwordHash, mustChangePassword: true, active: true, failedLogins: 0, lockedUntil: null },
    });
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.auditLog.create({ data: { action: "user.created", targetType: "User", targetId: user.id, meta: { via: "cli", role: "HR_ADMIN" } } });
    console.log(`Admin HR siap: ${email}`);
    if (given === undefined) console.log(`Password sementara (wajib diganti saat masuk): ${password}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
