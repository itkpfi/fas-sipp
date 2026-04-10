# 📋 FAS SISTEM - AUDIT FINDINGS & ACTION PLAN

**System:** Sistem Pembiayaan Pensiun dengan Skema Channeling  
**Date:** April 9, 2026  
**Overall Score:** 6/10 - Good architecture, needs security & validation hardening  

---

## ✅ FIXES COMPLETED

### Critical Fixes Applied:
- [x] **UserContext Typo Fix** - Changed `r_position` to `t_position`
- [x] **Environment Variable Validation** - Created `.env.example` with all required variables
- [x] **Input Validation Layer** - Created `libs/Validation.ts` with reusable validators
- [x] **Authorization Middleware** - Created `libs/Authorization.ts` for RBAC
- [x] **Secure Seed Data** - Updated `prisma/seed.ts` to use env variables, removed hardcoded passwords
- [x] **Secure Auth** - Updated `libs/Auth.ts` with proper secret key validation and bcrypt API key hashing

---

## 🚨 CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION

### 1. **Missing Input Validation in API Endpoints** ⚠️
**Files:** `app/api/user/route.ts`, `app/api/dapem/route.ts`, `app/api/debitur/route.ts`, etc.

**Examples of issues:**
```typescript
// BEFORE (unsafe)
const skip = (parseInt(page) - 1) * parseInt(limit);  // No bounds checking
where: { nopen: { contains: search } }  // No search validation

// AFTER (safe - use provided Validation.ts)
const validation = validatePagination(page, limit);
if (Array.isArray(validation)) return apiError("Invalid pagination", 400, validation);
const { page: p, limit: l } = validation;

const searchSafe = sanitizeSearch(search);
where: { nopen: { contains: searchSafe } }
```

**Files to update:**
- `app/api/user/route.ts`
- `app/api/dapem/route.ts`
- `app/api/debitur/route.ts`
- `app/api/pinjaman/route.ts`
- `app/api/pinkar/tagihan-data/route.ts`
- `app/api/dropping/route.ts`
- `app/api/ttpb/dropping/route.ts`
- All other GET endpoints with pagination or search

**Priority:** 🔴 CRITICAL

---

### 2. **Add Permission Checks to Admin API Endpoints** ⚠️
**Files:** `app/api/roles/route.ts`, `app/api/user/route.ts`, `app/api/sumdan/route.ts`

**Pattern to implement:**
```typescript
import { requirePermission, requireAuth } from "@/libs/Authorization";

export const POST = async (request: NextRequest) => {
  // Check authentication
  const authError = await requireAuth(request);
  if (authError) return authError;

  // Check specific permission
  const permError = await requirePermission(request, "/master/roles", "write");
  if (permError) return permError;

  // Now safe to process
  const body = await request.json();
  // ... rest of code
};
```

**Endpoints needing protection:**
- POST/PUT/DELETE `/api/roles`
- POST/PUT/DELETE `/api/user`
- POST/PUT/DELETE `/api/sumdan`
- POST/PUT/DELETE `/api/area`
- POST/PUT/DELETE `/api/jenis`
- POST/PUT `/api/dapem` (approval/verification state changes)

**Priority:** 🔴 CRITICAL

---

### 3. **Add File Upload Validation** ⚠️
**File:** `app/api/upload/route.ts`

**Current issues:**
- No file size limit
- No file type validation
- No filename sanitization (path traversal risk)

**Fix needed:**
```typescript
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

export const POST = async (req: NextRequest) => {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  
  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return apiError(`File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`, 413);
  }
  
  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError("File type not allowed", 400);
  }
  
  // Sanitize filename
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  // ... rest
};
```

**Priority:** 🔴 CRITICAL

---

### 4. **Add Authorization to File Download** ⚠️
**File:** `app/api/upload/route.ts` (GET endpoint)

**Current:** Anyone can download any file if they know the URL  
**Fix:** Add permission check and verify file ownership

**Priority:** 🔴 CRITICAL

---

### 5. **Protect Routes with Proper Session Checks** ⚠️
**Issue:** Many GET endpoints silently return empty data on auth failure

**Pattern:**
```typescript
const session = await getSession();
if (!session) {
  // BEFORE: return NextResponse.json({ data: [], status: 200 }, { status: 200 });
  // AFTER:
  return apiError("Unauthorized", 401);
}
```

**Files to update:** All API GET endpoints

**Priority:** 🔴 CRITICAL

---

## 🟠 HIGH PRIORITY ISSUES

