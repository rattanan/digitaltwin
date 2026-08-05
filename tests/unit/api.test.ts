import { describe, expect, it } from "vitest";
import { ApiError, handleApiError } from "@/lib/api/http";

describe("API response contract", () => {
  it("returns the standard error shape", async () => {
    const response = handleApiError(new ApiError("Not allowed", 403));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body).toMatchObject({ success: false, data: null, message: "Not allowed", errors: [] });
  });
});
