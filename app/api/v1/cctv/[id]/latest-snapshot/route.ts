import { ApiError, handleApiError, success } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { getLatestGoogleDriveImage, isGoogleDriveFolderUrl } from "@/lib/cctv/google-drive";
import { prisma } from "@/lib/db/prisma";

type CctvContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: CctvContext) {
  try {
    await requireApiAuth("cctv.read");
    const { id } = await context.params;
    const camera = await prisma.cctvCamera.findFirst({
      where: { deletedAt: null, OR: [{ id }, { publicId: id }] },
      select: { id: true, nfsFolderPath: true },
    });
    if (!camera) throw new ApiError("ไม่พบกล้อง CCTV", 404);
    if (!isGoogleDriveFolderUrl(camera.nfsFolderPath)) throw new ApiError("กล้องนี้ไม่ได้เชื่อมต่อ Google Drive", 404);

    const image = await getLatestGoogleDriveImage(camera.nfsFolderPath!);
    return success(image ? {
      imageUrl: `/api/v1/cctv/${camera.id}/latest-image?version=${encodeURIComponent(image.modifiedTime)}`,
      capturedAt: image.modifiedTime,
      fileName: image.name,
      fileSizeBytes: image.size,
    } : null);
  } catch (error) {
    return handleApiError(error);
  }
}
