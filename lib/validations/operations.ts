import { z } from "zod";
import { ALERT_SEVERITIES, ALERT_SOURCES, ALERT_STATUSES, INCIDENT_CATEGORIES, INCIDENT_STATUSES } from "@/lib/operations/types";

const noteSchema = z.string().trim().max(1000).optional();

export const alertFilterSchema = z.object({
  status: z.enum(ALERT_STATUSES).optional(),
  severity: z.enum(ALERT_SEVERITIES).optional(),
  source: z.enum(ALERT_SOURCES).optional(),
  districtId: z.string().trim().min(1).max(80).optional(),
});

export const alertUpdateSchema = z.object({
  status: z.enum(ALERT_STATUSES),
  note: noteSchema,
}).strict();

export const incidentFilterSchema = z.object({
  status: z.enum(INCIDENT_STATUSES).optional(),
  severity: z.enum(ALERT_SEVERITIES).optional(),
  category: z.enum(INCIDENT_CATEGORIES).optional(),
  districtId: z.string().trim().min(1).max(80).optional(),
});

export const incidentUpdateSchema = z.object({
  status: z.enum(INCIDENT_STATUSES),
  note: noteSchema,
  resolution: z.string().trim().max(1200).optional(),
}).strict();

export const incidentCreateSchema = z.object({
  title: z.string().trim().min(2).max(191),
  description: z.string().trim().max(1200).optional(),
  category: z.enum(INCIDENT_CATEGORIES),
  severity: z.enum(ALERT_SEVERITIES),
  dueAt: z.coerce.date().optional(),
  alertId: z.string().trim().min(1).max(80).optional(),
  cameraId: z.string().trim().min(1).max(80).optional(),
  deviceId: z.string().trim().min(1).max(80).optional(),
  districtId: z.string().trim().min(1).max(80).optional(),
  note: noteSchema,
}).strict();
