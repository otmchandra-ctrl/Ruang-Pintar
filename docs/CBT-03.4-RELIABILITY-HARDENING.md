# CBT-03.4 — RELIABILITY HARDENING REPORT
## Ruang Pintar School Digital Operating Platform

| Field | Nilai |
| --- | --- |
| **Fokus Dokumen** | Ketahanan Offline, Sync Barrier, & Eliminasi Timer Drift |
| **Tahap** | STAGE CBT-03.4 |
| **Status** | `READY FOR HUMAN REVIEW` |
| **Prinsip Domain** | Zero Answer Loss Invariant & Server-Authoritative Timer |

---

## 1. Zero Answer Loss & Pre-Submit Sync Barrier (BLOCKER-01)

### 1.1. Konsep Penghalang Sinkronisasi (*Synchronization Barrier*)
Sebelum CBT-03.4, siswa yang mengalami koneksi internet terputus di tengah ujian dapat menekan tombol kumpulkan ujian secara langsung, yang mengakibatkan jawaban di buffer lokal `localStorage` terabaikan karena server hanya menilai data yang ada di database.

Pada CBT-03.4, alur pengumpulan lembar ujian menerapkan **Pre-Submit Synchronization Barrier**:

```text
                     [Klik Tombol "Kumpulkan Ujian"]
                                    │
                                    ▼
                     Apakah pendingSyncMap.size > 0
                        ATAU navigator.onLine === false?
                                    │
                     ┌──────────────┴──────────────┐
                     │ YA                          │ TIDAK
                     ▼                             ▼
       [Aktifkan isSyncingBarrier]        [submitAttemptAction()]
       Eksekusi syncAllPendingAnswers()            │
                     │                             ▼
                     ▼                    [Redirect Finished Page]
           Apakah Semua Sukses?
                     │
       ┌─────────────┴─────────────┐
       │ YA                        │ GAGAL / MASIH OFFLINE
       ▼                           ▼
[Lanjutkan Submit]        [TAHAN & KUNCI SUBMIT!]
                          Tampilkan Pesan Error & Tombol:
                          [Coba Sinkronkan Ulang]
```

### 1.2. State Tracking di Client
- **`pendingSyncMap`:** Map internal yang mencatat `{ nomorUrut: payload }` secara instan saat ada interaksi pengguna.
- **`pendingSyncCount`:** Reactive counter yang ditampilkan di header ujian: badge kuning `X tertunda`.
- **`localStorage Write-Ahead Buffer`:** Persistensi cadangan jika tab browser tidak sengaja tertutup atau listrik padam mendadak.

---

## 2. Server-Authoritative Timer & Anti-Drift (HIGH-RISK-03)

### 2.1. Masalah Throttling Browser
Pada browser seluler (Chrome Android, Safari iOS), ketika tab berpindah atau layar terkunci, browser secara agresif menekan eksekusi JavaScript background timer. Pengurangan lokal berbasis `prev - 1` menyebabkan:
- Siswa mengira masih memiliki sisa waktu 15 menit, padahal waktu server sudah habis.
- Siswa terkejut saat submit ditolak karena timer lokal tidak akurat.

### 2.2. Solusi Absolute Timestamp
1. Setiap detik, sisa waktu dihitung langsung dari:
   $$\text{Sisa Detik} = \max\left(0, \left\lfloor \frac{\text{batas\_waktu\_server} - \text{Date.now()}}{1000} \right\rfloor\right)$$
2. Event listener `document.addEventListener("visibilitychange")` dan `window.addEventListener("focus")`:
   Begitu siswa membuka kembali tab atau menyalakan layar HP, sisa waktu langsung dikalibrasi ulang ke waktu server riil tanpa jeda atau delay akumulatif.
3. Begitu sisa waktu $\le 0$, client memicu auto-submit berotoritas server.
