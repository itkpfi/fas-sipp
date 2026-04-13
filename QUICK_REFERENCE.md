# 🔍 Quick Reference - Pattern Umum di SIPP

Dokumen ini menjelaskan pola-pola kode yang akan sering Anda lihat di project ini.

---

## 📌 PATTERN 1: Halaman dengan Data Fetching

**File: `app/(auth)/[feature]/page.tsx`**

```typescript
'use client'; // Client component (untuk useEffect, useState)

import { useEffect, useState } from 'react';
import ILayout from '@/components/ILayout';

export default function FeaturePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/feature?page=1&search=');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Dijalankan sekali saat component mount

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ILayout>
      <h1>Judul Halaman</h1>
      <table>
        <tbody>
          {data.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ILayout>
  );
}
```

---

## 📌 PATTERN 2: API Route dengan Authentication

**File: `app/api/[feature]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/libs/Auth";
import { canAccess } from "@/libs/Authorization";
import prisma from "@/libs/Prisma";

// GET: Ambil data
export async function GET(request: NextRequest) {
  try {
    // 1. Cek authentication
    const user = await checkAuth(request);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Cek authorization (permission)
    if (!canAccess(user, "VIEW_FEATURE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Ambil query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");

    // 4. Query database
    const data = await prisma.feature.findMany({
      where: {
        name: { contains: search }, // Filter query
        sumdan: { id: user.sumdan_id }, // Multi-tenant
      },
      include: { relatedModel: true },
      skip: (page - 1) * 10,
      take: 10,
    });

    // 5. Return response
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error in GET /api/feature:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST: Buat data baru
export async function POST(request: NextRequest) {
  try {
    const user = await checkAuth(request);
    if (!canAccess(user, "CREATE_FEATURE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Ambil body
    const body = await request.json();

    // Validasi input
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Create di database
    const newItem = await prisma.feature.create({
      data: {
        name: body.name,
        sumdan: { connect: { id: user.sumdan_id } },
      },
    });

    return NextResponse.json({ success: true, data: newItem }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 📌 PATTERN 3: API Route dengan Update/Delete

**File: `app/api/[feature]/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAuth } from "@/libs/Auth";
import { canAccess } from "@/libs/Authorization";
import prisma from "@/libs/Prisma";

