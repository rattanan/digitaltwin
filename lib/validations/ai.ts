import { z } from "zod";
import { AI_MODULES } from "@/lib/ai/types";

export const aiConversationCreateSchema = z.object({
  title: z.string().trim().min(1).max(191).optional(),
  contextModule: z.enum(AI_MODULES).optional(),
}).strict();

export const aiConversationUpdateSchema = z.object({
  title: z.string().trim().min(1).max(191).optional(),
  isPinned: z.boolean().optional(),
}).strict();

export const aiMessageSchema = z.object({
  content: z.string().trim().min(2).max(4000),
}).strict();
