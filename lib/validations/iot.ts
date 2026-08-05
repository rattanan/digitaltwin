import { z } from "zod";
import { IOT_STATUSES } from "@/lib/iot/types";

export const iotUpdateSchema = z.object({
  nameTh: z.string().trim().min(2).max(191).optional(),
  status: z.enum(IOT_STATUSES).optional(),
}).strict();

export const iotReadingSchema = z.object({
  deviceId: z.string().trim().min(1).max(80),
  metricKey: z.string().trim().min(1).max(80),
  value: z.number().finite(),
  unit: z.string().trim().max(40).optional().or(z.literal("")),
  recordedAt: z.coerce.date().optional(),
  idempotencyKey: z.string().trim().max(191).optional().or(z.literal("")),
}).strict();
