# คู่มือเพิ่มอุปกรณ์ IoT และเชื่อมต่อ Telemetry API

เอกสารนี้อธิบายการลงทะเบียนอุปกรณ์ IoT ใน Digital Twin, การกำหนด metric และการส่งค่าจากอุปกรณ์เข้าระบบผ่าน HTTP API

- Base URL สำหรับ development: `http://localhost:3000`
- API version: `v1`
- รูปแบบข้อมูล: JSON (`Content-Type: application/json`)
- OpenAPI specification: [`docs/openapi/iot-v1.yaml`](./openapi/iot-v1.yaml)

## ภาพรวมขั้นตอน

1. ผู้ดูแลระบบเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์ `iot.manage`
2. ตรวจสอบ `typeId` และ `districtId` ที่ต้องการใช้
3. ลงทะเบียนอุปกรณ์ด้วย `POST /api/v1/iot`
4. กำหนด metric ที่อุปกรณ์จะส่ง เช่น `waterLevel`, `pm25` หรือ `temperature`
5. ตั้งค่า `IOT_INGEST_API_KEY` บน server
6. ตั้งค่าอุปกรณ์ให้ส่ง telemetry ไปยัง `POST /api/v1/iot/readings`
7. ตรวจสอบข้อมูลจากหน้า `/iot` หรือ `GET /api/v1/iot/:id`

> หมายเหตุ: API จัดการ metric ยังไม่มีในเวอร์ชันปัจจุบัน ขั้นตอนที่ 4 จึงต้องดำเนินการผ่านฐานข้อมูลโดยผู้ดูแลระบบ ดูตัวอย่างในหัวข้อ “กำหนด metric ให้อุปกรณ์”

## 1. เตรียมสิทธิ์ผู้ดูแล

Endpoint สำหรับสร้าง/แก้ไขอุปกรณ์ใช้ session cookie ของผู้ใช้ ไม่ใช้ IoT API key บัญชีต้องมีสิทธิ์ดังนี้:

| งาน | Permission |
| --- | --- |
| ดูอุปกรณ์และรายละเอียด | `iot.read` |
| สร้าง แก้ไข หรือลบอุปกรณ์ | `iot.manage` |

เข้าสู่ระบบและเก็บ cookie สำหรับใช้กับคำสั่งถัดไป:

```bash
curl -sS -c cookies.txt \
  -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "YOUR_USERNAME",
    "password": "YOUR_PASSWORD"
  }'
```

ไฟล์ `cookies.txt` มีข้อมูล session ห้าม commit หรือส่งต่อให้บุคคลอื่น

## 2. ตรวจสอบชนิดอุปกรณ์และพื้นที่

เรียกรายการ IoT เพื่อดูค่า `types[].id` และ `districts[].id`:

```bash
curl -sS -b cookies.txt \
  'http://localhost:3000/api/v1/iot?page=1&limit=100'
```

ตัวอย่างข้อมูลที่ต้องนำไปใช้:

```json
{
  "types": [
    {
      "id": "DEVICE_TYPE_UUID",
      "code": "WATER",
      "nameTh": "ระดับน้ำ"
    }
  ],
  "districts": [
    {
      "id": "DISTRICT_UUID",
      "code": "1701",
      "nameTh": "เมืองสิงห์บุรี"
    }
  ]
}
```

ชนิดอุปกรณ์ใน demo seed ได้แก่ `WATER`, `RAINFALL`, `AIR`, `WASTE`, `TRAFFIC`, `TOURISM` และ `HEALTH`

## 3. ลงทะเบียนอุปกรณ์

```bash
curl -sS -b cookies.txt \
  -X POST http://localhost:3000/api/v1/iot \
  -H 'Content-Type: application/json' \
  -d '{
    "deviceCode": "WATER-SB-041",
    "nameTh": "เซนเซอร์ระดับน้ำสถานี 41",
    "status": "OFFLINE",
    "typeId": "DEVICE_TYPE_UUID",
    "battery": 100,
    "districtId": "DISTRICT_UUID"
  }'
```

### ฟิลด์สำหรับสร้างอุปกรณ์

