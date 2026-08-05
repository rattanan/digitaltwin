import { handleApiError, pageParams, parseBody, success, ApiError } from "@/lib/api/http";
import { requireApiAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/audit/logger";
import { areaSchema } from "@/lib/validations/admin";
import { decimalToNumber } from "@/lib/utils";

const areaTypes = ["province", "district", "subdistrict", "village"] as const;
type AreaType = (typeof areaTypes)[number];

function areaType(value: string | null): AreaType {
  if (value && areaTypes.includes(value as AreaType)) return value as AreaType;
  return "province";
}

function serializeArea(area: { id: string; publicId: string; code: string; nameTh: string; nameEn: string | null; areaSqKm: unknown; population: number | null; households: number | null; deletedAt: Date | null; province?: { nameTh: string } | null; district?: { nameTh: string } | null; subdistrict?: { nameTh: string } | null }) {
  return { id: area.id, publicId: area.publicId, code: area.code, nameTh: area.nameTh, nameEn: area.nameEn, areaSqKm: decimalToNumber(area.areaSqKm), population: area.population, households: area.households, parentName: area.province?.nameTh ?? area.district?.nameTh ?? area.subdistrict?.nameTh ?? null, deletedAt: area.deletedAt };
}

export async function GET(request: Request) {
  try {
    await requireApiAuth("areas.read");
    const { page, limit, search } = pageParams(request);
    const type = areaType(new URL(request.url).searchParams.get("type"));
    const where = { deletedAt: null, ...(search ? { OR: [{ code: { contains: search } }, { nameTh: { contains: search } }, { nameEn: { contains: search } }] } : {}) };
    const result = type === "province"
      ? await Promise.all([prisma.province.count({ where }), prisma.province.findMany({ where, orderBy: { nameTh: "asc" }, skip: (page - 1) * limit, take: limit })])
      : type === "district"
        ? await Promise.all([prisma.district.count({ where }), prisma.district.findMany({ where, include: { province: { select: { nameTh: true } } }, orderBy: { nameTh: "asc" }, skip: (page - 1) * limit, take: limit })])
        : type === "subdistrict"
          ? await Promise.all([prisma.subdistrict.count({ where }), prisma.subdistrict.findMany({ where, include: { district: { select: { nameTh: true } } }, orderBy: { nameTh: "asc" }, skip: (page - 1) * limit, take: limit })])
          : await Promise.all([prisma.village.count({ where }), prisma.village.findMany({ where, include: { subdistrict: { select: { nameTh: true } } }, orderBy: { nameTh: "asc" }, skip: (page - 1) * limit, take: limit })]);
    return success({ type, items: result[1].map(serializeArea) }, { page, limit, total: result[0] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiAuth("areas.manage");
    const type = areaType(new URL(request.url).searchParams.get("type"));
    const input = await parseBody(request, areaSchema);
    let created: { id: string; nameTh: string };
    if (type === "province") {
      created = await prisma.province.create({ data: { code: input.code, nameTh: input.nameTh, nameEn: input.nameEn || null, areaSqKm: input.areaSqKm ?? null, population: input.population ?? null, households: input.households ?? null, latitude: input.latitude ?? null, longitude: input.longitude ?? null } });
    } else if (type === "district") {
      if (!input.parentId) throw new ApiError("กรุณาระบุจังหวัดต้นสังกัด", 422);
      created = await prisma.district.create({ data: { provinceId: input.parentId, code: input.code, nameTh: input.nameTh, nameEn: input.nameEn || null, areaSqKm: input.areaSqKm ?? null, population: input.population ?? null, households: input.households ?? null, latitude: input.latitude ?? null, longitude: input.longitude ?? null } });
    } else if (type === "subdistrict") {
      if (!input.parentId) throw new ApiError("กรุณาระบุอำเภอต้นสังกัด", 422);
      created = await prisma.subdistrict.create({ data: { districtId: input.parentId, code: input.code, nameTh: input.nameTh, nameEn: input.nameEn || null, areaSqKm: input.areaSqKm ?? null, population: input.population ?? null, households: input.households ?? null, latitude: input.latitude ?? null, longitude: input.longitude ?? null } });
    } else {
      if (!input.parentId) throw new ApiError("กรุณาระบุตำบลต้นสังกัด", 422);
      created = await prisma.village.create({ data: { subdistrictId: input.parentId, code: input.code, nameTh: input.nameTh, nameEn: input.nameEn || null, areaSqKm: input.areaSqKm ?? null, population: input.population ?? null, households: input.households ?? null, latitude: input.latitude ?? null, longitude: input.longitude ?? null } });
    }
    await writeAuditLog({ actorId: auth.user.id, action: "CREATE", module: "areas", entityType: type, entityId: created.id, afterData: { code: input.code, nameTh: input.nameTh } });
    return success(created, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
