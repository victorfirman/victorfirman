import { describe, expect, it } from "vitest";
import { TOTP, Secret } from "otpauth";
import { hashPassword, verifyPassword } from "./password";
import { hashToken, newToken } from "./tokens";
import { newTotpSecret, verifyTotp } from "./totp";
import { changePasswordSchema } from "../validation";

describe("password", () => {
  it("hash lalu verifikasi", async () => {
    const h = await hashPassword("rahasia1");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("rahasia1", h)).toBe(true);
    expect(await verifyPassword("rahasia2", h)).toBe(false);
  });
  it("salt berbeda tiap hash", async () => {
    expect(await hashPassword("abcdef")).not.toBe(await hashPassword("abcdef"));
  });
  it("format rusak ditolak, bukan crash", async () => {
    expect(await verifyPassword("x", "bukan-hash")).toBe(false);
  });
});

describe("validasi password", () => {
  const base = { currentPassword: "lama", confirmPassword: "" };
  it("minimal 6 karakter", () => {
    expect(changePasswordSchema.safeParse({ ...base, newPassword: "12345", confirmPassword: "12345" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...base, newPassword: "123456", confirmPassword: "123456" }).success).toBe(true);
  });
  it("konfirmasi harus sama", () => {
    expect(changePasswordSchema.safeParse({ ...base, newPassword: "123456", confirmPassword: "654321" }).success).toBe(false);
  });
});

describe("token", () => {
  it("acak dan di-hash deterministik", () => {
    const t = newToken();
    expect(t).not.toBe(newToken());
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toContain(t);
  });
});

describe("totp", () => {
  it("menerima kode saat ini, menolak kode salah", () => {
    const secret = newTotpSecret();
    const code = new TOTP({ secret: Secret.fromBase32(secret) }).generate();
    expect(verifyTotp(secret, code)).toBe(true);
    expect(verifyTotp(secret, `${code.slice(0, 3)} ${code.slice(3)}`)).toBe(true);
    expect(verifyTotp(secret, "000000") && verifyTotp(secret, "999999")).toBe(false);
    expect(verifyTotp(secret, "abc")).toBe(false);
  });
});
