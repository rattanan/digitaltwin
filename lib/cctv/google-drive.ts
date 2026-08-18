import { ApiError } from "@/lib/api/http";
import { optionalEnv } from "@/lib/env";

const DRIVE_API_BASE_URL = "https://www.googleapis.com/drive/v3";
const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const CACHE_TTL_MS = 4_500;

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  resourceKey?: string;
};

export type LatestDriveImage = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: number | null;
  resourceKey: string | null;
};

type DriveFolderReference = { id: string; resourceKey: string | null };
type CachedImage = { expiresAt: number; value: LatestDriveImage | null };

const latestImageCache = new Map<string, CachedImage>();

export function parseGoogleDriveFolderUrl(value: string): DriveFolderReference | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "drive.google.com") return null;
    const folderMatch = url.pathname.match(/^\/drive\/(?:u\/\d+\/)?folders\/([A-Za-z0-9_-]+)/);
    const id = folderMatch?.[1] ?? (url.pathname === "/open" ? url.searchParams.get("id") : null);
    if (!id || !/^[A-Za-z0-9_-]{10,}$/.test(id)) return null;
    return { id, resourceKey: url.searchParams.get("resourcekey") };
  } catch {
    return null;
  }
}

export function isGoogleDriveFolderUrl(value: string | null | undefined) {
  return Boolean(value && parseGoogleDriveFolderUrl(value));
}

function resourceKeyHeader(folder: DriveFolderReference) {
  return folder.resourceKey ? { "X-Goog-Drive-Resource-Keys": `${folder.id}/${folder.resourceKey}` } : undefined;
}

async function driveFetch(path: string, folder: DriveFolderReference, query: Record<string, string>) {
  const apiKey = optionalEnv("GOOGLE_DRIVE_API_KEY");
  if (!apiKey) throw new ApiError("ยังไม่ได้ตั้งค่า GOOGLE_DRIVE_API_KEY สำหรับอ่านภาพจาก Google Drive", 503);
  const url = new URL(`${DRIVE_API_BASE_URL}${path}`);
  Object.entries({ ...query, key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { cache: "no-store", headers: resourceKeyHeader(folder) });
  if (!response.ok) {
    const message = response.status === 403 || response.status === 404
      ? "ไม่สามารถอ่าน Google Drive folder ได้ กรุณาตรวจสอบ URL และตั้งค่าให้เปิดดูผ่านลิงก์ได้"
      : "Google Drive ไม่สามารถส่งข้อมูลภาพได้ในขณะนี้";
    throw new ApiError(message, response.status === 429 ? 429 : 502);
  }
  return response;
}

async function listChildren(folder: DriveFolderReference): Promise<DriveFile[]> {
  const response = await driveFetch("/files", folder, {
    q: `'${folder.id}' in parents and trashed = false`,
    fields: "files(id,name,mimeType,modifiedTime,size,resourceKey)",
    pageSize: "1000",
    orderBy: "name_natural desc",
    spaces: "drive",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const payload = await response.json() as { files?: DriveFile[] };
  return payload.files ?? [];
}

function datedFolders(files: DriveFile[], min: number, max: number) {
  return files
    .filter((file) => file.mimeType === FOLDER_MIME_TYPE && /^\d+$/.test(file.name))
    .map((file) => ({ file, value: Number(file.name) }))
    .filter(({ value }) => value >= min && value <= max)
    .sort((left, right) => right.value - left.value);
}

async function findLatestInDateTree(root: DriveFolderReference) {
  const years = datedFolders(await listChildren(root), 2000, 3000);
  for (const year of years) {
    const yearFolder = { id: year.file.id, resourceKey: year.file.resourceKey ?? null };
    const months = datedFolders(await listChildren(yearFolder), 1, 12);
    for (const month of months) {
      const monthFolder = { id: month.file.id, resourceKey: month.file.resourceKey ?? null };
      const days = datedFolders(await listChildren(monthFolder), 1, 31);
      for (const day of days) {
        const dayFolder = { id: day.file.id, resourceKey: day.file.resourceKey ?? null };
        const latest = (await listChildren(dayFolder))
          .filter((file) => file.mimeType.startsWith("image/") && file.modifiedTime)
          .sort((left, right) => Date.parse(right.modifiedTime!) - Date.parse(left.modifiedTime!))[0];
        if (latest) return latest;
      }
    }
  }
  return null;
}

export async function getLatestGoogleDriveImage(folderUrl: string): Promise<LatestDriveImage | null> {
  const root = parseGoogleDriveFolderUrl(folderUrl);
  if (!root) throw new ApiError("URL Google Drive folder ไม่ถูกต้อง", 422);
  const cached = latestImageCache.get(folderUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const file = await findLatestInDateTree(root);
  const value = file?.modifiedTime ? {
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    modifiedTime: file.modifiedTime,
    size: file.size ? Number(file.size) : null,
    resourceKey: file.resourceKey ?? null,
  } : null;
  latestImageCache.set(folderUrl, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function downloadGoogleDriveImage(file: LatestDriveImage) {
  return driveFetch(`/files/${encodeURIComponent(file.id)}`, { id: file.id, resourceKey: file.resourceKey }, {
    alt: "media",
    supportsAllDrives: "true",
  });
}
