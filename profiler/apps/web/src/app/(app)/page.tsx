import { requireUser } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/roles";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ akses?: string }> }) {
  const user = await requireUser();
  const { akses } = await searchParams;
  return (
    <>
      {akses === "ditolak" && <p className="msg error" role="alert">Anda tidak punya akses ke halaman itu.</p>}
      <h1>Selamat datang, {user.name}</h1>
      <p className="muted">Masuk sebagai {ROLE_LABEL[user.role]}.</p>
      <p className="notice">
        Profiler adalah alat profiling perilaku &amp; kemampuan kerja untuk pengembangan karyawan.
        Hasilnya bukan dasar keputusan promosi, mutasi, atau PHK.
      </p>
    </>
  );
}
