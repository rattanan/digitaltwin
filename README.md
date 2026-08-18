# Digital Twin – Intelligent City Platform

แพลตฟอร์มศูนย์บัญชาการเมืองอัจฉริยะสำหรับติดตามข้อมูลจังหวัด หน่วยงาน พื้นที่ปกครอง การแจ้งเตือน เหตุการณ์ และตัวชี้วัดสำคัญ โดย Phase 1 เตรียม foundation, authentication/RBAC, master data, audit log และ demo seed data, Phase 2 เปิดใช้งานแผนที่ GIS แบบโต้ตอบ, Phase 3 เปิดใช้งานศูนย์ควบคุม CCTV, Phase 4 เปิดใช้งานศูนย์ติดตาม IoT, Phase 5 เปิดใช้งาน Alert Center กับ Incident workflow และ Phase 6 เปิดใช้งาน AI Copilot แบบ context-aware

## สถานะ Phase 1

- Next.js 16 App Router + TypeScript + Tailwind CSS 4
- Thai-first responsive command-center dashboard shell
- MariaDB/MySQL ผ่าน Prisma 7 และ `@prisma/adapter-mariadb`
- HttpOnly access/refresh cookies, refresh-token rotation, session revocation และ account lockout
- RBAC, data-scope foundation, user/role/agency/area CRUD
- Audit logging สำหรับการกระทำสำคัญ
- Full deterministic fictional Sing Buri demo seed data
- Phase 2: MapLibre GL interactive city map, administrative-area centroids, important locations และ permission-aware CCTV overlay
- Phase 3: CCTV operations สำหรับดูสถานะกล้อง ค้นหา/กรอง รายละเอียด snapshot metadata ผลตรวจจับ AI และจัดการสถานะตามสิทธิ์
- Phase 4: IoT monitoring สำหรับดูสถานะอุปกรณ์ ค่า latest telemetry แนวโน้ม readings, battery/heartbeat และรับข้อมูลผ่าน idempotent ingestion API
- Phase 5: Alert Center และ Incident workflow สำหรับค้นหา/กรองรายการ, ดู detail/history, เปลี่ยนสถานะ, เปิด incident ใหม่, เชื่อมโยง source และบันทึก audit
- Phase 6: AI Copilot สำหรับถามตอบจาก context snapshot ที่กรองตามสิทธิ์, เก็บ conversation/message/source citation และบันทึก audit
- AI provider ภายนอกยังไม่ถูกเรียกใช้; runtime ปัจจุบันเป็น deterministic Context Engine สำหรับ demo และ integration testing

## ข้อกำหนดเครื่องมือ

- Node.js 22+
- MariaDB 5.5 (compatibility path) หรือ MariaDB 11 / MySQL 8
- Login rate limiting ใช้ in-process memory จึงไม่ต้องใช้ Redis; production ที่รันหลาย instance ควรมี shared rate limiter ที่ gateway หรือ service layer
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
- `/api/v1/map`
- `/api/v1/cctv`
- `/api/v1/cctv/:id`
- `/api/v1/iot`
- `/api/v1/iot/:id`
- `POST /api/v1/iot/readings`
- `/api/v1/alerts`
- `/api/v1/alerts/:id`
- `/api/v1/incidents`
- `/api/v1/incidents/:id`
- `GET /api/v1/ai`
- `GET|POST /api/v1/ai/conversations`
- `GET|PATCH|DELETE /api/v1/ai/conversations/:id`
- `POST /api/v1/ai/conversations/:id/messages`
- `GET /api/v1/ai/suggested-questions`

ทุก API ใช้ response contract แบบ `success/data/message/meta`, Zod validation, server-side permission checks และ audit hooks สำหรับ sensitive actions

## โครงสร้างสำคัญ

```text
app/(auth)                 public login
app/(protected)            authenticated shell and pages
app/api/v1                 versioned Route Handlers
components                 UI primitives, shell, dashboard, admin panels
lib                        auth, Prisma, rate limiting, API, audit and query services
prisma/schema.prisma       MariaDB/MySQL data model
prisma/migrations          initial foundation migration
prisma/seed.ts             minimal/demo/reset seed commands
tests                      unit tests for foundation contracts
```

ข้อมูลสาธิตทั้งหมดเป็น fictional data สำหรับ development/demo เท่านั้น

## Phase 2 map

เปิดใช้งานที่ `/map` หลังเข้าสู่ระบบ เมนูแผนที่ใช้ `areas.read` เป็นสิทธิ์หลัก และจะแสดงชั้น CCTV เพิ่มเติมเมื่อผู้ใช้มี `cctv.read` ชั้นข้อมูลประกอบด้วยอำเภอ ตำบล จุดสำคัญ และ CCTV ที่มีพิกัดในฐานข้อมูล

แผนที่ใช้ MapLibre style URL จาก `NEXT_PUBLIC_MAP_STYLE_URL` โดยค่าเริ่มต้นใช้ demo style ที่ไม่ต้องใช้ access token สำหรับ production ควรเปลี่ยนเป็น style/tile endpoint ที่องค์กรดูแลเองและตรวจสอบ attribution/licensing ให้เหมาะสม

