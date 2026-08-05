import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

export type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  requestId?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status = 400,
    public readonly errors: { field?: string; message: string }[] = [],
  ) {
    super(message);
  }
}

export function success<T>(data: T, meta?: ApiMeta, status = 200) {
  return NextResponse.json({ success: true, data, message: null, meta }, { status });
}

export function failure(
  message: string,
  status = 400,
  errors: { field?: string; message: string }[] = [],
  requestId?: string,
) {
  return NextResponse.json(
    {
      success: false,
      data: null,
      message,
      errors,
      meta: requestId ? { requestId } : undefined,
    },
    { status },
  );
}

export function handleApiError(error: unknown) {
  const requestId = randomUUID();
  if (error instanceof ApiError) {
    return failure(error.message, error.status, error.errors, requestId);
  }
  if (error instanceof z.ZodError) {
    return failure(
      "Validation failed",
      422,
      error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
      requestId,
    );
  }
  console.error(`[${requestId}] API error`, error);
  return failure("เกิดข้อผิดพลาดภายในระบบ", 500, [], requestId);
}

export async function parseBody<T>(request: Request, schema: z.ZodType<T>) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("Request body must be valid JSON", 400);
  }
  return schema.parse(body);
}

export function pageParams(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20));
  const search = url.searchParams.get("search")?.trim() || undefined;
  return { page, limit, search };
}
