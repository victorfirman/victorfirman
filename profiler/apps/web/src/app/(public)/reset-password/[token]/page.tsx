import { resetPasswordAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/Form";
import { PasswordInput } from "@/components/PasswordInput";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/password";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <>
      <h1>Buat password baru</h1>
      <ActionForm action={resetPasswordAction} submitLabel="Simpan password">
        <input type="hidden" name="token" value={token} />
        <PasswordInput name="newPassword" label={`Password baru (min. ${PASSWORD_MIN_LENGTH} karakter)`} autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} />
        <PasswordInput name="confirmPassword" label="Ulangi password baru" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} />
      </ActionForm>
    </>
  );
}
