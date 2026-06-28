```markdown
# Expense Tracker — Editorial Edition

Aplikasi pelacak keuangan pribadi dengan gaya visual **Editorial / Magazine** — tipografi serif tegas, layout grid bergaris, palet hitam-putih dengan aksen merah, dan zero border-radius. Semua data disimpan secara lokal di browser menggunakan **LocalStorage**, dan seluruh interaksi antarmuka dikelola melalui **DOM Manipulation** murni tanpa framework.

---

## 🎨 Gaya Visual Editorial

Desain ini terinspirasi dari tata letak majalah cetak dan koran fashion:

| Aspek | Detail |
|---|---|
| **Heading** | *Playfair Display* — serif klasik, weight 900, uppercase |
| **Body** | *Outfit* — sans-serif bersih untuk keterbacaan |
| **Palet** | Hitam `#0A0A0A`, off-white `#FAFAF8`, merah aksen `#C8102E` |
| **Border-radius** | `2px` di seluruh komponen — tajam, tidak ada kelengkungan |
| **Pembatas** | Garis hitam tebal (`3px`) di header dan section heading |
| **Input** | Border-bottom only — menghilangkan box frame, fokus pada ketikan |
| **Tombol** | Hitam solid, hover membalik menjadi hitam-putih |
| **Hover item** | Subtle background shift, bukan transformasi berlebihan |
| **Selection** | Merah editorial — konsisten dengan aksen utama |
| **Kesan** | Tegas, hierarkis, minim warna, fokus pada tipografi |

### Prinsip Desain

- **Typography-first** — hierarki visual dibangun sepenuhnya dari ukuran, weight, dan style font, bukan dari warna atau dekorasi
- **Rigid grid** — kartu summary digabungkan tanpa jarak, dipisahkan oleh border vertikal, meniru layout kolom koran
- **Constraint sebagai gaya** — menghilangkan border-radius dan shadow menciptakan kesan editorial yang kaku dan disiplin
- **Satu aksen** — hanya merah `#C8102E` yang muncul sebagai warna selain hitam/putih, digunakan secara strategis di expense amount dan detail kecil

---

## 🏗️ Arsitektur DOM

Seluruh struktur antarmuka dibangun sebagai HTML semantik statis, lalu dimanipulasi secara dinamis melalui JavaScript.

### Struktur Utama

```
.tracker-app
├── .tracker-header              (statik — judul, avatar, tanggal)
├── main
│   ├── .tracker-summary         (dinamis — saldo, income, expense)
│   │   ├── .tracker-summary__balance
│   │   └── .tracker-summary__stat ×2
│   ├── .tracker-form-section    (interaktif — input form)
│   │   └── .tracker-form
│   └── .tracker-history         (dinamis — daftar transaksi)
│       ├── .tracker-search
│       └── .tracker-history__grid
│           └── .tracker-transaction-list ×N
│               └── .tracker-transaction-list__container
│                   └── .tracker-transaction-item ×N (dinamis)
└── .tracker-footer              (statik)
```

### Apa yang Statik vs Dinamis

| Elemen | Sifat | Penjelasan |
|---|---|---|
| Header (judul, avatar, tanggal) | **Statik** | Dirender sekali saat halaman dimuat |
| Kartu summary (saldo, income, expense) | **Dinamis** | InnerHTML di-update setiap kali data berubah |
| Form input | **Statik** | HTML tetap, event listener ditambahkan via JS |
| Daftar transaksi | **Dinamis** | Item dibuat/dihapus dari DOM sesuai data |
| Tombol aksi (edit/hapus) | **Dinamis** | Dibuat bersamaan dengan setiap item transaksi |

---

## 📦 LocalStorage — Penyimpanan Data

Semua data transaksi disimpan di `localStorage` browser. Tidak ada server, tidak ada database, tidak ada API call.

### Struktur Data di LocalStorage

**Key:** `tracker_transactions`

**Value:** JSON string dari array berikut:

```json
[
  {
    "id": "tx_1718000000000",
    "title": "Gaji Bulanan",
    "amount": 8500000,
    "type": "income",
    "date": "2025-06-10T08:00:00.000Z",
    "category": "salary"
  },
  {
    "id": "tx_1718010000000",
    "title": "Makan Siang",
    "amount": 45000,
    "type": "expense",
    "date": "2025-06-10T12:30:00.000Z",
    "category": "food"
  }
]
```

### Skema Setiap Transaksi

| Field | Tipe | Deskripsi |
|---|---|---|
| `id` | `string` | ID unik, format `tx_` + timestamp |
| `title` | `string` | Nama/deskripsi transaksi |
| `amount` | `number` | Nominal dalam Rupiah (positif) |
| `type` | `string` | `"income"` atau `"expense"` |
| `date` | `string` | ISO 8601 date string |
| `category` | `string` | Kategori transaksi |

### Operasi LocalStorage yang Digunakan

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   BACA DATA     │     │   SIMPAN DATA    │     │   HAPUS DATA    │
│                 │     │                  │     │                 │
│ localStorage    │     │ localStorage     │     │ localStorage    │
│ .getItem()      │────▶│ .setItem()       │────▶│ .removeItem()   │
│                 │     │                  │     │                 │
│ JSON.parse()    │     │ JSON.stringify()  │     │ (opsional, atau │
│                 │     │                  │     │  setItem([]))   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

### Kapan Operasi Dipanggil

| Operasi | Trigger | Fungsi |
|---|---|---|
| `getItem` → `parse` | Saat halaman dimuat (`DOMContentLoaded`) | Memuat semua transaksi ke memori |
| `setItem` → `stringify` | Setelah tambah, edit, atau hapus transaksi | Sinkronisasi memori → storage |
| `getItem` → cek `null` | Saat pertama kali buka (belum ada data) | Inisialisasi array kosong `[]` |

