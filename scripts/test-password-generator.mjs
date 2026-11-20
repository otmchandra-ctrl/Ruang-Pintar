import crypto from "node:crypto";
import { validatePasswordPolicy } from "../src/shared/lib/password.ts";

// Generator password profesional ramah siswa:
// Format: <prefix_rombel>#<4_angka_acak>@<2_huruf_acak>
// Contoh: xto5#4928@ab, xrpl#7182@km
export function generateStudentPassword(rombelCode) {
  const cleanRombel = (rombelCode || "siswa").toLowerCase().replace(/[^a-z0-9]/g, "");

  // 4 digit angka acak (1000 - 9999)
  const randomDigits = crypto.randomInt(1000, 9999).toString();

  // 2 huruf kecil acak (a-z, hindari l dan o jika perlu, tapi semua a-z valid)
  const chars = "abcdefghjkmnpqrstuvwxyz"; // mengecualikan l dan o agar tidak tertukar dengan 1 dan 0
  const c1 = chars[crypto.randomInt(0, chars.length)];
  const c2 = chars[crypto.randomInt(0, chars.length)];

  const password = `${cleanRombel}#${randomDigits}@${c1}${c2}`;
  return password;
}

// Uji coba 10 sampel
console.log("=== UJI COBA GENERATOR PASSWORD SISWA ===");
const samples = ["X TO 5", "X TO 5", "X TO 5", "X RPL", "XI TJKT 2", "XII TKRO 1"];
const generated = new Set();

for (const r of samples) {
  const pass = generateStudentPassword(r);
  const policy = validatePasswordPolicy(pass);
  console.log({
    rombel: r,
    password: pass,
    length: pass.length,
    valid: policy.valid,
    isUnique: !generated.has(pass),
  });
  generated.add(pass);
}
