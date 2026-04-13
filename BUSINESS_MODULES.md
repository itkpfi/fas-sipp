# 📚 Penjelasan Modul-Modul Bisnis SIPP

Dokumen ini menjelaskan setiap modul utama dalam sistem SIPP dan alur bisnisnya.

---

## 🏦 OVERVIEW: Alur Pembiayaan di SIPP

```
┌───────────────────────────────────────────────────────────────┐
│                    EMPLOYEE FINANCING FLOW                    │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Karyawan Apply        2. Review Dokumen                  │
│     [DAPEM/PINKAR]           [NOMINATIF]                     │
│            ↓                      ↓                           │
│                                                               │
│  3. Approve/Reject        4. Pencairan (Dropping)           │
│     [By Manager]             [Cair Dana]                     │
│            ↓                      ↓                           │
│                                                               │
│  5. Pembayaran Cicilan     6. Laporan Keuangan              │
│     [PELUNASAN]               [LAPKEU]                      │
│            ↓                      ↓                           │
│                                                               │
│  7. Selesai (SETTLED)     Audit Trail                        │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 📋 MODUL 1: DAPEM (Pembiayaan Reguler)

**Fungsi:** Mengelola aplikasi pembiayaan karyawan regular

**Flow Bisnis:**

```
Karyawan Submit Aplikasi
    ↓
[Status: DRAFT] → Verifikasi Dokumen
    ↓
[Status: SUBMITTED] → Cek Kelengkapan
    ↓
Manager Approve/Reject
    ↓
[Status: APPROVED/REJECTED]
    ↓ (Jika APPROVED)
Pencairan Dana (Dropping)
    ↓
[Status: DISBURSED]
    ↓
Pembayaran Cicilan
    ↓
[Status: SETTLED] (Lunas)
```

**Key Database Models:**

```prisma
model Dapem {
  nomor           String       // Nomor aplikasi (DAP-2024-001)
  debitur         Debitur      // Link ke peminjam
  nominal         Int          // Jumlah pembiayaan
  margin          Float        // Biaya margin
  admin_fee       Float        // Biaya admin
  status          EDapemStatus // Status saat ini
  createdAt       DateTime     // Tanggal aplikasi
  angsuran        Angsuran[]   // Cicilan pembayaran
}

enum EDapemStatus {
  DRAFT           // Draf (belum submit)
  SUBMITTED       // Sudah diajukan
  APPROVED        // Disetujui
  REJECTED        // Ditolak
  DISBURSED       // Sudah dicairkan
  SETTLED         // Lunas
}
```

**Halaman:**

- `/dapem` - Daftar semua pembiayaan
- `/dapem/[id]` - Detail pembiayaan
- `/dapem/new` - Form buat baru

**API Endpoint:**

- `GET /api/dapem` - List data
- `POST /api/dapem` - Create baru
- `GET /api/dapem/[id]` - Detail
- `PUT /api/dapem/[id]` - Update
- `DELETE /api/dapem/[id]` - Hapus

---

## 💼 MODUL 2: PINKAR (Pinjaman Karyawan)

**Fungsi:** Mengelola pinjaman khusus karyawan (employee loans)

**Key Differences dari DAPEM:**

- Jenis pembiayaan khusus karyawan
- Sistem cicilan bisa lebih fleksibel
- Lebih banyak integrasi dengan HR data

**Key Database Models:**

```prisma
model Pinjaman {
  id              String
  nomor           String      // Nomor pinjaman
  karyawan        User        // Karyawan yang pinjam
  nominal         Int         // Jumlah
  status          EDapemStatus
  angsuranPinkar  AngsuranPinkar[] // Cicilan spesifik pinkar
}

