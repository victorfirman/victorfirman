import { Secret, TOTP } from "otpauth";

const ISSUER = "Profiler";

export function newTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

function totp(secret: string, label: string) {
  return new TOTP({ issuer: ISSUER, label, algorithm: "SHA1", digits: 6, period: 30, secret: Secret.fromBase32(secret) });
}

export function totpUri(secret: string, email: string): string {
  return totp(secret, email).toString();
}

/** Menerima selisih ±1 periode (30 detik) untuk jam ponsel yang sedikit meleset. */
export function verifyTotp(secret: string, code: string): boolean {
  const clean = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  return totp(secret, "").validate({ token: clean, window: 1 }) !== null;
}
