import { ApiError, handleApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { downloadGoogleDriveImage, getLatestGoogleDriveImage, isGoogleDriveFolderUrl } from "@/lib/cctv/google-drive";
import { prisma } from "@/lib/db/prisma";

type CctvContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: CctvContext) {
  try {
    await requireApiAuth("cctv.read");
    const { id } = await context.params;
    const camera = await prisma.cctvCamera.findFirst({
      where: { deletedAt: null, OR: [{ id }, { publicId: id }] },
      select: { nfsFolderPath: true },
    });
    if (!camera) throw new ApiError("ไม่พบกล้อง CCTV", 404);
    if (!isGoogleDriveFolderUrl(camera.nfsFolderPath)) throw new ApiError("กล้องนี้ไม่ได้เชื่อมต่อ Google Drive", 404);

    const image = await getLatestGoogleDriveImage(camera.nfsFolderPath!);
    if (!image) throw new ApiError("ยังไม่พบไฟล์ภาพในโฟลเดอร์ ปี/เดือน/วัน", 404);
    const driveResponse = await downloadGoogleDriveImage(image);
    const headers = new Headers({
      "content-type": driveResponse.headers.get("content-type") ?? image.mimeType,
      "cache-control": "private, no-cache, max-age=0, must-revalidate",
      "last-modified": new Date(image.modifiedTime).toUTCString(),
      "x-content-type-options": "nosniff",
    });
    const contentLength = driveResponse.headers.get("content-length") ?? (image.size === null ? null : String(image.size));
    if (contentLength) headers.set("content-length", contentLength);
    return new Response(driveResponse.body, {
      headers,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
