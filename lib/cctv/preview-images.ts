const CCTV_PREVIEW_IMAGES = [
  "/images/cctv/cam-001.png",
  "/images/cctv/cam-002.png",
  "/images/cctv/cam-003.png",
  "/images/cctv/cam-004.png",
  "/images/cctv/cam-005.png",
  "/images/cctv/cam-006.png",
  "/images/cctv/cam-007.png",
  "/images/cctv/cam-008.png",
] as const;

function hashCameraCode(cameraCode: string) {
  return Array.from(cameraCode).reduce((hash, character) => ((hash * 31) + character.charCodeAt(0)) >>> 0, 0);
}

export function getCctvPreviewImage(cameraCode: string) {
  const cameraNumber = cameraCode.match(/(\d{3})$/)?.[1];
  const directIndex = cameraNumber ? Number(cameraNumber) - 1 : -1;
  if (directIndex >= 0 && directIndex < CCTV_PREVIEW_IMAGES.length) return CCTV_PREVIEW_IMAGES[directIndex];
  return CCTV_PREVIEW_IMAGES[hashCameraCode(cameraCode) % CCTV_PREVIEW_IMAGES.length];
}
