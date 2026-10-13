import type { Role } from "@prisma/client";

export const ROLE_LABEL: Record<Role, string> = {
  HR_ADMIN: "Admin HR",
  MANAGER: "Atasan langsung",
  EMPLOYEE: "Karyawan",
};
