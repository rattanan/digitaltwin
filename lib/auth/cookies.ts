import type { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/tokens";
import { envNumber } from "@/lib/env";

const baseCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  response.cookies.set({
    ...baseCookie,
    name: ACCESS_COOKIE,
    value: accessToken,
    maxAge: envNumber("ACCESS_TOKEN_TTL_SECONDS", 900),
  });
  response.cookies.set({
    ...baseCookie,
    name: REFRESH_COOKIE,
    value: refreshToken,
    maxAge: envNumber("REFRESH_TOKEN_TTL_SECONDS", 60 * 60 * 24 * 30),
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set({ ...baseCookie, name: ACCESS_COOKIE, value: "", maxAge: 0 });
  response.cookies.set({ ...baseCookie, name: REFRESH_COOKIE, value: "", maxAge: 0 });
}