| Field | Type | Required | ข้อกำหนด |
| --- | --- | --- | --- |
| `deviceCode` | string | ใช่ | 2–80 ตัวอักษร, ไม่ซ้ำ, ใช้ได้เฉพาะ `A-Z`, `a-z`, `0-9`, `.`, `_`, `-` |
| `nameTh` | string | ใช่ | 2–191 ตัวอักษร |
| `status` | enum | ไม่ | `ONLINE`, `OFFLINE`, `MAINTENANCE`, `DEGRADED`; ค่าเริ่มต้น `OFFLINE` |
| `typeId` | string | ใช่ | ID จาก `types[].id` |
| `battery` | number/null | ไม่ | 0–100 |
| `districtId` | string/null | ไม่ | ID จาก `districts[].id` |

เมื่อสำเร็จ API คืน HTTP `201 Created` พร้อม `id`, `publicId` และ `deviceCode` ของอุปกรณ์ ให้เก็บ `deviceCode` หรือ `publicId` ไว้สำหรับการเชื่อมต่อ

## 4. กำหนด metric ให้อุปกรณ์

ระบบจะรับ reading เฉพาะ `metricKey` ที่ลงทะเบียนกับอุปกรณ์แล้ว ผู้ดูแลฐานข้อมูลสามารถใช้ SQL ต่อไปนี้เพื่อเพิ่มหรือปรับ metric:

```sql
INSERT INTO iot_metrics (
  id,
  device_id,
  type_id,
  metric_key,
  name_th,
  unit,
  warning,
  critical,
  created_at,
  updated_at
)
SELECT
  UUID(),
  d.id,
  d.type_id,
  'waterLevel',
  'ระดับน้ำ',
  'เมตร',
  12.50,
  13.00,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM iot_devices AS d
WHERE d.device_code = 'WATER-SB-041'
  AND d.deleted_at IS NULL
ON DUPLICATE KEY UPDATE
  name_th = VALUES(name_th),
  unit = VALUES(unit),
  warning = VALUES(warning),
  critical = VALUES(critical),
  updated_at = CURRENT_TIMESTAMP;
```

ข้อควรระวัง:

- `metric_key` แยกตัวพิมพ์เล็ก/ใหญ่ในระดับ application จึงควรกำหนดรูปแบบเดียว เช่น camelCase
- คู่ `device_id + metric_key` ต้องไม่ซ้ำ
- `unit` ของ reading สามารถไม่ส่งได้ ระบบจะใช้ unit ของ metric
- `warning` และ `critical` ใช้แสดงสถานะ NORMAL/WARNING/CRITICAL บนหน้าจอ
- ควรดำเนินการ SQL ด้วยบัญชีฐานข้อมูลสำหรับงานดูแลระบบ ไม่ใช้บัญชีของอุปกรณ์

ตัวอย่าง metric ที่มีใน demo:

| Device type | metricKey | Unit ตัวอย่าง |
| --- | --- | --- |
| WATER | `waterLevel` | เมตร |
| RAINFALL | `dailyRainfall` | มม. |
| AIR | `pm25` | µg/m³ |
| WASTE | `collectedWeight` | ตัน |
| TRAFFIC | `averageSpeed` | กม./ชม. |
| TOURISM | `visitorCount` | คน |
| HEALTH | `availableBeds`, `emergencyPatientsToday` | เตียง, ราย |

## 5. ตั้งค่า API key สำหรับอุปกรณ์

สร้าง secret แบบสุ่มบน server:

```bash
openssl rand -hex 32
```

นำผลลัพธ์ไปกำหนดใน `.env` โดยค่าต้องยาวอย่างน้อย 32 ตัวอักษร:

```env
IOT_INGEST_API_KEY=REPLACE_WITH_RANDOM_SECRET
```

Restart application หลังแก้ `.env` จากนั้นตั้งค่า key เดียวกันใน secret storage ของอุปกรณ์หรือ IoT gateway ห้ามฝังคีย์ไว้ใน repository, log หรือ query string

## 6. ส่ง telemetry จากอุปกรณ์

### Endpoint

```text
POST /api/v1/iot/readings
Authorization: Bearer <IOT_INGEST_API_KEY>
Content-Type: application/json
```

### ตัวอย่าง request

