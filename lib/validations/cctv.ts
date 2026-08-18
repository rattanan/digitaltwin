import { z } from "zod";
import { CCTV_STATUSES } from "@/lib/cctv/types";
import { parseGoogleDriveFolderUrl } from "@/lib/cctv/google-drive";

const optionalId = z.string().trim().max(80).nullable().optional();
const googleDriveFolderUrl = z.string().trim().max(500).refine(
  (value) => value === "" || parseGoogleDriveFolderUrl(value) !== null,
  "กรุณาใช้ URL ของ Google Drive folder เช่น https://drive.google.com/drive/folders/...",
).optional().or(z.literal(""));

export const cctvCreateSchema = z.object({
  cameraCode: z.string().trim().min(2).max(80).regex(/^[A-Za-z0-9._-]+$/, "รหัสกล้องใช้ได้เฉพาะตัวอักษร ตัวเลข จุด ขีดกลาง และขีดล่าง"),
  nameTh: z.string().trim().min(2).max(191),
  nameEn: z.string().trim().max(191).optional().or(z.literal("")),
  status: z.enum(CCTV_STATUSES).default("OFFLINE"),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  districtId: optionalId,
  googleDriveFolderUrl,
}).strict();

export const cctvUpdateSchema = z.object({
  nameTh: z.string().trim().min(2).max(191).optional(),
  nameEn: z.string().trim().max(191).optional().or(z.literal("")),
  status: z.enum(CCTV_STATUSES).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  districtId: optionalId,
  googleDriveFolderUrl,
}).strict();