### 6. **Remove console.log() from Catch Blocks**
**Severity:** High - Security risk, exposes stack traces

**Files:**
- components/utils/FormUtils.tsx
- components/UserContext.tsx
- app/page.tsx
- app/api/user/route.ts
- app/api/auth/route.ts
- app/api/upload/route.ts
- app/(auth)/ttpj/dropping/page.tsx
- +10 more files

**Fix:** Replace with proper logging:
```typescript
import logger from '@/libs/logger';

try {
  // code
} catch (error) {
  logger.error('Operation failed', { error, context: 'userCreation' });
  return apiError("Internal error", 500);
}
```

**Create file:** `libs/Logger.ts`

**Priority:** 🟠 HIGH

---

### 7. **Add Rate Limiting to Login Endpoint**
**File:** `app/api/auth/route.ts`

**Issue:** No brute force protection

**Recommendation:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

Or use simple in-memory rate limiting:
```typescript
const loginAttempts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempt = loginAttempts.get(ip);
  
  if (!attempt || attempt.resetTime < now) {
    loginAttempts.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return true;
  }
  
  if (attempt.count >= 5) {
    return false;
  }
  
  attempt.count++;
  return true;
}
```

**Priority:** 🟠 HIGH

---

### 8. **Fix Password Hash Check Logic**
**File:** `app/api/user/route.ts` (Line 130)

**Current issue:**
```typescript
if (body.password && body.password.length < 20) {
  updated.password = await bcrypt.hash(body.password, 10);
} else {
  updated.password = find.password;
}
```

**Fix:**
```typescript
if (body.password) {
  // Check if already hashed (bcrypt hashes start with $2a$, $2b$, $2y$)
  if (!body.password.startsWith('$2')) {
    updated.password = await bcrypt.hash(body.password, 10);
  } else {
    updated.password = body.password;
  }
} else if (!find) {
  return apiError("User not found", 404);
}
```

**Priority:** 🟠 HIGH

---

### 9. **Standardize API Response Format**
**Issue:** Inconsistent response format across endpoints

**Standard format to use:**
```typescript
// Success
{ success: true, status: 200, data: {...} }

// Error
{ success: false, status: 400|401|403|500, message: "...", errors?: [...] }

// Use the provided functions:
import { apiSuccess, apiError } from "@/libs/Validation";

return apiSuccess(data);
return apiError("message", 400);
```

**Priority:** 🟠 HIGH

---

### 10. **Add Database Indexes for Performance**
**File:** `prisma/schema.prisma`

**Add indexes:**
```prisma
model Dapem {
  // ... existing fields
  
  @@index([nopen])
  @@index([sumdanId])
  @@index([status])
  @@index([created_at])
  @@index([dropping_status])
  @@index([createdById])
  @@index([aoId])
}

model Pinjaman {
  // ... existing fields
  
  @@index([userId])
  @@index([status])
  @@index([created_at])
}

model User {
  // ... existing fields
  
  @@index([sumdanId])
  @@index([status])
  @@index([roleId])
  @@index([cabangId])
}
```

**Then run:**
```bash
npx prisma migrate dev --name add_indexes
```

**Priority:** 🟠 HIGH

---

## 🟡 MEDIUM PRIORITY ISSUES

### 11. **Add Audit Logging**
**Missing:** Who did what, when, why

**Create table:**
```prisma
model AuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String   // CREATE, UPDATE, DELETE, APPROVE, REJECT
  resource  String   // e.g., "Dapem", "Pinjaman"
  resourceId String
  changes   String?  @db.Text  // JSON: before/after values
  ipAddress String?
  userAgent String?
  
  createdAt DateTime @default(now())
  
  User User @relation(fields: [userId], references: [id])
}
```

**Priority:** 🟡 MEDIUM

---

### 12. **Add Email Notifications**
**Missing:** Status change alerts to users

**Common notifications:**
- Dapem approval/rejection
- Pinjaman status change
- Pelunasan confirmation
- Profile update notifications

**Priority:** 🟡 MEDIUM

---

### 13. **Remove TypeScript `any` Type**
**Files:** Multiple components and utilities

**Current:**
```typescript
onChange: (e: any) => setData({ ...data, value: parseInt(e) })
```

**Better:**
```typescript
onChange: (e: string) => setData({ ...data, value: parseInt(e) || 0 })
```

**Priority:** 🟡 MEDIUM

---

### 14. **Add Error Boundaries**
**Missing:** Client error handling

**Create:**
```typescript
// components/ErrorBoundary.tsx
import React from 'react';

export class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}
```