```bash
curl -sS \
  -X POST http://localhost:3000/api/v1/iot/readings \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_IOT_INGEST_API_KEY' \
  -d '{
    "deviceId": "WATER-SB-041",
    "metricKey": "waterLevel",
    "value": 12.48,
    "unit": "เมตร",
    "recordedAt": "2026-08-18T19:00:00+07:00",
    "idempotencyKey": "WATER-SB-041:waterLevel:20260818T190000+0700"
  }'
```

### Request schema

| Field | Type | Required | ข้อกำหนด/พฤติกรรม |
| --- | --- | --- | --- |
| `deviceId` | string | ใช่ | 1–80 ตัวอักษร; รับ internal ID, public ID หรือ `deviceCode` |
| `metricKey` | string | ใช่ | 1–80 ตัวอักษร; ต้องลงทะเบียนกับอุปกรณ์แล้ว |
| `value` | number | ใช่ | ต้องเป็น finite JSON number |
| `unit` | string | ไม่ | ไม่เกิน 40 ตัวอักษร; ถ้าไม่ส่งหรือส่ง `""` จะใช้ unit ของ metric |
| `recordedAt` | ISO 8601 datetime | ไม่ | เวลาที่วัดค่า; ถ้าไม่ส่งจะใช้เวลาที่ server รับข้อมูล |
| `idempotencyKey` | string | ไม่ | ไม่เกิน 191 ตัวอักษรและต้องไม่ซ้ำทั้งระบบ |

Request เป็น strict schema: ฟิลด์นอกเหนือจากรายการข้างต้นจะถูกปฏิเสธด้วย HTTP `422`

### Response เมื่อบันทึกสำเร็จ

HTTP `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "98765",
    "deviceId": "INTERNAL_DEVICE_UUID",
    "metricKey": "waterLevel",
    "value": 12.48,
    "unit": "เมตร",
    "recordedAt": "2026-08-18T12:00:00.000Z",
    "duplicate": false
  },
  "message": null
}
```

เวลาใน response เป็น UTC ถึงแม้ request จะส่ง timezone `+07:00`

### Response เมื่อส่งซ้ำ

ถ้า `idempotencyKey` เดิมเคยบันทึกกับ device และ metric เดียวกัน API คืน HTTP `200 OK`, reading เดิม และ `duplicate: true` โดยไม่เพิ่มข้อมูลอีกครั้ง

```json
{
  "success": true,
  "data": {
    "id": "98765",
    "deviceId": "INTERNAL_DEVICE_UUID",
    "metricKey": "waterLevel",
    "value": 12.48,
    "unit": "เมตร",
    "recordedAt": "2026-08-18T12:00:00.000Z",
    "duplicate": true
  },
  "message": null
}
```

## 7. แนวทาง retry และ idempotency

- สร้าง `idempotencyKey` ตั้งแต่จุดที่วัดค่า และใช้ key เดิมทุกครั้งที่ retry reading นั้น
- รูปแบบที่แนะนำ: `<deviceCode>:<metricKey>:<timestamp-or-sequence>`
- Retry เมื่อพบ network error, HTTP `429`, `500` หรือ `503` โดยใช้ exponential backoff
- ไม่ควร retry อัตโนมัติสำหรับ `400`, `401`, `403`, `404`, `409` หรือ `422` จนกว่าจะแก้ข้อมูล/configuration
- เวอร์ชันปัจจุบันรับหนึ่ง metric ต่อหนึ่ง HTTP request
- reading ที่มี `recordedAt` เก่ากว่าค่าล่าสุดจะถูกเก็บในประวัติ แต่จะไม่เขียนทับ latest value หรือทำให้ heartbeat ย้อนเวลา
- เมื่ออุปกรณ์สถานะ `OFFLINE` ส่งข้อมูลสำเร็จ ระบบเปลี่ยนสถานะเป็น `ONLINE`; สถานะ `MAINTENANCE` และ `DEGRADED` ไม่ถูกเปลี่ยนอัตโนมัติ

## 8. ตรวจสอบข้อมูล

ค้นหาอุปกรณ์ด้วย `deviceCode`:

```bash
curl -sS -b cookies.txt \
  'http://localhost:3000/api/v1/iot?search=WATER-SB-041'
```

ดูรายละเอียดด้วย internal ID หรือ public ID ที่ได้จาก response:

```bash
curl -sS -b cookies.txt \
  'http://localhost:3000/api/v1/iot/DEVICE_ID'
```

