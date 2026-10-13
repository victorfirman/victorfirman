import { redirect } from "next/navigation";
import { verify2faAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/Form";
import { getPending2faSession } from "@/lib/auth/session";

export default async function TwoFactorPage() {
  if (!(await getPending2faSession())) redirect("/login");
  return (
    <>
      <h1>Verifikasi dua langkah</h1>
      <p className="muted">Masukkan 6 digit kode dari aplikasi autentikator Anda.</p>
      <ActionForm action={verify2faAction} submitLabel="Verifikasi">
        <div className="field">
          <label htmlFor="code">Kode</label>
          <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" maxLength={7} required autoFocus />
        </div>
      </ActionForm>
    </>
  );
}