model AngsuranPinkar {
  id              String
  pinjaman        Pinjaman    @relation(fields: [pinjamanId])
  pinjamanId      String
  noBulan         Int         // Bulan ke-X
  nominalCicil    Int         // Jumlah cicilan
  tanggalJatuhTempo DateTime   // Jatuh tempo
  statusBayar     EAngsuranStatus
}
```

**Halaman:**

- `/pinkar` - Daftar pinjaman karyawan
- `/pinkar/[id]` - Detail pinjaman

---

## 🔍 MODUL 3: NOMINATIF (Verifikasi Dokumen)

**Fungsi:** Tracking dokumen dan status verifikasi pembiayaan

**Purpose:**

```
NOMINATIF = "Nama Demi Nama"
Artinya: Tracking pembiayaan atas nama siapa saja
```

**Status di Nominatif:**

```
PENDING → VERIFIED → REJECTED
  ↓
Dokumen diterima  Dokumen lengkap  Dokumen tidak lengkap
```

**Dokumen yang di-track:**

- KTP (Kartu Identitas)
- Kartu Keluarga
- Slip Gaji
- SK Karyawan
- Jaminan/Collateral docs
- Akad (Contract)

**Key Database Models:**

```prisma
model Berkas {
  id              String
  dapem           Dapem       // Link ke pembiayaan
  debitur         Debitur
  tipeDoc         String      // Tipe dokumen
  fileUrl         String      // URL file di storage
  status          EDocStatus  // SUBMITTED, VERIFIED, REJECTED
}

enum EDocStatus {
  SUBMITTED       // Dokumen sudah upload
  VERIFIED        // Sudah diverifikasi
  REJECTED        // Ditolak
}
```

**Halaman:**

- `/nominatif` - Daftar dokumen
- `/nominatif/[id]` - Detail dokumen

---

## 💸 MODUL 4: PENCAIRAN (Fund Disbursement)

**Fungsi:** Proses pencairan dana dari pembiayaan ke rekening peminjam

**Flow:**

```
APPROVED Pembiayaan
    ↓
Buat Pencairan (Dropping)
    ↓
Check Kelengkapan
    ↓
Submit untuk Pencairan
    ↓
[DISBURSED] Dana masuk rekening peminjam
```

**Key Database Models:**

```prisma
model Dropping {
  id              String
  dapem           Dapem       // Link pembiayaan
  noArekening     String      // Rekening tujuan
  nominal         Int         // Jumlah yang dicair
  tanggalCair     DateTime    // Tanggal pencairan
  status          EDropStatus
}

enum EDropStatus {
  PENDING
  APPROVED
  DISBURSED
  REJECTED
}
```

**Halaman:**

- `/pencairan` - Daftar pencairan
- `/pencairan/[id]` - Detail pencairan

---

## 📝 MODUL 5: PELUNASAN (Settlement/Payment)

**Fungsi:** Mencatat pembayaran cicilan dan tracking pembayaran

**Flow Pembayaran:**

```
Cicilan Jatuh Tempo
    ↓
Reminder Pembayaran
    ↓
Karyawan Bayar
    ↓
[Record Payment]
    ↓
Update Status Cicilan
    ↓
Jika semua lunas → Status SETTLED
```

**Key Database Models:**

```prisma
model Angsuran {
  id              String
  dapem           Dapem       // Link pembiayaan
  noBulan         Int         // Bulan cicilan ke?
  nominalCicil    Int         // Jumlah cicilan
  tanggalJatuhTempo DateTime   // Jatuh tempo
  statusBayar     EAngsuranStatus
}

enum EAngsuranStatus {
  BELUM_JTP       // Belum jatuh tempo
  BELUM_BAYAR     // Sudah JTP, belum bayar
  LUNAS           // Sudah bayar
  DENDA           // Ada denda
}

