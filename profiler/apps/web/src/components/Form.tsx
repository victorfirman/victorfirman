"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/app/actions/auth";

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="primary" disabled={pending} aria-busy={pending}>
      {pending ? "Memproses…" : children}
    </button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) return <p className="msg error" role="alert">{state.error}</p>;
  if (state.ok) return <p className="msg ok" role="status">{state.ok}</p>;
  return null;
}

/** Form yang memanggil server action dan menampilkan pesan hasilnya. */
export function ActionForm({
  action,
  children,
  submitLabel,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children: React.ReactNode;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="form">
      <FormMessage state={state} />
      {children}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
