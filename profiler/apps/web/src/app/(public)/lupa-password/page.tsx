import Link from "next/link";
import { requestResetAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/Form";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1>Lupa password</h1>
      <p className="muted">Kami akan mengirim tautan untuk membuat password baru ke email Anda.</p>
      <ActionForm action={requestResetAction} submitLabel="Kirim tautan">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
        </div>
      </ActionForm>
      <p className="muted"><Link href="/login">Kembali ke halaman masuk</Link></p>
    </>
  );
}
