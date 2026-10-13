import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/login", "/lupa-password", "/reset-password"];

// Pemeriksaan cepat di edge: hanya keberadaan cookie. Validasi sesi sebenarnya
// (ke database) dilakukan di server lewat requireUser().
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isPublic && !req.cookies.has("profiler_session")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!_next/|favicon.ico).*)"] };
