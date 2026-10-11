# Google Maps Scraper Kit — Indonesia

Ubah **jenis bisnis + kota** jadi **CSV leads** siap dihubungi: nama, telepon, **link WhatsApp**, email,
website, kategori, alamat, rating, jumlah ulasan. Opsional: Instagram / Facebook / LinkedIn.

- Jalan **100% lokal** (Docker). Tanpa API key, tanpa biaya langganan.
- Bisa dipakai manual (script) atau dioperasikan **Claude Code** (skill + slash command).
- Diadaptasi dari [Mahanaicoach/google-maps-scraper-kit](https://github.com/Mahanaicoach/google-maps-scraper-kit);
  mesin scraping: [gosom/google-maps-scraper](https://github.com/gosom/google-maps-scraper). Lihat [CREDITS.md](CREDITS.md).

## Yang disesuaikan untuk Indonesia

| | |
|---|---|
| **Bahasa hasil** | `lang=id` default (ubah dengan `--lang en`). |
| **Geocoding** | Nama kota dicari hanya di Indonesia (`--country id`) — "Malang"/"Bogor" tidak nyasar ke luar negeri. |
| **Kolom `whatsapp`** | Nomor HP (08xx / +628xx) otomatis jadi `https://wa.me/628…`. Telepon kantor (021…) dikosongkan. Matikan dengan `--no-wa`. |
| **Dedupe batch** | Keyword yang tumpang tindih ("dokter gigi" vs "klinik gigi") tidak menghasilkan baris ganda. |
| **CSV ramah Excel** | UTF-8 + BOM, nama dengan karakter khusus tampil benar. |
| **Contoh** | Keyword & koordinat kota besar Indonesia di [`examples/`](examples/). |
| **Perbaikan bug** | `scrape.sh`: keyword berisi `"` tidak lagi merusak JSON; batas polling > `max_time`. |

## Mulai cepat

Butuh: **Docker Desktop** dan **Python 3**. (Windows: pakai `scrape.py`, atau WSL2 untuk `scrape.sh`.)

```bash
git clone https://github.com/victorfirman/victorfirman.git
cd victorfirman/google-maps-scraper-kit
docker compose up -d                       # jalankan scraper di http://localhost:8080
curl http://localhost:8080/api/v1/jobs     # harus balas [] → siap
```

Scrape:

```bash
# Auto-geocode nama kota
python3 scripts/scrape.py "klinik gigi di Jakarta Selatan" --city "Jakarta Selatan" --depth 5

# Koordinat manual (lihat examples/queries.example.json)
python3 scripts/scrape.py "bengkel mobil di Surabaya" -7.2575 112.7521

# Banyak keyword, satu job
python3 scripts/scrape.py --keywords-file examples/queries.example.txt --city "Jakarta Selatan"

# Plus Instagram / Facebook / LinkedIn
python3 scripts/scrape.py "salon kecantikan di Medan" --city "Medan" --socials
```

Hasil tersimpan di `results-<id>.csv` (buka di Excel / Google Sheets).

### Opsi penting `scrape.py`

| Opsi | Fungsi |
|---|---|
| `--depth N` | Seberapa jauh scroll (≈ jumlah hasil). Mulai dari 5. |
| `--no-email` | Lewati pencarian email (lebih cepat). Default: email **aktif**. |
| `--socials` | Cari IG/FB/LinkedIn dari website bisnis. |
| `--no-wa` | Tanpa kolom WhatsApp. |
| `--lang en` / `--country ""` | Ganti bahasa hasil / geocoding tanpa batas negara. |
| `--full` / `--fields a,b` | Semua 34 kolom / kolom pilihan. |
| `--json` | Output JSON. |

> Excel berbahasa Indonesia memakai `;` sebagai pemisah. Jika semua data masuk satu kolom, buka lewat
> **Data → From Text/CSV**, atau pakai Google Sheets.

## Dengan Claude Code

```bash
cd google-maps-scraper-kit
claude
```

Lalu tulis biasa saja, misalnya: *"scrape klinik gigi di Jakarta Selatan, depth 10, kasih tabel nama,
telepon, WhatsApp"*. Atau pakai slash command:

| Command | Fungsi |
|---|---|
| `/scrape <jenis bisnis> di <kota> [depth]` | Satu query → tabel + CSV |
| `/scrape-batch <file> [--city "Kota"]` | Banyak query, satu job |
| `/scrape-setup` | Jalankan scraper + health check |
| `/scrape-jobs [list \| delete <id>]` | Kelola job |

## Batasan & aturan main

- **Blokir IP**: job besar beruntun (depth tinggi, banyak keyword) tanpa proxy bisa membuat IP dibatasi
  Google sementara (menit–jam). Satu job sekali jalan, mulai `depth 5`, pakai `proxies` untuk volume besar.
- **Google ToS**: scraping Maps melanggar ketentuan Google. Pakai secukupnya, verifikasi data sebelum dipakai.
- **UU PDP (UU No. 27/2022)**: nomor HP/email pemilik usaha perorangan adalah data pribadi. Punya dasar
  pemrosesan yang sah, hormati permintaan berhenti dihubungi, jangan jual datanya.
- **WhatsApp**: jangan blast massal. Selain spam, nomor pengirim bisa diblokir WhatsApp.
- Hasil scrape (`*.csv`) sudah di-`.gitignore` — jangan di-commit.

Setup lengkap & troubleshooting (Inggris): [SETUP.md](SETUP.md).

Lisensi MIT — lihat [LICENSE](LICENSE).
