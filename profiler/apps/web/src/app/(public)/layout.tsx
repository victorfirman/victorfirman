export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <div className="card">
        <p className="brand">Profiler</p>
        {children}
      </div>
    </main>
  );
}
