import { changePasswordAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/Form";
import { PasswordInput } from "@/components/PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";

export default async function ChangePasswordPage() {
  const user = await requireUser();
  return (
    <section className="narrow">
      <h1>Ganti Password</h1>
      {user.mustChangePassword && (
        <p className="msg error" role="alert">Anda wajib mengganti password sementara sebelum melanjutkan.</p>
      )}
      <ActionForm action={changePasswordAction} submitLabel="Simpan password baru">
        <PasswordInput name="currentPassword" label="Password lama" autoComplete="current-password" />
        <PasswordInput name="newPassword" label={`Password baru (min. ${PASSWORD_MIN_LENGTH} karakter)`} autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} />
        <PasswordInput name="confirmPassword" label="Ulangi password baru" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} />
      </ActionForm>
    </section>
  );
}
