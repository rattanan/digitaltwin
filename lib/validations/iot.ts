import { z } from "zod";
import { IOT_STATUSES } from "@/lib/iot/types";

const optionalId = z.string().trim().max(80).nullable().optional();

export const iotCreateSchema = z.object({
  deviceCode: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9._-]+$/, "รหัสอุปกรณ์ใช้ได้เฉพาะตัวอักษร ตัวเลข จุด ขีดกลาง และขีดล่าง"),
  nameTh: z.string().trim().min(2).max(191),
  status: z.enum(IOT_STATUSES).default("OFFLINE"),
  typeId: z.string().trim().min(1).max(80),
  battery: z.number().min(0).max(100).nullable().optional(),
  districtId: optionalId,
}).strict();

export const iotUpdateSchema = z.object({
  nameTh: z.string().trim().min(2).max(191).optional(),
  status: z.enum(IOT_STATUSES).optional(),
  typeId: z.string().trim().min(1).max(80).optional(),
  battery: z.number().min(0).max(100).nullable().optional(),
  districtId: optionalId,
}).strict();

export const iotReadingSchema = z.object({
  deviceId: z.string().trim().min(1).max(80),
  metricKey: z.string().trim().min(1).max(80),
  value: z.number().finite(),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
  recordedAt: z.coerce.date().optional(),
  idempotencyKey: z.string().trim().max(191).optional().or(z.literal("")),
}).strict();
