import { NextResponse } from "next/server";
import { ApiError, handleApiError, success } from "@/lib/api/http";
import { setAuthCookies } from "@/lib/auth/cookies";
import { getRefreshCookie, requestMetadata, rotateRefreshToken } from "@/lib/auth/session";
import { publicUser } from "@/lib/auth/guards";

export async function POST(request: Request) {
  try {
    const rawRefreshToken = await getRefreshCookie();
    if (!rawRefreshToken) return handleApiError(new ApiError("กรุณาเข้าสู่ระบบใหม่", 401));
    const tokens = await rotateRefreshToken(rawRefreshToken, requestMetadata(request));
    const response = NextResponse.json(success(publicUser(tokens.user)), { status: 200 });
    setAuthCookies(response, tokens.accessToken, tokens.refreshToken);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