---

## ⚙️ Alur DOM Manipulation

### 1. Inisialisasi Halaman

```
DOMContentLoaded
  │
  ├─▶ loadTransactions()          ← baca localStorage
  │     └─▶ parse JSON → variabel global: transactions[]
  │
  ├─▶ renderSummary()             ← hitung total, update innerHTML
  │     ├─▶ hitung saldo = Σ income - Σ expense
  │     ├─▶ hitung total income
  │     ├─▶ hitung total expense
  │     └─▶ update teks di .tracker-summary__balance-amount
  │        .tracker-summary__stat-amount--income
  │        .tracker-summary__stat-amount--expense
  │
  ├─▶ renderTransactions()        ← bangun elemen item di DOM
  │     └─▶ untuk setiap transaksi:
  │           └─▶ buat .tracker-transaction-item
  │                 ├─▶ set icon (income/expense)
  │                 ├─▶ set title + date
  │                 ├─▶ set amount + warna
  │                 └─▶ tambah tombol edit & hapus
  │                       └─▶ attach event listener
  │
  └─▶ setupFormListener()         ← pasang listener di form
        └─▶ submit → addTransaction()
```

### 2. Tambah Transaksi

```
Form Submit
  │
  ├─▶ e.preventDefault()
  ├─▶ baca value dari .tracker-form__input
  ├─▶ validasi (title tidak kosong, amount > 0)
  ├─▶ buat objek transaksi baru
  │     └─▶ id: "tx_" + Date.now()
  │
  ├─▶ transactions.push(newTransaction)
  ├─▶ saveTransactions()          ← stringify → localStorage.setItem
  ├─▶ renderSummary()             ← update angka
  ├─▶ renderTransactions()        ← rebuild daftar
  └─▶ form.reset()                ← kosongkan input
```

### 3. Hapus Transaksi

```
Klik tombol Hapus
  │
  ├─▶ baca data-id dari button
  ├─▶ transactions = transactions.filter(t ⇒ t.id !== id)
  ├─▶ saveTransactions()
  ├─▶ renderSummary()
  └─▶ renderTransactions()
```

### 4. Edit Transaksi

```
Klik tombol Edit
  │
  ├─▶ baca data-id dari button
  ├─▶ cari transaksi: transactions.find(t ⇒ t.id === id)
  ├─▶ isi form dengan data transaksi tersebut
  ├─▶ ubah mode form: "tambah" → "edit"
  │     └─▶ ganti teks button submit
  │
  └─▶ pada submit (mode edit):
        ├─▶ update properti objek transaksi
        ├─▶ saveTransactions()
        ├─▶ renderSummary()
        ├─▶ renderTransactions()
        └─▶ kembalikan form ke mode "tambah"
```

### 5. Pencarian

```
Input di .tracker-search__form
  │
  ├─▶ baca keyword dari input
  ├─▶ filter: transactions.filter(t ⇒
  │     t.title.toLowerCase().includes(keyword.toLowerCase()))
  │
  └─▶ renderTransactions(filteredResults)
        └─▶ hanya item yang cocok yang di-render ke DOM
```

---

## 📂 Struktur File Proyek

```
expense-tracker/
├── index.html          ← struktur HTML semantik + class BEM
├── style.css           ← seluruh styling (varian Editorial)
├── app.js              ← logika DOM manipulation + LocalStorage
└── README.md           ← dokumen ini
```

---

## 🔧 Cara Menjalankan

Tidak memerlukan build tool, bundler, atau server khusus.

```bash
# Cukup buka file di browser, atau gunakan live server:
npx serve .
# atau
python -m http.server 8000
```

> **Catatan:** `localStorage` hanya berfungsi melalui HTTP/HTTPS atau `localhost`. Membuka file langsung via `file://` bisa bermasalah di beberapa browser.

---

## 🧪 Debugging LocalStorage

Buka DevTools → tab **Application** → **Local Storage** → pilih domain. Di sana kamu bisa:

- Melihat key `tracker_transactions` dan valuenya secara langsung
- Mengedit atau menghapus data manual untuk testing
- Memastikan `JSON.stringify` menghasilkan format yang benar

Atau via Console:

```javascript
// Lihat semua data
JSON.parse(localStorage.getItem('tracker_transactions'))

// Hapus semua data (reset)
localStorage.removeItem('tracker_transactions')

// Cek apakah storage tersedia
localStorage.length
```

---

## 📐 Konvensi Penamaan (BEM)

Seluruh class mengikuti **Block Element Modifier** dengan namespace `tracker`:

```
tracker                    → Block
tracker__header            → Element
tracker__title             → Element
tracker__balance-amount    → Element
tracker__amount--income    → Modifier
tracker-transaction-item   → Block (nested)
```

Keuntungan konvensi ini:
- Tidak ada konflik nama class
- Spesifisitas CSS tetap rendah (satu class = satu selector)
- Mudah dilacak antara HTML, CSS, dan JS

---

## 🛡️ Batasan

- **Data hanya lokal** — tidak tersinkronisasi antar perangkat atau browser
- **Kapasitas terbatas** — localStorage biasanya ~5-10MB per domain
- **Tidak ada autentikasi** — siapa saja yang mengakses browser yang sama bisa melihat data
- **Tidak ada undo** — penghapusan langsung menghilangkan data dari storage
- **Tidak ada validasi server** — semua validasi dilakukan di sisi klien
```