model Pelunasan {
  id              String
  angsuran        Angsuran    // Link cicilan
  nominal         Int         // Nominal bayar
  tanggalBayar    DateTime    // Tanggal bayar
  buktiTransfer   String      // URL bukti
}
```

**Halaman:**

- `/pelunasan` - Daftar pembayaran
- `/pelunasan/[id]` - Detail pembayaran

---

## 📊 MODUL 6: LAPKEU (Laporan Keuangan)

**Fungsi:** Generate laporan keuangan seluruh pembiayaan

**Sub-Modul:**

### 6.1 COA (Chart of Accounts)

```
Mengelola akun akuntansi:
- Pendapatan (Revenue)
- Biaya (Expense)
- Aset (Asset)
- Kewajiban (Liability)
```

**Model:**

```prisma
model CategoryOfAccount {
  id          String
  code        String      // 1000, 1100, dll
  nama        String      // Kas, Piutang, dll
  tipe        String      // ASSET, LIABILITY, REVENUE, EXPENSE
  parent      CategoryOfAccount // Bisa nested
}
```

### 6.2 Jurnal (Journal Entry)

```
Mencatat setiap transaksi keuangan:
- Pencairan: Debit Kas, Kredit Piutang
- Pelunasan: Debit Kas, Kredit Pendapatan
```

**Model:**

```prisma
model JournalEntry {
  id          String
  tanggal     DateTime
  referensi   String      // Link ke dapem, pelunasan, dll
  status      EJournalStatus
  detail      JournalDetail[] // Detail debit-kredit
}

model JournalDetail {
  id          String
  journal     JournalEntry
  coa         CategoryOfAccount
  debit       Float       // Jumlah debit (atau 0)
  kredit      Float       // Jumlah kredit (atau 0)
}
```

### 6.3 Neraca (Balance Sheet)

```
Laporan posisi keuangan per tanggal tertentu:
ASET = LIABILITAS + MODAL
```

### 6.4 Rugi-Laba (Income Statement)

```
Laporan laba/rugi dalam periode tertentu:
REVENUE - EXPENSE = NET INCOME
```

**Halaman:**

- `/lapkeu/coa` - Master COA
- `/lapkeu/jurnal` - Daftar jurnal
- `/lapkeu/neraca` - Report neraca
- `/lapkeu/rugilaba` - Report P&L

---

## 🏢 MODUL 7: MASTER (Configuration)

**Fungsi:** Konfigurasi master data sistem

**Sub-Modul:**

### 7.1 User Management

```
Model: User
- Username
- Email
- Role
- Area assignment
- Active/Inactive
```

### 7.2 Role & Permission

```
Model: Role
- Nama role (Admin, Manager, Staff)
- Permissions list
```

### 7.3 Area (Wilayah)

```
Model: Area
- Nama area
- Manager area
- Active status
```

### 7.4 Cabang (Branches)

```
Model: Cabang
- Nama cabang
- Area
- Manager
```

### 7.5 Sumdan (Financial Institution)

```
Model: Sumdan
- Nama institusi
- Kode institusi
- Contact info
- Status
```

**Multi-Tenant Architecture:**

```
Setiap data di-link dengan Sumdan_ID
Sehingga data antar Sumdan terisolasi

Contoh:
- Sumdan A hanya lihat data mereka
- Sumdan B hanya lihat data mereka
```

**Halaman:**

- `/master/user` - User list
- `/master/role` - Role config
- `/master/area` - Area config
- `/master/sumdan` - Institusi config

---

## 🔐 MODUL 8: AUTHENTICATION & AUTHORIZATION

**How It Works:**

```
USER LOGIN
    ↓
input username & password
    ↓
POST /api/auth/login
    ↓
Check di database
    ↓
Buat JWT Token
    ↓
Return token ke frontend
    ↓
Token disimpan di session/cookie
    ↓
Setiap API call, token dikirim di header
    ↓
Backend verify token
    ↓
Check permission
    ↓
