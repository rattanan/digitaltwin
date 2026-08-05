import { z } from "zod";

export const userCreateSchema = z.object({
  username: z.string().trim().min(3).max(120),
  displayName: z.string().trim().min(2).max(191),
  email: z.string().trim().email().max(191).optional().or(z.literal("")),
  password: z.string().min(8).max(200),
  agencyId: z.string().uuid().optional().nullable(),
  roleIds: z.array(z.string().uuid()).min(1),
});

export const userUpdateSchema = userCreateSchema
  .omit({ password: true })
  .extend({
    password: z.string().min(8).max(200).optional().or(z.literal("")),
    isActive: z.boolean().optional(),
  });

export const roleCreateSchema = z.object({
  code: z.string().trim().min(2).max(80).regex(/^[A-Z0-9_]+$/),
  nameTh: z.string().trim().min(2).max(191),
  nameEn: z.string().trim().min(2).max(191),
  description: z.string().max(500).optional().or(z.literal("")),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export const roleUpdateSchema = roleCreateSchema.partial();

export const agencySchema = z.object({
  code: z.string().trim().min(2).max(80).regex(/^[A-Z0-9_-]+$/),
  nameTh: z.string().trim().min(2).max(191),
  nameEn: z.string().trim().max(191).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  contactName: z.string().max(191).optional().or(z.literal("")),
  contactPhone: z.string().max(80).optional().or(z.literal("")),
  contactEmail: z.string().email().max(191).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const areaSchema = z.object({
  code: z.string().trim().min(1).max(20),
  nameTh: z.string().trim().min(2).max(191),
  nameEn: z.string().trim().max(191).optional().or(z.literal("")),
  parentId: z.string().uuid().optional().nullable(),
  areaSqKm: z.number().nonnegative().optional().nullable(),
  population: z.number().int().nonnegative().optional().nullable(),
  households: z.number().int().nonnegative().optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});
