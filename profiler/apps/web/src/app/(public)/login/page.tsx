import Link from "next/link";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/Form";
import { PasswordInput } from "@/components/PasswordInput";
import { getCurrentUser } from "@/lib/auth/session";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { reset } = await searchParams;
  return (
    <>
      <h1>Masuk</h1>
      {reset && <p className="msg ok" role="status">Password sudah diperbarui. Silakan masuk.</p>}
      <ActionForm action={loginAction} submitLabel="Masuk">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <PasswordInput name="password" label="Password" autoComplete="current-password" />
      </ActionForm>
      <p className="muted"><Link href="/lupa-password">Lupa password?</Link></p>
    </>
  );
}
