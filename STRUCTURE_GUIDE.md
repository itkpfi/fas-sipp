# 📚 Panduan Memahami Struktur Code - SIPP System

**Project**: SIPP (Sistem Informasi Pembiayaan Pegawai) - Sistem Manajemen Pembiayaan Karyawan

---

## 🏗️ Arsitektur Keseluruhan

```
┌─────────────────────────────────────────────────────────┐
│         NEXT.JS FRONTEND (React 19 + TypeScript)         │
│  ├─ Pages & Dashboard (app/)                            │
│  └─ Components & UI (components/)                       │
├─────────────────────────────────────────────────────────┤
│         API ROUTES (app/api/)                           │
│  ├─ Authentication & Authorization                      │
│  ├─ Business Logic Routes (dapem, pinjaman, dll)        │
│  └─ Database Operations                                 │
├─────────────────────────────────────────────────────────┤
│         LIBRARIES & UTILITIES (libs/)                   │
│  ├─ Auth.ts - Authentication logic                      │
│  ├─ Authorization.ts - Role & Permission checks         │
│  ├─ Prisma.ts - Database client                         │
│  └─ Validation.ts - Input validation                    │
├─────────────────────────────────────────────────────────┤
│         DATABASE (MySQL + Prisma ORM)                   │
│  ├─ prisma/schema.prisma - Model definitions            │
│  ├─ prisma/migrations/ - Version history                │
│  └─ Relational data structure                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Struktur Folder & Fungsinya

### 1. **`/app` - Halaman & Layout (Frontend)**

Menggunakan **Next.js App Router** (file-based routing):

```
app/
├── layout.tsx         ← Root layout (header, navbar global)
├── page.tsx           ← Halaman utama (/)
├── globals.css        ← CSS global
└── (auth)/            ← Folder khusus authenticated users
    ├── layout.tsx     ← Layout untuk semua halaman auth
    ├── dashboard/     ← Halaman Dashboard (/dashboard)
    ├── dapem/         ← Aplikasi Pembiayaan (/dapem)
    ├── debitur/       ← Data Peminjam (/debitur)
    ├── lapkeu/        ← Laporan Keuangan (/lapkeu)
    │   ├── coa/       ← Chart of Accounts
    │   ├── jurnal/    ← Jurnal Akuntansi
    │   ├── neraca/    ← Neraca/Balance Sheet
    │   └── rugilaba/  ← Laporan Rugi-Laba
    ├── pelunasan/     ← Pembayaran Angsuran (/pelunasan)
    ├── pencairan/     ← Pencairan Dana (/pencairan)
    ├── tagihan/       ← Manajemen Tagihan (/tagihan)
    ├── master/        ← Menu Konfigurasi (area, user, dll)
    └── ... (modul lainnya)
```

**Cara Kerja:**

- Setiap folder = satu URL route
- `page.tsx` = halaman yang ditampilkan
- `layout.tsx` = template/wrapper untuk halaman di folder tersebut
- `[id]` = dynamic route (contoh: `/debitur/[id]` untuk detail debitur)

---

### 2. **`/app/api` - Backend Routes (REST API)**

```
app/api/
├── route.ts              ← API root
├── auth/                 ← Login, logout, session management
├── dapem/                ← Pembiayaan (CRUD)
├── debitur/              ← Data Peminjam
├── pinjaman/             ← Pinjaman Karyawan
├── pencairan/            ← Pencairan Dana
├── pelunasan/            ← Pelunasan/Pembayaran
├── journal/              ← Jurnal Akuntansi
├── tagihan/              ← Tagihan
├── user/                 ← Manajemen User
├── roles/                ← Manajemen Role & Permission
└── ... (modul lainnya)
```

**Struktur File API Tipikal:**

```
api/dapem/
├── route.ts              ← GET (list), POST (create)
├── [id]
│   └── route.ts          ← GET (detail), PUT (update), DELETE
└── (mungkin ada sub-route lain)
```

**Cara Kerja API:**

- `GET /api/dapem` → ambil daftar pembiayaan
- `POST /api/dapem` → buat pembiayaan baru
- `GET /api/dapem/123` → ambil detail pembiayaan ID 123
- `PUT /api/dapem/123` → update pe mbiayaan
- `DELETE /api/dapem/123` → hapus pembiayaan

---

### 3. **`/components` - Reusable UI Components**

```
components/
├── ILayout.tsx          ← Layout wrapper utama
├── IMenu.tsx            ← Navigation menu
├── UserContext.tsx      ← Global user context (Redux alternative)
├── utils/               ← Utility components
│   ├── FormUtils.tsx    ← Komponen form reusable
│   ├── ChartUtils.tsx   ← Komponen chart
│   ├── CompUtils.tsx    ← Komponen common
│   └── LayoutUtils.tsx  ← Komponen layout
└── pdfutils/            ← Generasi PDF untuk laporan
    ├── akad/            ← PDF Akad (Kontrak)
    ├── lapkeu/          ← PDF Laporan Keuangan
    └── ... (pdf lainnya)
