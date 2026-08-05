import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "กรุณาระบุชื่อผู้ใช้งาน").max(120),
  password: z.string().min(1, "กรุณาระบุรหัสผ่าน").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
