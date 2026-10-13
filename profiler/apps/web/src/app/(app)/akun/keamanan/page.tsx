import QRCode from "qrcode";
import { confirm2faAction, disable2faAction, start2faSetupAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/Form";
import { PasswordInput } from "@/components/PasswordInput";
import { requireUser } from "@/lib/auth/session";
import { totpUri } from "@/lib/auth/totp";
import { db } from "@/lib/db";

export default async function SecurityPage() {
  const me = await requireUser();
  const user = await db.user.findUniqueOrThrow({ where: { id: me.id }, select: { email: true, totpEnabled: true, totpSecret: true } });

  return (
    <section className="narrow">
      <h1>Keamanan akun</h1>
      <h2>Verifikasi dua langkah (opsional)</h2>
      {user.totpEnabled ? (
        <>
          <p className="msg ok">Aktif. Setiap masuk, Anda diminta kode dari aplikasi autentikator.</p>
          <ActionForm action={disable2faAction} submitLabel="Nonaktifkan">
            <PasswordInput name="password" label="Konfirmasi dengan password" autoComplete="current-password" />
          </ActionForm>
        </>
      ) : user.totpSecret ? (
        <>
          <p>Pindai kode QR ini dengan Google Authenticator, Microsoft Authenticator, atau sejenisnya, lalu masukkan 6 digit kodenya.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={await QRCode.toDataURL(totpUri(user.totpSecret, user.email))} alt="Kode QR untuk aplikasi autentikator" width={200} height={200} />
          <p className="muted">Atau masukkan manual: <code>{user.totpSecret}</code></p>
          <ActionForm action={confirm2faAction} submitLabel="Aktifkan">
            <div className="field">
              <label htmlFor="code">Kode 6 digit</label>
              <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required />
            </div>
          </ActionForm>
        </>
      ) : (
        <form action={start2faSetupAction}>
          <p className="muted">Lindungi akun dengan kode dari ponsel selain password.</p>
          <button type="submit" className="primary">Siapkan verifikasi dua langkah</button>
        </form>
      )}
    </section>
  );
}
