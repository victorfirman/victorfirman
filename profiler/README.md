# Profiler

Profiling perilaku & kemampuan kerja untuk karyawan internal satu perusahaan.
**Bukan psikotes** — tidak ada psikolog ber-SIPP yang memvalidasi. Hasil untuk
pengembangan, bukan dasar keputusan promosi, mutasi, atau PHK.

## Struktur

```
profiler/
├── apps/web/            Next.js 15 (App Router) + Prisma + PostgreSQL
└── packages/disc-core/  (langkah 3) mesin DISC, dipisah agar bisa dipakai produk lain
```

## Menjalankan lokal

```bash
npm install
cp apps/web/.env.example apps/web/.env      # isi DATABASE_URL
npm run db:migrate -w @profiler/web
npm run create-admin -w @profiler/web -- --email hr@perusahaan.co.id --name "Nama HR"
npm run dev                                 # http://localhost:3100
```

`create-admin` mencetak password sementara acak (atau pakai env `ADMIN_PASSWORD`),
dan memaksa ganti password saat login pertama. Password tidak pernah ditulis di kode.

## Prinsip penyimpanan

- Semua data di **PostgreSQL** sejak commit pertama. Tidak ada `globalThis` sebagai penyimpanan.
- **Sesi** disimpan di tabel `Session` (cookie hanya berisi token; DB menyimpan hash-nya) —
  restart server tidak mengeluarkan pengguna.
- **AuditLog** append-only: UPDATE/DELETE/TRUNCATE ditolak oleh trigger PostgreSQL.
- **Email** dikirim lewat SMTP. Di produksi, tanpa `SMTP_HOST` pengiriman gagal (bukan diam-diam).

## Auth

- scrypt (parameter tersimpan per hash), cookie httpOnly + SameSite=Lax.
- Password minimal 6 karakter; semua field password punya tombol mata.
- Menu **Ganti Password** selalu ada di header.
- 2FA TOTP opsional (menu Keamanan).
- Kunci 15 menit setelah 5 kali gagal login. Ganti/reset password mencabut sesi lain.

## Deploy (server warroom)

```bash
# .env di akar repo: POSTGRES_PASSWORD, APP_URL, SMTP_*, APP_PORT
docker compose up -d --build
```

Container `profiler-app` dan `profiler-db`, join network `npm_default`.
Port default **8131** — cek dulu di server bahwa port itu kosong. Migrasi DB jalan otomatis saat start.
