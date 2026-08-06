const CCTV_PREVIEW_IMAGES: Record<string, string> = {
  "001": "/images/cctv/cam-001.png",
  "002": "/images/cctv/cam-002.png",
  "003": "/images/cctv/cam-003.png",
  "004": "/images/cctv/cam-004.png",
  "005": "/images/cctv/cam-005.png",
  "006": "/images/cctv/cam-006.png",
  "007": "/images/cctv/cam-007.png",
  "008": "/images/cctv/cam-008.png",
};

export function getCctvPreviewImage(cameraCode: string) {
  const cameraNumber = cameraCode.match(/(\d{3})$/)?.[1];
  return cameraNumber ? CCTV_PREVIEW_IMAGES[cameraNumber] ?? null : null;
}