Lanjut atau reject
```

**Key Files:**

```
libs/Auth.ts          - Login, verify token
libs/Authorization.ts - Check permission
libs/Permission.ts    - List semua permission
```

**Permission Examples:**

```
VIEW_DAPEM       - Bisa lihat dapem
CREATE_DAPEM     - Bisa buat dapem baru
EDIT_DAPEM       - Bisa edit dapem
DELETE_DAPEM     - Bisa hapus dapem
APPROVE_DAPEM    - Bisa approve dapem
```

---

## 📌 MODUL 9: MONITORING & DASHBOARD

**Fungsi:** Overview dan monitoring semua pembiayaan

**Metrics yang di-track:**

- Total pembiayaan (nominal & jumlah)
- Outstanding (belum lunas)
- Aging (overdue analysis)
- Recovery rate
- Delinquency rate

**Key Pages:**

- `/dashboard` - Main dashboard
- `/monitoring` - Detailed monitoring
- `/dashboardbis` - Alternative dashboard view

---

## 🔗 DATA RELATIONSHIP MAP

```
┌─────────────┐
│    USER     │  (Karyawan / Kreditur)
└──────┬──────┘
       │
       │1:N
       ↓
┌─────────────────┐      ┌────────────────┐
│    DEBITUR      │◄─────┤JENISPEMBIAYAAN │
│  (Peminjam)     │      │   (Type)       │
└────────┬────────┘      └────────────────┘
         │                        △
         │                        │
    1:N  │                    M:1 │
         │                        │
         ↓                        │
  ┌─────────────┐           ┌─────────────────┐
  │    DAPEM    │───────────│PRODUKPEMBIAYAAN │
  │(Pembiayaan) │           │   (Product)     │
  └──────┬──────┘           └─────────────────┘
         │
    1:N  │
         ├──────→ BERKAS (Documents)
         ├──────→ DROPPING (Disbursement)
         ├──────→ ANGSURAN (Installments)
         ├──────→ PELUNASAN (Payments)
         └──────→ JAMINAN (Collateral)
```

---

## 🎯 Workflow: Dari Awal hingga Akhir

**Skenario: Karyawan buat pembiayaan 10 juta**

```
STEP 1: DRAFT
├─ Karyawan login
├─ Buka form pembiayaan
├─ Isi data
└─ Save sebagai DRAFT

STEP 2: SUBMIT
├─ Upload dokumen (KTP, slip, SK)
├─ Submit (status → SUBMITTED)
└─ Wait verifikasi

STEP 3: NOMINTIF (Verify)
├─ Admin cek dokumen
├─ Rekam di NOMINATIF
└─ Verify (status → doc VERIFIED)

STEP 4: APPROVAL
├─ Manager review
├─ Check salary (nominal vs salary)
├─ Approve (status → APPROVED)
└─ Hitung cicilan monthly

STEP 5: PENCAIRAN (Disbursement)
├─ Create DROPPING record
├─ Input rekening tujuan
├─ Process pencairan
└─ Status → DISBURSED (record di DROPPING)

STEP 6: PEMBAYARAN (12 bulan)
┌─ MONTH 1: Generate cicilan 10jt / 12 = ~833rb
├─ Karyawan bayar → Record di PELUNASAN
├─ Update ANGSURAN status → LUNAS
│
├─ MONTH 2-11: Repeat
│
└─ MONTH 12:
   ├─ Last payment
   ├─ Semua ANGSURAN → LUNAS
   └─ DAPEM status → SETTLED

STEP 7: LAPORAN
├─ Jurnal otomatis ke-record
├─ COA terupdate
├─ Neraca & P&L generated
└─ Report tergenerus
```

---

## 💡 Key Takeaways

1. **Data Flow**: User → DB → API → Frontend
2. **Status Tracking**: Setiap record punya history status
3. **Multi-Tenant**: Semua data di-filter by Sumdan
4. **Audit Trail**: Semua transaksi tercatat di Jurnal
5. **Permission**: Setiap action check authorization
6. **Workflow**: Linear flow dari Draft → Settled

---

**Happy Learning! 🚀**
