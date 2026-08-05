import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/tokens";
import { loginSchema } from "@/lib/validations/auth";

describe("authentication primitives", () => {
  it("hashes and verifies passwords without storing the raw value", async () => {
    const password = "correct-horse-battery-staple";
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("creates deterministic one-way token hashes", () => {
    expect(hashToken("refresh-token")).toBe(hashToken("refresh-token"));
    expect(hashToken("refresh-token")).not.toBe(hashToken("another-token"));
    expect(hashToken("refresh-token")).toHaveLength(64);
  });

  it("validates login input", () => {
    expect(loginSchema.safeParse({ username: "superadmin", password: "secret" }).success).toBe(true);
    expect(loginSchema.safeParse({ username: "", password: "" }).success).toBe(false);
  });
});
