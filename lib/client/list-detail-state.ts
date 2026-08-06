export function sameStringFilters(previous: readonly string[], current: readonly string[]) {
  return previous.length === current.length && previous.every((value, index) => value === current[index]);
}

export function retainSelectedId(currentId: string | null, visibleIds: readonly string[]) {
  return currentId ?? visibleIds[0] ?? null;
}
