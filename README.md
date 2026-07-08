# Dashboard Performa Ads

Dashboard web untuk menampilkan performa campaign Meta Ads, TikTok Ads, dan
Google Ads ke klien freelance advertising. Data diinput manual oleh admin
(form atau upload Excel/CSV) — tidak ada integrasi live ke API Meta/TikTok/
Google di v1.

Stack: Next.js (App Router) · Supabase (Postgres + Auth + Row Level Security)
· Drizzle ORM · Tailwind CSS.

## Setup awal (sekali saja)

### 1. Buat project Supabase

1. Buat project baru di [supabase.com](https://supabase.com) (gratis untuk skala ini).
2. Buka **Project Settings > API**, salin:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (rahasia, jangan pernah expose ke browser)
3. Buka **Project Settings > Database > Connection string > URI**, pakai
   mode **Transaction pooler** (port 6543) → `DATABASE_URL`.

### 2. Konfigurasi environment

```bash
cp .env.example .env.local
```

Isi keempat variabel di atas ke `.env.local`.

### 3. Install dependency & jalankan migrasi database

```bash
npm install
npm run db:migrate
```

Ini akan membuat tabel `admins`, `clients`, `campaigns`, `metrics` beserta
Row Level Security policy-nya di database Supabase Anda.

### 4. Buat akun admin pertama

Belum ada UI untuk ini (akan ditambahkan di fase berikutnya), jadi buat lewat
script sekali jalan:

```bash
npm run create-admin -- "Nama Anda" admin@email-anda.com "password-yang-aman"
```

### 5. Jalankan development server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — akan diarahkan ke halaman login.

## Struktur proyek

```
src/
  app/
    admin/         # Area khusus admin (role: admin)
    dashboard/      # Area khusus klien (role: client)
    login/          # Halaman login (satu pintu untuk kedua role)
    actions/        # Server actions (login, logout, dst.)
  db/
    schema.ts       # Skema tabel Drizzle + RLS policy
    migrations/      # Migrasi SQL yang digenerate drizzle-kit
  lib/
    auth/role.ts     # Helper baca role dari user metadata
    supabase/        # Client Supabase (browser, server, admin/service-role)
  proxy.ts           # Proteksi route + refresh session (pengganti middleware.ts di Next 16)
scripts/
  create-admin.ts    # Bootstrap akun admin pertama
```

## Perintah database

| Perintah | Kegunaan |
|---|---|
| `npm run db:generate` | Generate file migrasi SQL baru dari perubahan `src/db/schema.ts` |
| `npm run db:migrate` | Terapkan migrasi ke database Supabase |
| `npm run db:studio` | Buka Drizzle Studio untuk lihat/edit data manual |

## Catatan keamanan

Isolasi data antar klien ditegakkan lewat **Postgres Row Level Security**
(lihat kebijakan di `src/db/schema.ts`), bukan hanya di level tampilan —
klien secara teknis tidak bisa query data klien lain meskipun ada bug di
kode aplikasi.