// GET: Detail satu item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await checkAuth(request);
    if (!canAccess(user, "VIEW_FEATURE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const item = await prisma.feature.findUnique({
      where: { id: params.id },
      include: { relatedModel: true },
    });

    if (!item) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await checkAuth(request);
    if (!canAccess(user, "EDIT_FEATURE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const updated = await prisma.feature.update({
      where: { id: params.id },
      data: {
        name: body.name,
        status: body.status,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Hapus item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await checkAuth(request);
    if (!canAccess(user, "DELETE_FEATURE")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.feature.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 📌 PATTERN 4: Database Model dengan Relasi

**File: `prisma/schema.prisma`**

```prisma
// Model utama
model Dapem {
  // Primary key
  id              String @id @default(cuid())

  // Fields biasa
  nomor           String @unique
  nominal         Int
  margin          Float
  status          EDapemStatus @default(DRAFT)

  // Timestamp
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Foreign key - Relasi Many-to-One
  debitur         Debitur @relation("DapemDebitur", fields: [debiturId], references: [id], onDelete: Cascade)
  debiturId       String

  jenisPembiayaan JenisPembiayaan @relation("DapemJenis", fields: [jenisPembiayaanId], references: [id])
  jenisPembiayaanId String

  // Relasi One-to-Many (Dapem -> banyak Angsuran)
  angsuran        Angsuran[] @relation("DapemAngsuran")

  // Index untuk performa query
  @@index([debiturId])
  @@index([jenisPembiayaanId])
}

// Model yang memiliki relasi ke Dapem
model Debitur {
  id      String @id @default(cuid())
  nama    String
  nik     String @unique

  // Relasi One-to-Many (Debitur -> banyak Dapem)
  dapem   Dapem[] @relation("DapemDebitur")
}

// Enum untuk status
enum EDapemStatus {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  DISBURSED
  SETTLED
}
```

**Relasi yang sering Anda lihat:**

- **One-to-Many**: Debitur → Dapem (1 debitur bisa punya banyak pembiayaan)
- **Many-to-One**: Dapem → Debitur (banyak pembiayaan punya 1 debitur)
- **Many-to-Many**: (Jika ada)

---

## 📌 PATTERN 5: Menggunakan Prisma di API

```typescript
// ✅ FINDMANY - Ambil banyak data
const items = await prisma.dapem.findMany({
  where: {
    status: "APPROVED",
    debitur: {
      nama: { contains: "John" },
    },
  },
  include: { debitur: true, angsuran: true },
  orderBy: { createdAt: "desc" },
  take: 10,
  skip: 0,
});

// ✅ FINDUNIQUE - Ambil 1 data exact
const item = await prisma.dapem.findUnique({
  where: { id: "123" },
  include: { debitur: true },
});

// ✅ FINDMANY dengan relasi nested
const debitur = await prisma.debitur.findUnique({
  where: { id: "456" },
  include: {
    dapem: {
      where: { status: "DISBURSED" },
      include: { angsuran: true },
    },
  },
});

// ✅ CREATE
const newDapem = await prisma.dapem.create({
  data: {
    nomor: "DAP-2024-001",
    nominal: 10000000,
    debitur: { connect: { id: debiturId } },
    jenisPembiayaan: { connect: { id: jenisId } },
  },
});

// ✅ UPDATE
const updated = await prisma.dapem.update({
  where: { id: "123" },
  data: { status: "APPROVED" },
});

// ✅ DELETE
await prisma.dapem.delete({
  where: { id: "123" },
});

// ✅ COUNT
const total = await prisma.dapem.count({
  where: { status: "APPROVED" },
});
```

---

## 📌 PATTERN 6: Struktur Response API

**Success Response:**

```json
{
  "success": true,
  "data": {
    /* data di sini */
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "Error message di sini"
}
```

---

## 📌 PATTERN 7: Mengecek Permission di Frontend

```typescript
// Di components, Anda bisa cek permission dari user context

import { useUser } from '@/components/UserContext';

export default function MyComponent() {
  const { user } = useUser();

  // Cek permission
  if (!user || !user.permissions.includes('VIEW_FEATURE')) {
    return <div>Anda tidak punya akses</div>;
  }

  return <div>Content yang hanya bisa dilihat user dengan permission</div>;
}
```

---

## 📌 PATTERN 8: Form Submission

```typescript
'use client';

import { useState } from 'react';

export default function FormPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Berhasil!');
        setFormData({ name: '', email: '' });
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Loading...' : 'Submit'}
      </button>
    </form>
  );
}
```

---

## 📌 PATTERN 9: Error Handling

```typescript
// Di API route
try {
  // Logic di sini
} catch (error) {
  console.error("Error detail:", error);
  return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}

// Di frontend
try {
  const response = await fetch("/api/feature");

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
} catch (error) {
  console.error("Fetch error:", error);
}
```

---

## 📌 PATTERN 10: Dynamic Routing

**Contoh 1: View Detail**

```
File: app/(auth)/dapem/[id]/page.tsx
URL: /dapem/123
```

```typescript
export default function DapemDetailPage({ params }: { params: { id: string } }) {
  useEffect(() => {
    // Fetch detail by ID
    fetch(`/api/dapem/${params.id}`)
      .then(res => res.json())
      .then(data => setItem(data));
  }, [params.id]);

  return <div>Detail: {item.nomor}</div>;
}
```

**Contoh 2: Edit Page**

```
File: app/(auth)/dapem/[id]/edit/page.tsx
URL: /dapem/123/edit
```

---

## 🎯 Checklist saat Membaca Kode

- [ ] Apakah ini file UI (`.tsx` di `app/`) atau API (`app/api/`)?
- [ ] Apakah ini client component (`'use client'`) atau server component?
- [ ] Relasi apa yang di-include dalam Prisma query?
- [ ] Permission apa yang di-check?
- [ ] Error handling apa yang ada?
- [ ] Database model apa yang di-query?
- [ ] Response format apa yang dikembalikan?

---

## 🚀 Shortcut untuk Cepat Paham

1. **Baca database model dulu** → pahami struktur data
2. **Baca API route** → pahami logic backend
3. **Baca halaman** → pahami tampilan frontend
4. **Ikuti flow data** → dari user action → API call → database → response

---

**Good Luck! 🎉**