```

**Penggunaan:**

```typescript
// Contoh di halaman
import { FormUtils } from '@/components/utils/FormUtils';
import ILayout from '@/components/ILayout';

export default function MyPage() {
  return (
    <ILayout>
      <FormUtils.InputField label="Nama" ... />
    </ILayout>
  );
}
```

---

### 4. **`/libs` - Utility & Business Logic**

Berisi fungsi-fungsi yang digunakan di banyak tempat:

```
libs/
├── Auth.ts          ← Login, verify token, session management
├── Authorization.ts ← Cek role & permission (canAccess?)
├── Prisma.ts        ← Database client config
├── Validation.ts    ← Validasi input (email, number, dll)
├── IInterfaces.ts   ← TypeScript interfaces & types
├── Permission.ts    ← Daftar permission list
├── Azure.ts         ← Azure Storage integration
└── ... (utility lainnya)
```

**Contoh Penggunaan:**

```typescript
// Di API route
import { checkAuth } from "@/libs/Auth";
import { canAccess } from "@/libs/Authorization";

export async function GET(req) {
  const user = await checkAuth(req);
  if (!canAccess(user, "VIEW_DAPEM")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  // Logic untuk ambil data...
}
```

---

### 5. **`/prisma` - Database Schema & Migrations**

```
prisma/
├── schema.prisma          ← Definisi model database (PENTING!)
├── seed.ts                ← Script untuk populate data awal
└── migrations/            ← History perubahan database
    ├── 20260205192007_initial/
    ├── 20260207204236_userpkwt/
    └── ... (perubahan lainnya)
```

**File Penting: `schema.prisma`**

```prisma
// Contoh:
model Dapem {
  id          String   @id @default(cuid())
  nomor       String   @unique
  debitur     Debitur  @relation(fields: [debiturId], references: [id])
  debiturId   String
  nominal     Int
  status      EDapemStatus
  createdAt   DateTime @default(now())

  @@index([debiturId])
}

model Debitur {
  id      String    @id @default(cuid())
  nama    String
  nik     String    @unique
  dapem   Dapem[]   // Relasi 1 Debitur bisa punya banyak Dapem
}

enum EDapemStatus {
  DRAFT
  SUBMITTED
  APPROVED
  DISBURSED
}
```

---

### 6. **`/public` - Static Assets**

```
public/
└── images/          ← Logo, icon, gambar
```

---

### 7. **`/types` - TypeScript Definitions**

```
types/
└── html2pdf-js.d.ts ← Type definition untuk library
```

---

## 🔄 Alur Data / Flow Aplikasi

### **Contoh Alur: Membuat & Melihat Pembiayaan (Dapem)**

```
1. USER BUKA HALAMAN
   ↓
   /app/(auth)/dapem/page.tsx
   ├─ Komponen halaman daftar
   ├─ Render UI (tabel, form, button)
   └─ useEffect → call API

2. API CALL (Frontend)
   ↓
   fetch('/api/dapem?page=1&search=...')
   └─ Send ke backend

3. BACKEND PROCESS
   ↓
   /app/api/dapem/route.ts
   ├─ GET request handler
   ├─ checkAuth() → Cek user valid?
   ├─ canAccess(user, 'VIEW_DAPEM') → Cek permission?
   ├─ prisma.dapem.findMany() → Query database
   ├─ Return JSON response
   └─ Response dikirim ke frontend

4. FRONTEND TERIMA RESPONSE
   ↓
   ├─ Update state dengan data baru
   └─ Render ulang UI dengan data terbaru
```

---

## 📖 Cara Baca & Pahami Kode

### **Step 1: Mulai dari Halaman (UI)**

```typescript
// File: app/(auth)/dapem/page.tsx
export default function DapemPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // Fetch data dari API
    fetch('/api/dapem')
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  return (
    <ILayout>
      <h1>Daftar Pembiayaan</h1>
      {/* Render data di sini */}
    </ILayout>
  );
}
```

**Pertanyaan yang harus Anda tanya:**

- ✅ Halaman apa ini?
- ✅ Data apa yang ditampilkan?
- ✅ API endpoint mana yang dipanggil?

---

### **Step 2: Ikuti API Endpoint**

```typescript
// File: app/api/dapem/route.ts
export async function GET(request) {
  // 1. Cek authentication
  const user = await checkAuth(request);

  // 2. Cek authorization
  if (!canAccess(user, "VIEW_DAPEM")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Ambil parameter query (search, filter, page)
  const url = new URL(request.url);
  const search = url.searchParams.get("search");

  // 4. Query database
  const data = await prisma.dapem.findMany({
    where: {
      nomor: { contains: search },
      sumdan: { id: user.sumdan_id }, // Multi-tenant
    },
    include: { debitur: true },
    take: 10,
    skip: 0,
  });

  // 5. Return response
  return Response.json(data);
}
```

**Pertanyaan yang harus Anda tanya:**

- ✅ Siapa yang bisa akses endpoint ini? (Auth check)
- ✅ Role apa yang dibutuhkan? (Permission check)
- ✅ Apa field yang difilter?
- ✅ Model apa yang di-query dari database?
- ✅ Relasi apa yang di-include?

---

### **Step 3: Pahami Database Model**

```prisma
// File: prisma/schema.prisma
model Dapem {
  id              String @id @default(cuid())
  nomor           String @unique
  debitur         Debitur @relation(fields: [debiturId], references: [id])
  debiturId       String
  nominal         Int
  jenisPembiayaan JenisPembiayaan @relation(fields: [jenisPembiayaanId], references: [id])
  jenisPembiayaanId String
  margin          Float
  admin_fee       Float
  status          EDapemStatus
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([debiturId])
  @@index([jenisPembiayaanId])
}

enum EDapemStatus {
  DRAFT           // Draft
  SUBMITTED       // Sudah diajukan
  APPROVED        // Disetujui
  REJECTED        // Ditolak
  DISBURSED       // Sudah dicairkan
  SETTLED         // Selesai lunas
}
```

**Yang perlu dipahami:**

- ✅ Field apa saja di model ini?
- ✅ Relasi apa dengan model lain?
- ✅ Enum status apa saja?
- ✅ Constraint apa? (unique, index)

---

### **Step 4: Pahami Bisnis Logic**

Contoh: **Alur Pembiayaan**

```
1. Draft
   ↓ (Peminjam isi form & submit)
   ↓
2. Submitted
   ↓ (Admin verifikasi dokumen)
   ↓
3. Approved (atau Rejected)
   ↓ (Jika disetujui, cair dana)
   ↓
4. Disbursed
   ↓ (Peminjam bayar cicilan)
   ↓
5. Settled (Lunas)
```

---

## 💡 Tips Membaca Kode

### **1. Gunakan TypeScript untuk Pahami Struktur**

```typescript
// TypeScript akan memberitahu field yang tersedia
const dapem: Dapem = {
  id: "123",
  nomor: "DAP-2024-001",
  nominal: 10000000,
  status: "APPROVED", // TypeScript akan error jika salah
};
```

### **2. Ikuti Import untuk Mengerti Dependency**

```typescript
// Dari file ini:
import { checkAuth } from "@/libs/Auth";
import { canAccess } from "@/libs/Authorization";
import prisma from "@/libs/Prisma";

// Anda bisa jump ke:
// - libs/Auth.ts
// - libs/Authorization.ts
// - libs/Prisma.ts
```

### **3. Cari Menggunakan Nama Model**

Contoh: Ingin paham model `Dapem`?

```bash
# Cari di schema.prisma
model Dapem { ... }

# Cari usage di app/api
grep -r "prisma.dapem" app/api/

# Cari import di components
grep -r "Dapem" components/
```

### **4. Perhatikan Pattern: Folder Matching**

```
API Route:  /app/api/dapem/route.ts
Frontend:   /app/(auth)/dapem/page.tsx

Semua operasi terkait DAPEM ada di folder dapem/
```

### **5. Baca Error Message**

```typescript
// Jika error:
// "Cannot read property 'id' of undefined"
// Berarti: relasi (include) tidak ada

// Solusi:
include: {
  debitur: true;
} // Tambahkan include di findMany()
```

---

## 📋 Checklist Memahami Satu Fitur

Ketika Anda ingin memahami fitur tertentu (misal: "Pencairan Dana"), ikuti checklist ini:

- [ ] **Cari Halaman**: `/app/(auth)/[fitur]/page.tsx`
- [ ] **Catat URL & Layout**: Halaman mana yang dibuka? Component apa yang dirender?
- [ ] **Cari API**: `/app/api/[fitur]/route.ts`
- [ ] **Pahami Query**: Parameter apa yang dikirim frontend?
- [ ] **Pahami Response**: Data apa yang dikembalikan API?
- [ ] **Cari Database Model**: `prisma/schema.prisma` - cari model yang relevan
- [ ] **Pahami Relasi**: Model ini relasi dengan model lain apa?
- [ ] **Cek Enum/Status**: Status atau enum apa yang digunakan?
- [ ] **Cek Permission**: Role apa yang boleh akses? (Authorization.ts)
- [ ] **Cek Validation**: Input apa yang di-validate? (Validation.ts)

---

## 🎯 Rekomendasi Urutan Belajar

1. **Pahami Database Dulu**
   - Buka `prisma/schema.prisma`
   - Anda lihat model apa saja
   - Anda pahami relasi antar model

2. **Pilih 1 Fitur Sederhana**
   - Contoh: View daftar debitur
   - Ikuti: Halaman → API → Database

3. **Pahami Auth/Permission**
   - Buka `libs/Auth.ts` dan `libs/Authorization.ts`
   - Pahami bagaimana user di-authenticate
   - Pahami bagaimana permission di-check

4. **Explore Satu Feature Kompleks**
   - Contoh: Pencairan Dana (Dropping)
   - Lihat bagaimana status berubah
   - Lihat bagaimana calculation terjadi

5. **Pahami Utility & Helper**
   - `components/utils/` - UI components
   - `libs/Validation.ts` - Validasi
   - `components/pdfutils/` - Generate PDF

---

## 🚀 Quick Start: Membaca Code

**Jika Anda ingin cepat memahami flow:**

```bash
1. Buka file index:
   - README.md (dokumentasi project)
   - SECURITY_ACTION_PLAN.md (untuk security context)

2. Buka struktur database:
   - prisma/schema.prisma

3. Buka halaman utama:
   - app/(auth)/dashboard/page.tsx

4. Buka satu API sederhana:
   - app/api/debitur/route.ts

5. Ikuti flow: UI → API → Database
```

---

## 📞 Need Help?

- **TypeScript Error?** → Lihat `libs/IInterfaces.ts` untuk type definitions
- **Database Error?** → Lihat `prisma/schema.prisma` untuk model
- **Permission Denied?** → Lihat `libs/Authorization.ts` dan `libs/Permission.ts`
- **API Error?** → Lihat `app/api/[feature]/route.ts` untuk detail

---

**Happy Coding! 🎉**
