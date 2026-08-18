import { ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { isValidIotIngestApiKey } from "@/lib/iot/api-key";

type IotIngestAuth = {
  actorId?: string;
  method: "api-key" | "session";
};

export async function requireIotIngestAuth(request: Request): Promise<IotIngestAuth> {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    const auth = await requireApiAuth("iot.manage");
    return { actorId: auth.user.id, method: "session" };
  }

  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new ApiError("Authorization header ต้องอยู่ในรูปแบบ Bearer <API_KEY>", 401);
  }

  const configuredKey = process.env.IOT_INGEST_API_KEY?.trim();
  if (!configuredKey) {
    throw new ApiError("ระบบยังไม่ได้ตั้งค่า IOT ingestion API key", 503);
  }
  if (configuredKey.length < 32) {
    throw new ApiError("IOT ingestion API key ต้องมีความยาวอย่างน้อย 32 ตัวอักษร", 503);
  }

  if (!isValidIotIngestApiKey(match[1].trim(), configuredKey)) {
    throw new ApiError("IoT API key ไม่ถูกต้อง", 401);
  }

  return { method: "api-key" };
}
