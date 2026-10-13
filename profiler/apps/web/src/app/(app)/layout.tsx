import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/roles";


export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const path = (await headers()).get("x-pathname") ?? "/";
  if (user.mustChangePassword && path !== "/akun/ganti-password") redirect("/akun/ganti-password");

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">Profiler</Link>
        <nav aria-label="Akun" className="account">
          <span className="who">
            {user.name} <small>· {ROLE_LABEL[user.role]}</small>
          </span>
          <Link href="/akun/ganti-password">Ganti Password</Link>
          <Link href="/akun/keamanan">Keamanan</Link>
          <form action={logoutAction}>
            <button type="submit" className="link">Keluar</button>
          </form>
        </nav>
      </header>
      <main className="page">{children}</main>
    </>
  );
}
