import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createDemoCctvDetail, createDemoCctvOverview } from "@/lib/cctv/demo-data";
import {
  CCTV_EVENT_LABELS,
  CCTV_STATUS_LABELS,
  CCTV_STATUSES,
  type CctvAiEvent,
  type CctvCameraSummary,
  type CctvDetail,
  type CctvOverview,
  type CctvSnapshotSummary,
  type CctvStatus,
} from "@/lib/cctv/types";
import { decimalToNumber } from "@/lib/utils";

export type CctvListOptions = {
  page?: number;
  limit?: number;
  search?: string;
  status?: CctvStatus;
  districtId?: string;
};

function normalizeStatus(value: string): CctvStatus {
  return CCTV_STATUSES.includes(value as CctvStatus) ? value as CctvStatus : "DEGRADED";
}

function serializeSnapshot(snapshot: { id: bigint; capturedAt: Date; fileModifiedAt: Date | null; fileSizeBytes: bigint | null }): CctvSnapshotSummary {
  return {
    id: snapshot.id.toString(),
    capturedAt: snapshot.capturedAt.toISOString(),
    fileModifiedAt: snapshot.fileModifiedAt?.toISOString() ?? null,
    fileSizeBytes: snapshot.fileSizeBytes === null ? null : Number(snapshot.fileSizeBytes),
  };
}

function serializeAiEvent(event: { id: bigint; eventType: string; confidence: unknown; detectedAt: Date; verification: string }): CctvAiEvent {
  return {
    id: event.id.toString(),
    eventType: event.eventType,
    eventLabel: CCTV_EVENT_LABELS[event.eventType] ?? event.eventType,
    confidence: decimalToNumber(event.confidence),
    detectedAt: event.detectedAt.toISOString(),
    verification: event.verification,
  };
}

async function findCctvRows(where: Prisma.CctvCameraWhereInput, page: number, limit: number) {
  return prisma.cctvCamera.findMany({
    where,
    select: {
      id: true,
      publicId: true,
      cameraCode: true,
      nameTh: true,
      nameEn: true,
      status: true,
      lastImageAt: true,
      lastHeartbeat: true,
      latitude: true,
      longitude: true,
      agency: { select: { nameTh: true } },
      location: { select: { nameTh: true } },
      district: { select: { id: true, nameTh: true } },
      subdistrict: { select: { nameTh: true } },
      snapshots: {
        orderBy: { capturedAt: "desc" },
        take: 1,
        select: { id: true, capturedAt: true, fileModifiedAt: true, fileSizeBytes: true },
      },
      _count: { select: { snapshots: true, aiResults: true } },
    },
    orderBy: [{ status: "asc" }, { cameraCode: "asc" }],
    skip: (page - 1) * limit,
    take: limit,
  });
}

type CctvRow = Awaited<ReturnType<typeof findCctvRows>>[number];

function serializeCamera(camera: CctvRow): CctvCameraSummary {
  const status = normalizeStatus(camera.status);
  return {
    id: camera.id,
    publicId: camera.publicId,
    cameraCode: camera.cameraCode,
    nameTh: camera.nameTh,
    nameEn: camera.nameEn,
    status,
    statusLabel: CCTV_STATUS_LABELS[status],
    lastImageAt: camera.lastImageAt?.toISOString() ?? null,
    lastHeartbeat: camera.lastHeartbeat?.toISOString() ?? null,
    latitude: camera.latitude === null ? null : decimalToNumber(camera.latitude),
    longitude: camera.longitude === null ? null : decimalToNumber(camera.longitude),
    agencyName: camera.agency?.nameTh ?? null,
    locationName: camera.location?.nameTh ?? null,
    district: camera.district,
    subdistrictName: camera.subdistrict?.nameTh ?? null,
    latestSnapshot: camera.snapshots[0] ? serializeSnapshot(camera.snapshots[0]) : null,
    snapshotCount: camera._count.snapshots,
    aiEventCount: camera._count.aiResults,
  };
}

function buildWhere(provinceId: string, options: CctvListOptions): Prisma.CctvCameraWhereInput {
  const where: Prisma.CctvCameraWhereInput = { provinceId, deletedAt: null };
  if (options.status) where.status = options.status;
  if (options.districtId) where.districtId = options.districtId;
  const search = options.search?.trim();
  if (search) {
    where.OR = [
      { cameraCode: { contains: search } },
      { nameTh: { contains: search } },
      { nameEn: { contains: search } },
    ];
  }
  return where;
}

