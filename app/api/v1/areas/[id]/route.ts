import { handleApiError, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { areaSchema } from "@/lib/validations/admin";

type AreaContext = { params: Promise<{ id: string }> };
type AreaType = "province" | "district" | "subdistrict" | "village";

function getType(request: Request): AreaType {
  const value = new URL(request.url).searchParams.get("type");
  if (value === "district" || value === "subdistrict" || value === "village") return value;
  return "province";
}

async function findArea(type: AreaType, id: string) {
  if (type === "province") return prisma.province.findFirst({ where: { id, deletedAt: null } });
  if (type === "district") return prisma.district.findFirst({ where: { id, deletedAt: null } });
  if (type === "subdistrict") return prisma.subdistrict.findFirst({ where: { id, deletedAt: null } });
  return prisma.village.findFirst({ where: { id, deletedAt: null } });
}

export async function GET(request: Request, context: AreaContext) {
  try {
    await requireApiAuth("areas.read");
    const type = getType(request);
    const { id } = await context.params;
    const area = await findArea(type, id);
    if (!area) throw new ApiError("ไม่พบพื้นที่ปกครอง", 404);
    return success(area);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: AreaContext) {
  try {
    const auth = await requireApiAuth("areas.manage");
    const type = getType(request);
    const { id } = await context.params;
    const existing = await findArea(type, id);
    if (!existing) throw new ApiError("ไม่พบพื้นที่ปกครอง", 404);
    const input = await parseBody(request, areaSchema.partial());
    const data = { code: input.code, nameTh: input.nameTh, nameEn: input.nameEn, areaSqKm: input.areaSqKm, population: input.population, households: input.households, latitude: input.latitude, longitude: input.longitude };
    const area = type === "province"
      ? await prisma.province.update({ where: { id }, data })
      : type === "district"
        ? await prisma.district.update({ where: { id }, data: { ...data, ...(input.parentId ? { provinceId: input.parentId } : {}) } })
        : type === "subdistrict"
          ? await prisma.subdistrict.update({ where: { id }, data: { ...data, ...(input.parentId ? { districtId: input.parentId } : {}) } })
          : await prisma.village.update({ where: { id }, data: { ...data, ...(input.parentId ? { subdistrictId: input.parentId } : {}) } });
    await writeAuditLog({ actorId: auth.user.id, action: "UPDATE", module: "areas", entityType: type, entityId: id, beforeData: { code: existing.code, nameTh: existing.nameTh }, afterData: { code: area.code, nameTh: area.nameTh } });
    return success(area);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: AreaContext) {
  try {
    const auth = await requireApiAuth("areas.manage");
    const type = getType(request);
    const { id } = await context.params;
    const existing = await findArea(type, id);
    if (!existing) throw new ApiError("ไม่พบพื้นที่ปกครอง", 404);
    if (type === "province") await prisma.province.update({ where: { id }, data: { deletedAt: new Date() } });
    else if (type === "district") await prisma.district.update({ where: { id }, data: { deletedAt: new Date() } });
    else if (type === "subdistrict") await prisma.subdistrict.update({ where: { id }, data: { deletedAt: new Date() } });
    else await prisma.village.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAuditLog({ actorId: auth.user.id, action: "DELETE", module: "areas", entityType: type, entityId: id, beforeData: { code: existing.code, nameTh: existing.nameTh } });
    return success({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
