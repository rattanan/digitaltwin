import { z } from "zod";
import { CCTV_STATUSES } from "@/lib/cctv/types";

const optionalId = z.string().trim().max(80).nullable().optional();

export const cctvCreateSchema = z.object({
  cameraCode: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9._-]+$/, "รหัสกล้องใช้ได้เฉพาะตัวอักษร ตัวเลข จุด ขีดกลาง และขีดล่าง"),
  nameTh: z.string().trim().min(2).max(191),
  nameEn: z.string().trim().max(191).optional().or(z.literal("")),
  status: z.enum(CCTV_STATUSES).default("OFFLINE"),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  districtId: optionalId,
}).strict();

export const cctvUpdateSchema = z.object({
  nameTh: z.string().trim().min(2).max(191).optional(),
  nameEn: z.string().trim().max(191).optional().or(z.literal("")),
  status: z.enum(CCTV_STATUSES).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  districtId: optionalId,
}).strict();