## Phase 3 CCTV

เปิดใช้งานที่ `/cctv` สำหรับผู้ใช้ที่มี `cctv.read` หน้าศูนย์ควบคุมแสดงสถานะกล้อง รายการ snapshot metadata และ AI events ล่าสุด โดยไม่เปิดเผย path ภายใน NAS ให้ browser; การแสดงภาพจริงต้องเชื่อม media connector หรือ endpoint ที่มีการควบคุมสิทธิ์เพิ่มเติม

ผู้ใช้ที่มี `cctv.manage` สามารถปรับสถานะกล้องและ soft-delete รายการผ่านหน้ารายละเอียดหรือ `PATCH`/`DELETE /api/v1/cctv/:id` ได้

## Phase 4 IoT

เปิดใช้งานที่ `/iot` สำหรับผู้ใช้ที่มี `iot.read` หน้าศูนย์ติดตามแสดงชนิดอุปกรณ์ สถานะ online/offline แบตเตอรี่ ค่า metric ล่าสุด threshold และกราฟ readings รายอุปกรณ์ ผู้ใช้ที่มี `iot.manage` สามารถปรับสถานะ/soft-delete และส่ง telemetry ผ่าน `POST /api/v1/iot/readings` ซึ่งรองรับ `idempotencyKey` เพื่อป้องกันการบันทึกซ้ำ

อุปกรณ์ IoT เรียก endpoint เดียวกันได้โดยตั้ง `IOT_INGEST_API_KEY` เป็นค่าสุ่มยาวอย่างน้อย 32 ตัวอักษร แล้วส่ง header `Authorization: Bearer <API_KEY>` พร้อม JSON ต่อไปนี้ (ใช้ `deviceCode`, public ID หรือ internal ID ใน `deviceId` ได้):

ดูขั้นตอนลงทะเบียนอุปกรณ์ กำหนด metric การ retry และ error codes ฉบับเต็มได้ที่ [คู่มือเพิ่มอุปกรณ์ IoT และเชื่อมต่อ Telemetry API](docs/iot-device-integration-guide.md) หรือ import [OpenAPI 3.1 specification](docs/openapi/iot-v1.yaml) เข้า Swagger/Postman

```bash
curl -X POST http://localhost:3000/api/v1/iot/readings \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_IOT_INGEST_API_KEY' \
  -d '{
    "deviceId": "WATER-SB-001",
    "metricKey": "waterLevel",
    "value": 12.5,
    "unit": "cm",
    "recordedAt": "2026-08-18T10:30:00+07:00",
    "idempotencyKey": "WATER-SB-001-20260818T103000-waterLevel"
  }'
```

`deviceId`, `metricKey` และ `value` เป็นค่าบังคับ ส่วน `unit`, `recordedAt` และ `idempotencyKey` เป็นตัวเลือก หากไม่ส่ง `recordedAt` ระบบใช้เวลาที่รับข้อมูล และหากส่ง `idempotencyKey` เดิมซ้ำ ระบบจะคืนรายการเดิมพร้อม `duplicate: true` โดยไม่บันทึกซ้ำ คีย์นี้ต้องไม่ซ้ำกันทั้งระบบ

## Phase 5 Alerts และ Incidents

เปิดใช้งานที่ `/alerts` และ `/incidents` สำหรับผู้ใช้ที่มี `alerts.read` หรือ `incidents.read` ตามลำดับ ศูนย์แจ้งเตือนรวมรายการจาก IoT, CCTV, AI และ rule source พร้อม filter ตามสถานะ ระดับความรุนแรง แหล่งที่มา และอำเภอ ส่วน Incident workflow รองรับการเปิดเหตุการณ์ใหม่จากศูนย์ปฏิบัติการ เชื่อม alert/CCTV/IoT และติดตาม due date กับ status history

ผู้ใช้ที่มี `alerts.manage` หรือ `incidents.manage` สามารถเปลี่ยนสถานะและเพิ่มหมายเหตุผ่านหน้า detail ได้ ทุกการเปลี่ยนแปลงเขียนลง `alert_histories`/`incident_histories` และ audit log; API ใช้ Zod validation และไม่เปิดเผยข้อมูล path ภายในระบบ

## Phase 6 AI Copilot

เปิดใช้งานที่ `/ai` สำหรับผู้ใช้ที่มี `ai.read` และ `ai.use` โดย workspace จะแสดง conversation, suggested questions และ context panel ที่รวมสถานการณ์จาก dashboard, alerts, incidents, CCTV และ IoT เฉพาะโมดูลที่บัญชีมีสิทธิ์อ่านได้

คำตอบของ demo runtime อ้างอิง source citation กลับไปยังหน้าข้อมูลในระบบ และบันทึก user query, assistant response, sources และ audit log ในฐานข้อมูล เมื่อจะเชื่อม provider ภายนอกภายหลัง ให้แทนที่ `lib/ai/runtime.ts` โดยคง permission boundary และ source contract เดิมไว้
