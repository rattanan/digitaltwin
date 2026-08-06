export type BoundaryGeometry = {
  type: "Polygon" | "MultiPolygon";
  coordinates: unknown;
};

type Position = [number, number];

function asPosition(value: unknown): Position | null {
  if (!Array.isArray(value) || value.length < 2 || typeof value[0] !== "number" || typeof value[1] !== "number") return null;
  return [value[0], value[1]];
}

function pointOnSegment(point: Position, start: Position, end: Position) {
  const [x, y] = point;
  const [startX, startY] = start;
  const [endX, endY] = end;
  const crossProduct = (y - startY) * (endX - startX) - (x - startX) * (endY - startY);
  if (Math.abs(crossProduct) > 1e-10) return false;
  return x >= Math.min(startX, endX) && x <= Math.max(startX, endX) && y >= Math.min(startY, endY) && y <= Math.max(startY, endY);
}

function pointInRing(point: Position, value: unknown) {
  if (!Array.isArray(value) || value.length < 3) return false;
  let inside = false;

  for (let index = 0, previousIndex = value.length - 1; index < value.length; previousIndex = index++) {
    const current = asPosition(value[index]);
    const previous = asPosition(value[previousIndex]);
    if (!current || !previous) continue;
    if (pointOnSegment(point, previous, current)) return true;

    const crossesLatitude = (current[1] > point[1]) !== (previous[1] > point[1]);
    const intersectionLongitude = ((previous[0] - current[0]) * (point[1] - current[1])) / (previous[1] - current[1]) + current[0];
    if (crossesLatitude && point[0] < intersectionLongitude) inside = !inside;
  }

  return inside;
}

function pointInPolygon(point: Position, value: unknown) {
  if (!Array.isArray(value) || !pointInRing(point, value[0])) return false;
  return !value.slice(1).some((hole) => pointInRing(point, hole));
}

export function pointInBoundaryGeometry(point: Position, geometry: BoundaryGeometry) {
  if (!Array.isArray(geometry.coordinates)) return false;
  if (geometry.type === "Polygon") return pointInPolygon(point, geometry.coordinates);
  return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
}
