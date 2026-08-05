import { handleApiError, success } from "@/lib/api/http";
import { hasPermission } from "@/lib/auth/access";
import { requireApiAuth } from "@/lib/auth/guards";
import { getMapSnapshot } from "@/lib/map/queries";

export async function GET() {
  try {
    const auth = await requireApiAuth("areas.read");
    const snapshot = await getMapSnapshot({ includeCameras: hasPermission(auth.user, "cctv.read") });
    return success(snapshot, { total: snapshot.areas.length + snapshot.markers.length });
  } catch (error) {
    return handleApiError(error);
  }
}
