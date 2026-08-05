import { z } from "zod";
import { CCTV_STATUSES } from "@/lib/cctv/types";

export const cctvUpdateSchema = z.object({
  nameTh: z.string().trim().min(2).max(191).optional(),
  nameEn: z.string().trim().max(191).optional().or(z.literal("")),
  status: z.enum(CCTV_STATUSES).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
}).strict();