export async function getCctvOverview(options: CctvListOptions = {}): Promise<CctvOverview> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  try {
    const province = await prisma.province.findFirst({
      where: { deletedAt: null },
      select: { code: true, nameTh: true, id: true },
      orderBy: { nameTh: "asc" },
    });
    if (!province) return createDemoCctvOverview({ ...options, page, limit });

    const where = buildWhere(province.id, options);
    const overallWhere: Prisma.CctvCameraWhereInput = { provinceId: province.id, deletedAt: null };
    const [total, items, online, offline, maintenance, degraded, districts] = await Promise.all([
      prisma.cctvCamera.count({ where }),
      findCctvRows(where, page, limit),
      prisma.cctvCamera.count({ where: { ...overallWhere, status: "ONLINE" } }),
      prisma.cctvCamera.count({ where: { ...overallWhere, status: "OFFLINE" } }),
      prisma.cctvCamera.count({ where: { ...overallWhere, status: "MAINTENANCE" } }),
      prisma.cctvCamera.count({ where: { ...overallWhere, status: "DEGRADED" } }),
      prisma.district.findMany({
        where: { provinceId: province.id, deletedAt: null },
        select: {
          id: true,
          code: true,
          nameTh: true,
          _count: { select: { cctvCameras: { where: { deletedAt: null } } } },
        },
        orderBy: { nameTh: "asc" },
      }),
    ]);

    return {
      province: { code: province.code, nameTh: province.nameTh },
      items: items.map(serializeCamera),
      summary: { total: online + offline + maintenance + degraded, online, offline, maintenance, degraded },
      districts: districts.map((district) => ({ id: district.id, code: district.code, nameTh: district.nameTh, cameraCount: district._count.cctvCameras })),
      pagination: { page, limit, total },
      freshness: new Date().toISOString(),
      isDemo: false,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("CCTV database query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return createDemoCctvOverview({ ...options, page, limit });
  }
}

async function findCctvDetailRow(id: string) {
  return prisma.cctvCamera.findFirst({
    where: { deletedAt: null, OR: [{ id }, { publicId: id }] },
    select: {
      id: true,
      publicId: true,
      cameraCode: true,
      nameTh: true,
      nameEn: true,
      status: true,
      lastImageAt: true,
      lastHeartbeat: true,
      latitude: true,
      longitude: true,
      agency: { select: { nameTh: true } },
      location: { select: { nameTh: true } },
      district: { select: { id: true, nameTh: true } },
      subdistrict: { select: { nameTh: true } },
      snapshots: {
        orderBy: { capturedAt: "desc" },
        take: 12,
        select: { id: true, capturedAt: true, fileModifiedAt: true, fileSizeBytes: true },
      },
      aiResults: {
        orderBy: { detectedAt: "desc" },
        take: 12,
        select: { id: true, eventType: true, confidence: true, detectedAt: true, verification: true },
      },
      _count: { select: { snapshots: true, aiResults: true } },
    },
  });
}

type CctvDetailRow = NonNullable<Awaited<ReturnType<typeof findCctvDetailRow>>>;

function serializeDetail(camera: CctvDetailRow): CctvDetail {
  const status = normalizeStatus(camera.status);
  const summary: CctvCameraSummary = {
    id: camera.id,
    publicId: camera.publicId,
    cameraCode: camera.cameraCode,
    nameTh: camera.nameTh,
    nameEn: camera.nameEn,
    status,
    statusLabel: CCTV_STATUS_LABELS[status],
    lastImageAt: camera.lastImageAt?.toISOString() ?? null,
    lastHeartbeat: camera.lastHeartbeat?.toISOString() ?? null,
    latitude: camera.latitude === null ? null : decimalToNumber(camera.latitude),
    longitude: camera.longitude === null ? null : decimalToNumber(camera.longitude),
    agencyName: camera.agency?.nameTh ?? null,
    locationName: camera.location?.nameTh ?? null,
    district: camera.district,
    subdistrictName: camera.subdistrict?.nameTh ?? null,
    latestSnapshot: camera.snapshots[0] ? serializeSnapshot(camera.snapshots[0]) : null,
    snapshotCount: camera._count.snapshots,
    aiEventCount: camera._count.aiResults,
  };
  return {
    ...summary,
    snapshots: camera.snapshots.map(serializeSnapshot),
    aiEvents: camera.aiResults.map(serializeAiEvent),
  };
}

export async function getCctvDetail(id: string): Promise<CctvDetail | null> {
  try {
    const camera = await findCctvDetailRow(id);
    return camera ? serializeDetail(camera) : null;
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("CCTV detail query unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return createDemoCctvDetail(id);
  }
}
