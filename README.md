# Digital Twin – Intelligent City Platform

แพลตฟอร์มศูนย์บัญชาการเมืองอัจฉริยะสำหรับติดตามข้อมูลจังหวัด หน่วยงาน พื้นที่ปกครอง การแจ้งเตือน เหตุการณ์ และตัวชี้วัดสำคัญ โดย Phase 1 นี้เตรียม foundation, authentication/RBAC, master data, audit log และ demo seed data สำหรับการต่อยอด GIS, CCTV, IoT และ AI ใน phase ถัดไป

## สถานะ Phase 1

- Next.js 16 App Router + TypeScript + Tailwind CSS 4
- Thai-first responsive command-center dashboard shell
- MariaDB/MySQL ผ่าน Prisma 7 และ `@prisma/adapter-mariadb`
- HttpOnly access/refresh cookies, refresh-token rotation, session revocation และ account lockout
- RBAC, data-scope foundation, user/role/agency/area CRUD
- Audit logging สำหรับการกระทำสำคัญ
- Full deterministic fictional Sing Buri demo seed data
- CCTV/IoT/AI runtime workflows ยังไม่เปิดใช้งาน

## ข้อกำหนดเครื่องมือ

- Node.js 22+
- MariaDB 5.5 (compatibility path) หรือ MariaDB 11 / MySQL 8
- Redis เป็น optional สำหรับ development และควรมีใน production
- ไม่ต้องใช้ Docker สำหรับ workflow นี้; service endpoints อ่านจาก `.env`

## ติดตั้งและตั้งค่า

```bash
npm install
cp .env.example .env
```

แก้ `DATABASE_URL`, secrets และ seed passwords ใน `.env` จากนั้นสร้าง database `digitaltwin` ใน MariaDB/MySQL และตรวจว่าบัญชีมีสิทธิ์สร้างตารางและ migration

ถ้า password ใน `DATABASE_URL` มีอักขระพิเศษ เช่น `@` ต้อง URL-encode (`@` เป็น `%40`) และใช้รูปแบบ `username:password@host` เสมอ

## Database commands

```bash
npm run db:generate
# ใช้คำสั่งนี้สำหรับ MariaDB 5.5 และใช้ได้กับ MariaDB รุ่นใหม่ด้วย
npm run db:migrate:deploy

# Seed เฉพาะ foundation
npm run db:seed:minimal

# Seed ข้อมูลสาธิตเต็มชุด
npm run db:seed:demo

# Reset ข้อมูลสาธิต (ต้องตั้ง ALLOW_DATABASE_RESET=true เอง)
npm run db:seed:reset

npm run db:studio
```

`db:migrate:deploy` จะเตรียมตาราง migration ledger แบบที่ MariaDB 5.5 รองรับก่อนเรียก Prisma และใช้ migration ที่ตัด `JSON`/fractional `DATETIME` ออกแล้ว โดยข้อมูล JSON ของระบบเก็บเป็น JSON text ใน `LONGTEXT` และเวลามีความละเอียดระดับวินาที สำหรับฐานข้อมูลรุ่นใหม่ที่ต้องการใช้ Prisma migration ตรง ๆ ให้ใช้ `npm run db:migrate:deploy:modern`

`db:seed:minimal` สร้าง roles, permissions, system settings และ Super Admin ส่วน `db:seed:demo` เพิ่มข้อมูลสาธิตจังหวัดสิงห์บุรีสำหรับ dashboard, CCTV metadata, IoT readings, alerts, incidents, statistics, news และ AI conversation records โดยไม่เรียก external AI API

ห้ามใช้ `db:seed:reset` กับ production database เว้นแต่ได้รับอนุมัติและตั้ง `ALLOW_DATABASE_RESET=true` อย่างชัดเจน

## Run

```bash
npm run dev
# เปิด http://localhost:3000

npm run typecheck
npm run lint
npm run test
npm run build
npm run start
```

เข้าใช้งานด้วย username ที่ seed ไว้ และ password จาก `SEED_SUPER_ADMIN_PASSWORD` หรือ `SEED_DEFAULT_USER_PASSWORD`

## API foundation

Authentication:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`

Administration:

- `/api/v1/users`
- `/api/v1/roles`
- `/api/v1/agencies`
- `/api/v1/areas?type=province|district|subdistrict|village`
- `/api/v1/dashboard/summary`

ทุก API ใช้ response contract แบบ `success/data/message/meta`, Zod validation, server-side permission checks และ audit hooks สำหรับ sensitive actions

## โครงสร้างสำคัญ

```text
app/(auth)                 public login
app/(protected)            authenticated shell and pages
app/api/v1                 versioned Route Handlers
components                 UI primitives, shell, dashboard, admin panels
lib                        auth, Prisma, Redis, API, audit and query services
prisma/schema.prisma       MariaDB/MySQL data model
prisma/migrations          initial foundation migration
prisma/seed.ts             minimal/demo/reset seed commands
tests                      unit tests for foundation contracts
```

ข้อมูลสาธิตทั้งหมดเป็น fictional data สำหรับ development/demo เท่านั้น
