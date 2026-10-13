import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@prisma/client";
import { db } from "../db";
import { hashToken, newToken } from "./tokens";

export const SESSION_COOKIE = "profiler_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 jam
const PENDING_2FA_TTL_MS = 10 * 60 * 1000; // 10 menit untuk memasukkan kode 2FA

export type SessionUser = Pick<User, "id" | "email" | "name" | "role" | "totpEnabled" | "mustChangePassword">;

export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip");
}

export async function createSession(userId: string, opts: { pending2fa: boolean }): Promise<void> {
  const token = newToken();
  const ttl = opts.pending2fa ? PENDING_2FA_TTL_MS : SESSION_TTL_MS;
  const expiresAt = new Date(Date.now() + ttl);
  await db.session.create({
    data: {
      id: hashToken(token),
      userId,
      pending2fa: opts.pending2fa,
      expiresAt,
      ip: await clientIp(),
      userAgent: (await headers()).get("user-agent")?.slice(0, 300),
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

async function readSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  return session;
}

/** Sesi lengkap (sudah lolos 2FA bila aktif). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const s = await readSession();
  if (!s || s.pending2fa) return null;
  const { id, email, name, role, totpEnabled, mustChangePassword } = s.user;
  return { id, email, name, role, totpEnabled, mustChangePassword };
}

/** Sesi yang menunggu kode 2FA. */
export async function getPending2faSession() {
  const s = await readSession();
  return s?.pending2fa ? s : null;
}

/** Naikkan sesi pending-2FA menjadi sesi penuh (token baru, cegah session fixation). */
export async function promotePendingSession(sessionId: string, userId: string): Promise<void> {
  await db.session.delete({ where: { id: sessionId } });
  await createSession(userId, { pending2fa: false });
}

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

/** Cabut semua sesi lain milik pengguna (mis. setelah ganti password). */
export async function revokeOtherSessions(userId: string): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  await db.session.deleteMany({
    where: { userId, ...(token ? { NOT: { id: hashToken(token) } } : {}) },
  });
}

export async function requireUser(roles?: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles && !roles.includes(user.role)) redirect("/?akses=ditolak");
  return user;
}
