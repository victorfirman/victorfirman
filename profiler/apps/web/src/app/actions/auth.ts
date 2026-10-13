"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { sendMail } from "@/lib/mail";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hashToken, newToken } from "@/lib/auth/tokens";
import { newTotpSecret, verifyTotp } from "@/lib/auth/totp";
import {
  clientIp,
  createSession,
  destroyCurrentSession,
  getCurrentUser,
  getPending2faSession,
  promotePendingSession,
  requireUser,
  revokeOtherSessions,
} from "@/lib/auth/session";
import {
  changePasswordSchema,
  emailSchema,
  firstError,
  loginSchema,
  resetPasswordSchema,
  totpCodeSchema,
} from "@/lib/validation";

export type FormState = { error?: string; ok?: string };

const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;
const GENERIC_LOGIN_ERROR = "Email atau password salah.";

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const { email, password } = parsed.data;
  const ip = await clientIp();

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    await audit({ action: "auth.login_failed", ip, meta: { email, reason: "unknown_user" } });
    return { error: GENERIC_LOGIN_ERROR };
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit." };
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    const failed = user.failedLogins + 1;
    await db.user.update({
      where: { id: user.id },
      data: {
        failedLogins: failed >= MAX_FAILED_LOGINS ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MS) : null,
      },
    });
    await audit({ actorId: user.id, action: "auth.login_failed", ip, meta: { reason: "bad_password" } });
    return { error: GENERIC_LOGIN_ERROR };
  }

  await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await createSession(user.id, { pending2fa: user.totpEnabled });
  if (user.totpEnabled) redirect("/login/2fa");
  await audit({ actorId: user.id, action: "auth.login", ip });
  redirect(user.mustChangePassword ? "/akun/ganti-password" : "/");
}

export async function verify2faAction(_: FormState, form: FormData): Promise<FormState> {
  const session = await getPending2faSession();
  if (!session) redirect("/login");
  const code = totpCodeSchema.safeParse(form.get("code"));
  if (!code.success) return { error: firstError(code.error) };
  const ip = await clientIp();
  if (!session.user.totpSecret || !verifyTotp(session.user.totpSecret, code.data)) {
    await audit({ actorId: session.userId, action: "auth.2fa_failed", ip });
    return { error: "Kode salah atau sudah kedaluwarsa." };
  }
  await promotePendingSession(session.id, session.userId);
  await audit({ actorId: session.userId, action: "auth.login", ip, meta: { twoFactor: true } });
  redirect(session.user.mustChangePassword ? "/akun/ganti-password" : "/");
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  await destroyCurrentSession();
  if (user) await audit({ actorId: user.id, action: "auth.logout", ip: await clientIp() });
  redirect("/login");
}

export async function changePasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: form.get("currentPassword"),
    newPassword: form.get("newPassword"),
    confirmPassword: form.get("confirmPassword"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    return { error: "Password lama salah." };
  }
  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return { error: "Password baru harus berbeda dari password lama." };
  }
  await db.user.update({
    where: { id: me.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword),
      passwordChangedAt: new Date(),
      mustChangePassword: false,
    },
  });
  await revokeOtherSessions(me.id);
  await audit({ actorId: me.id, action: "auth.password_changed", ip: await clientIp() });
  revalidatePath("/", "layout");
  return { ok: "Password berhasil diganti. Sesi di perangkat lain sudah dikeluarkan." };
}

export async function requestResetAction(_: FormState, form: FormData): Promise<FormState> {
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { error: firstError(email.error) };
  const done: FormState = { ok: "Jika email terdaftar, tautan reset password sudah dikirim. Berlaku 1 jam." };

  const user = await db.user.findUnique({ where: { email: email.data } });
  if (!user || !user.active) return done;

  const token = newToken();
  await db.passwordResetToken.create({
    data: { id: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  const link = `${process.env.APP_URL ?? "http://localhost:3100"}/reset-password/${token}`;
  await sendMail({
    to: user.email,
    subject: "Reset password Profiler",
    text: `Halo ${user.name},\n\nBuka tautan ini untuk membuat password baru (berlaku 1 jam):\n${link}\n\nAbaikan email ini jika Anda tidak memintanya.`,
  });
  await audit({ actorId: user.id, action: "auth.password_reset_requested", ip: await clientIp() });
  return done;
}

export async function resetPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: form.get("token"),
    newPassword: form.get("newPassword"),
    confirmPassword: form.get("confirmPassword"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const record = await db.passwordResetToken.findUnique({ where: { id: hashToken(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru." };
  }
  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.$transaction([
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash, passwordChangedAt: new Date(), mustChangePassword: false, failedLogins: 0, lockedUntil: null },
    }),
    db.session.deleteMany({ where: { userId: record.userId } }),
  ]);
  await audit({ actorId: record.userId, action: "auth.password_reset", ip: await clientIp() });
  redirect("/login?reset=1");
}

/** Langkah 1 aktivasi 2FA: buat rahasia (belum aktif sampai kode dikonfirmasi). */
export async function start2faSetupAction(): Promise<void> {
  const me = await requireUser();
  if (me.totpEnabled) return;
  await db.user.update({ where: { id: me.id }, data: { totpSecret: newTotpSecret() } });
  redirect("/akun/keamanan");
}

export async function confirm2faAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const code = totpCodeSchema.safeParse(form.get("code"));
  if (!code.success) return { error: firstError(code.error) };
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!user.totpSecret || !verifyTotp(user.totpSecret, code.data)) {
    return { error: "Kode salah. Pastikan jam ponsel akurat lalu coba lagi." };
  }
  await db.user.update({ where: { id: me.id }, data: { totpEnabled: true } });
  await audit({ actorId: me.id, action: "auth.2fa_enabled", ip: await clientIp() });
  return { ok: "Verifikasi dua langkah aktif." };
}

export async function disable2faAction(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
  if (!(await verifyPassword(String(form.get("password") ?? ""), user.passwordHash))) {
    return { error: "Password salah." };
  }
  await db.user.update({ where: { id: me.id }, data: { totpEnabled: false, totpSecret: null } });
  await audit({ actorId: me.id, action: "auth.2fa_disabled", ip: await clientIp() });
  return { ok: "Verifikasi dua langkah dinonaktifkan." };
}
