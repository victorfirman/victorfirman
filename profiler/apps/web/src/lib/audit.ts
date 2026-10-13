import type { Prisma } from "@prisma/client";
import { db } from "./db";

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.2fa_failed"
  | "auth.2fa_enabled"
  | "auth.2fa_disabled"
  | "auth.password_changed"
  | "auth.password_reset_requested"
  | "auth.password_reset"
  | "user.created";

export async function audit(entry: {
  actorId?: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  ip?: string | null;
  meta?: Prisma.InputJsonValue;
}): Promise<void> {
  await db.auditLog.create({ data: entry });
}
