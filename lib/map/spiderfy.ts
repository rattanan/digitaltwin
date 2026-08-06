type SpiderfyOptions = {
  count: number;
  anchorX: number;
  anchorY: number;
  viewportWidth: number;
  viewportHeight: number;
  padding?: number;
};

export type SpiderfyPoint = {
  x: number;
  y: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function boundedCenter(anchor: number, viewportSize: number, outerRadius: number, padding: number) {
  const minimum = padding + outerRadius;
  const maximum = viewportSize - padding - outerRadius;
  return minimum <= maximum ? clamp(anchor, minimum, maximum) : viewportSize / 2;
}

export function createSpiderfyPoints({ count, anchorX, anchorY, viewportWidth, viewportHeight, padding = 52 }: SpiderfyOptions): SpiderfyPoint[] {
  if (count <= 0) return [];

  const ringCount = Math.ceil(count / 12);
  const baseSize = Math.floor(count / ringCount);
  const remainder = count % ringCount;
  const ringSizes = Array.from({ length: ringCount }, (_, index) => baseSize + (index >= ringCount - remainder ? 1 : 0));
  const desiredRadii = ringCount === 1
    ? [Math.max(76, count * 10)]
    : ringSizes.map((_, index) => 92 + index * 68);
  const desiredOuterRadius = desiredRadii.at(-1) ?? 76;
  const availableRadius = Math.max(48, Math.min((viewportWidth - padding * 2) / 2, (viewportHeight - padding * 2) / 2));
  const scale = Math.min(1, availableRadius / desiredOuterRadius);
  const radii = desiredRadii.map((radius) => radius * scale);
  const outerRadius = radii.at(-1) ?? 48;
  const centerX = boundedCenter(anchorX, viewportWidth, outerRadius, padding);
  const centerY = boundedCenter(anchorY, viewportHeight, outerRadius, padding);

  return ringSizes.flatMap((ringSize, ringIndex) => {
    const radius = radii[ringIndex];
    const angleOffset = -Math.PI / 2 + (ringIndex % 2 === 1 ? Math.PI / ringSize : 0);
    return Array.from({ length: ringSize }, (_, itemIndex) => {
      const angle = angleOffset + (itemIndex * Math.PI * 2) / ringSize;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });
  });
}
