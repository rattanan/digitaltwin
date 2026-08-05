export function serializeJsonText(value: unknown): string | undefined {
  if (value === undefined) return undefined;

  return JSON.stringify(value, (_, item) =>
    typeof item === "bigint" ? item.toString() : item,
  );
}

export function parseJsonText<T>(value: string | null | undefined): T | null {
  if (value === null || value === undefined || value === "") return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