## 9. Error response และ HTTP status

Error ทุกชนิดใช้รูปแบบเดียวกัน:

```json
{
  "success": false,
  "data": null,
  "message": "คำอธิบายข้อผิดพลาด",
  "errors": [
    {
      "field": "value",
      "message": "Invalid input"
    }
  ],
  "meta": {
    "requestId": "REQUEST_UUID"
  }
}
```

| HTTP status | ความหมาย | แนวทางแก้ไข |
| --- | --- | --- |
| `400` | JSON ไม่ถูกต้อง | ตรวจ syntax และ `Content-Type` ของ request body |
| `401` | ไม่มี session, รูปแบบ Authorization header ไม่ถูกต้อง หรือ IoT API key ไม่ถูกต้อง | ตรวจ `Authorization: Bearer <API_KEY>` หรือบัญชีผู้ใช้ |
| `403` | session ไม่มี permission | เพิ่ม `iot.read` หรือ `iot.manage` ตามงาน |
| `404` | ไม่พบอุปกรณ์ | ตรวจ `deviceId` และสถานะการลบ |
| `409` | `deviceCode` ซ้ำ หรือ idempotency key ชนกับ reading อื่น | ใช้ code/key ใหม่ที่ถูกต้อง |
| `422` | validation ไม่ผ่าน, type/district/metric ไม่ถูกต้อง | ตรวจ `errors[]` และ master data |
| `429` | ส่ง request ถี่เกินข้อจำกัดของ gateway/rate limiter | retry พร้อม backoff |
| `500` | ข้อผิดพลาดภายในระบบ | เก็บ `requestId` และตรวจ server log |
| `503` | server ยังไม่พร้อม เช่น ไม่ได้ตั้ง API key | ตรวจ environment/configuration |

## 10. API จัดการอุปกรณ์โดยสรุป

| Method | Path | Auth | Permission | ใช้งาน |
| --- | --- | --- | --- | --- |
| `GET` | `/api/v1/iot` | Session cookie | `iot.read` | รายการ สรุป ชนิดอุปกรณ์และอำเภอ |
| `POST` | `/api/v1/iot` | Session cookie | `iot.manage` | ลงทะเบียนอุปกรณ์ |
| `GET` | `/api/v1/iot/:id` | Session cookie | `iot.read` | รายละเอียด metrics และ readings |
| `PATCH` | `/api/v1/iot/:id` | Session cookie | `iot.manage` | แก้ชื่อ สถานะ ชนิด แบตเตอรี่ หรืออำเภอ |
| `DELETE` | `/api/v1/iot/:id` | Session cookie | `iot.manage` | soft-delete อุปกรณ์ |
| `POST` | `/api/v1/iot/readings` | Bearer API key หรือ session | API key หรือ `iot.manage` | บันทึก telemetry |

## 11. Production checklist

- ใช้ HTTPS เท่านั้น
- เก็บ `IOT_INGEST_API_KEY` ใน secret manager และกำหนดแผน rotation
- จำกัด IP/network ที่เข้า ingestion endpoint ที่ API gateway หรือ firewall
- ตั้ง rate limit และ request body limit ที่ reverse proxy/API gateway
- แยก API key ตามอุปกรณ์หรือ gateway ในรุ่นถัดไป หากต้องการ revoke/ติดตามเป็นรายอุปกรณ์
- Monitor สัดส่วน `401`, `422`, `500`, latency และช่วงเวลาตั้งแต่ `recordedAt` ถึงเวลารับข้อมูล
- ซิงก์นาฬิกาอุปกรณ์ด้วย NTP และเก็บคิว readings ในเครื่องเมื่อ network ขาดหาย
- ไม่บันทึก API key ลง log และไม่ส่ง key ผ่าน URL/query string

## ข้อจำกัดของ API เวอร์ชันปัจจุบัน

- ใช้ ingestion API key ร่วมกันทั้งระบบ ยังไม่มี key แยกรายอุปกรณ์
- ยังไม่มี endpoint สำหรับสร้าง/แก้ไข metric
- รับหนึ่ง metric ต่อ request ยังไม่มี batch ingestion
- application ยังไม่มี distributed rate limiter สำหรับ ingestion ควรควบคุมที่ gateway ใน production