**Priority:** 🟡 MEDIUM

---

### 15. **Add Database Soft Delete Support**
**Schema change:**
```prisma
model Dapem {
  // ... existing fields
  
  deletedAt DateTime?
  deletedBy String?
  deletionReason String?
  
  @@index([deletedAt])
}
```

**Pattern:**
```typescript
// Soft delete
await prisma.dapem.update({
  where: { id },
  data: { deletedAt: new Date(), deletedBy: userId, status: false }
});

// Query (exclude deleted)
await prisma.dapem.findMany({
  where: { deletedAt: null, status: true }
});
```

**Priority:** 🟡 MEDIUM

---

## 🟢 LOW PRIORITY / ENHANCEMENTS

### 16. **Create API Documentation** (Swagger/OpenAPI)
```bash
npm install swagger-jsdoc swagger-ui-express
```

### 17. **Setup Proper Logging System** (Winston/Pino)
```bash
npm install winston
```

### 18. **Add Two-Factor Authentication**
Consider SMS OTP or TOTP (Google Authenticator)

### 19. **Responsive Mobile Design**
Currently desktop-only

### 20. **Advanced Reporting Dashboard**
Scheduled reports, custom date ranges, exports

---

## 📊 IMPLEMENTATION PRIORITIES

### Phase 1: Security Hardening (Week 1)
- [ ] Add input validation to all API endpoints
- [ ] Add permission checks to admin routes
- [ ] Add file upload validation
- [ ] Add authorization to file download
- [ ] Fix password hash logic
- [ ] Remove console.log statements

**Estimated effort:** 40  hours

### Phase 2: Code Quality (Week 2)
- [ ] Standardize API response format
- [ ] Add database indexes
- [ ] Replace `any` types
- [ ] Add error boundaries
- [ ] Setup proper logging

**Estimated effort:** 30 hours

### Phase 3: Features & Monitoring (Week 3-4)
- [ ] Add audit logging
- [ ] Add email notifications
- [ ] Add rate limiting
- [ ] Setup error tracking
- [ ] Add soft delete support

**Estimated effort:** 50 hours

### Phase 4: Documentation & Testing (Week 5)
- [ ] API documentation (Swagger)
- [ ] Database schema docs
- [ ] Deployment guide
- [ ] Unit tests
- [ ] Integration tests

**Estimated effort:** 40 hours

---

## ✨ FEATURES NEEDED FOR KOPERASI & BANK

### Must-Have:
1. ✅ **Complete Audit Trail** - Every data change logged
2. ✅ **RBAC with Enforcement** - Role-based access control
3. ✅ **Data Validation** - All inputs validated
4. ✅ **Error Handling** - Proper error messages
5. ✅ **Security** - Auth, encryption, rate limiting

### Should-Have:
1. **Email Notifications** - Status updates
2. **Advanced Reports** - Custom date ranges, exports
3. **Two-Factor Auth** - OTP security
4. **Activity Dashboard** - Admin monitoring
5. **Data Export/Import** - Backup capabilities

### Nice-to-Have:
1. **Mobile Responsive** - Works on phones
2. **Scheduled Reports** - Auto-generated
3. **Bulk Operations** - Import multiple records
4. **API for 3rd parties** - Integration capability
5. **Performance Analytics** - Dashboard metrics

---

## 🔗 Reference Files

- **Validation:** `libs/Validation.ts` (created)
- **Authorization:** `libs/Authorization.ts` (created)
- **Auth:** `libs/Auth.ts` (updated)
- **Seed:** `prisma/seed.ts` (updated)
- **Env Example:** `.env.example` (created)
- **Audit Report:** `AUDIT_REPORT.md` (full details)

---

## ✅ VERIFICATION CHECKLIST

Before deploying to production:
- [ ] All critical issues fixed
- [ ] Input validation on all APIs
- [ ] Permission checks on admin routes
- [ ] File upload validation
- [ ] Auth errors return 401
- [ ] No hardcoded secrets
- [ ] APP_KEY set in environment
- [ ] Rate limiting on login
- [ ] Error messages don't expose internals
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Database backups working
- [ ] Audit log table created
- [ ] Monitoring/alerting setup
- [ ] Performance tested under load

---

## 🆘 NEED HELP?

Refer to the comprehensive `AUDIT_REPORT.md` file for:
- Detailed code examples
- Security vulnerability matrix
- Database issues analysis
- Performance optimization tips
- Testing strategy

---

**Last Updated:** April 9, 2026  
**Status:** 🟡 In Progress - Critical fixes complete, working on validators
