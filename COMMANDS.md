# Perintah Rutin

Aplikasi dijalankan dengan **Podman Compose**. Semua perintah dijalankan dari root project.

## Start (build terbaru + jalan)

```bash
podman compose up -d --build
```

- `--build` → rebuild image dengan kode terbaru.
- `-d` → berjalan di background (detached).
- Aplikasi tersedia di http://localhost:3000

## Lihat log

```bash
podman compose logs -f
```

- `-f` → mengikuti log secara real-time (keluar dengan `Ctrl+C`).

## Stop

```bash
podman compose down
```

- Menghentikan & menghapus container, tapi **data di volume tetap tersimpan**.

## Data / volume

- Volume bernama `simulation-saa_saa-data` menyimpan database SQLite
  (`/app/data/saa-practice.db`).
- `down` tidak menghapus data; `up` berikutnya tetap memakai data lama.

## Reset data (bank soal bersih dari nol)

```bash
podman compose down
podman volume rm simulation-saa_saa-data
podman compose up -d --build
```

> Hati-hati: ini menghapus semua soal di bank. Setelah itu isi ulang via AI Generator.

## Isi ulang bank dari AI (prod)

1. Buka http://localhost:3000/ai-generator
2. Pilih model & konfigurasi → Generate Questions.
3. Soal valid tersimpan otomatis ke Question Bank.
