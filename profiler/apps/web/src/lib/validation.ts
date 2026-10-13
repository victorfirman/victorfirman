import { z } from "zod";
import { PASSWORD_MIN_LENGTH } from "./auth/password";

export const emailSchema = z.email("Format email tidak valid").transform((s) => s.trim().toLowerCase());

export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password minimal ${PASSWORD_MIN_LENGTH} karakter`)
  .max(200, "Password terlalu panjang");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password wajib diisi"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Password lama wajib diisi"),
    newPassword: newPasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

export const resetPasswordSchema = z
  .object({ token: z.string().min(1), newPassword: newPasswordSchema, confirmPassword: z.string() })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Konfirmasi password tidak sama",
  });

export const totpCodeSchema = z.string().regex(/^\s*\d{3}\s?\d{3}\s*$/, "Kode harus 6 digit");

export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Input tidak valid";
}
