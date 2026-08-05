import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getDashboardSummary } from "@/lib/dashboard/queries";
import { createDemoAiConversation, createDemoAiContext, createDemoAiWorkspace, createDemoSuggestedQuestions } from "@/lib/ai/demo-data";
import {
  AI_MODULES,
  type AiContextSnapshot,
  type AiConversationDetail,
  type AiConversationSummary,
  type AiHighlight,
  type AiMessage,
  type AiMessageRole,
  type AiMessageSource,
  type AiModule,
  type AiSuggestedQuestion,
  type AiWorkspace,
} from "@/lib/ai/types";
import { getAlertOverview } from "@/lib/operations/queries";
import { getIncidentOverview } from "@/lib/operations/queries";
import { getCctvOverview } from "@/lib/cctv/queries";
import { getIotOverview } from "@/lib/iot/queries";

type QueryResult<T> = { data: T; isDemo: boolean };

function isAiModule(value: string | null): value is AiModule {
  return Boolean(value && AI_MODULES.includes(value as AiModule));
}

function normalizeModule(value: string | null): AiModule | null {
  return isAiModule(value) ? value : null;
}

function normalizeRole(value: string): AiMessageRole {
  return value === "USER" || value === "SYSTEM" ? value : "ASSISTANT";
}

function normalizeMessageStatus(value: string): AiMessage["status"] {
  return value === "PENDING" || value === "ERROR" ? value : "COMPLETED";
}

const conversationSelect = {
  id: true,
  publicId: true,
  title: true,
  contextModule: true,
  lastMessageAt: true,
  isPinned: true,
  updatedAt: true,
  _count: { select: { messages: true } },
} satisfies Prisma.AiConversationSelect;

async function findConversations(userId: string) {
  return prisma.aiConversation.findMany({
    where: { userId, deletedAt: null },
    select: conversationSelect,
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    take: 50,
  });
}

type ConversationRow = Awaited<ReturnType<typeof findConversations>>[number];

function serializeConversation(row: ConversationRow): AiConversationSummary {
  return {
    id: row.id,
    publicId: row.publicId,
    title: row.title,
    contextModule: normalizeModule(row.contextModule),
    lastMessageAt: row.lastMessageAt?.toISOString() ?? null,
    isPinned: row.isPinned,
    updatedAt: row.updatedAt.toISOString(),
    messageCount: row._count.messages,
  };
}

export async function getAiConversations(userId: string): Promise<QueryResult<AiConversationSummary[]>> {
  try {
    const rows = await findConversations(userId);
    return { data: rows.map(serializeConversation), isDemo: false };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("AI conversations unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    const demo = createDemoAiWorkspace(userId);
    return { data: demo.conversations, isDemo: true };
  }
}

async function findConversation(userId: string, id: string) {
  return prisma.aiConversation.findFirst({
    where: { userId, deletedAt: null, OR: [{ id }, { publicId: id }] },
    select: {
      ...conversationSelect,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          status: true,
          structuredJson: true,
          createdAt: true,
          sources: { orderBy: { sourceTimestamp: "asc" }, select: { id: true, sourceModule: true, sourceType: true, sourceName: true, sourceTimestamp: true, sourceUrl: true } },
        },
      },
    },
  });
}

type ConversationDetailRow = NonNullable<Awaited<ReturnType<typeof findConversation>>>;

function serializeMessage(row: ConversationDetailRow["messages"][number]): AiMessage {
  return {
    id: row.id,
    role: normalizeRole(row.role),
    content: row.content,
    status: normalizeMessageStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    sources: row.sources.map((source): AiMessageSource => ({ id: source.id, sourceModule: source.sourceModule, sourceType: source.sourceType, sourceName: source.sourceName, sourceTimestamp: source.sourceTimestamp?.toISOString() ?? null, sourceUrl: source.sourceUrl })),
  };
}

export async function getAiConversation(userId: string, id: string): Promise<QueryResult<AiConversationDetail | null>> {
  try {
    const row = await findConversation(userId, id);
    if (!row) return { data: null, isDemo: false };
    return { data: { ...serializeConversation(row), messages: row.messages.map(serializeMessage), isDemo: false }, isDemo: false };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("AI conversation detail unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    const demo = createDemoAiConversation(userId, id);
    return { data: demo, isDemo: true };
  }
}

export async function getAiSuggestedQuestions(module?: AiModule): Promise<QueryResult<AiSuggestedQuestion[]>> {
  try {
    const rows = await prisma.aiSuggestedQuestion.findMany({ where: { isActive: true, ...(module ? { OR: [{ module }, { module: "command-center" }] } : {}) }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 30 });
    const items = rows.filter((row) => isAiModule(row.module)).map((row) => ({ id: row.id, module: row.module as AiModule, questionTh: row.questionTh, questionEn: row.questionEn, sortOrder: row.sortOrder }));
    return { data: items.length > 0 ? items : createDemoSuggestedQuestions(module), isDemo: items.length === 0 };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("AI suggested questions unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return { data: createDemoSuggestedQuestions(module), isDemo: true };
  }
}

function canAccess(permissions: string[], permission: string) {
  return permissions.includes(permission) || permissions.includes("SUPER_ADMIN");
}

function metricFromDashboard(item: { value: number; unit: string; label: string } | undefined | null) {
  return item ? { value: item.value, unit: item.unit, label: item.label } : null;
}

export async function getAiContext(permissions: string[]): Promise<QueryResult<AiContextSnapshot>> {
  const canDashboard = canAccess(permissions, "dashboard.read");
  const canAlerts = canAccess(permissions, "alerts.read");
  const canIncidents = canAccess(permissions, "incidents.read");
  const canCctv = canAccess(permissions, "cctv.read");
  const canIot = canAccess(permissions, "iot.read");
  try {
    const [dashboard, alerts, incidents, cctv, iot] = await Promise.all([
      canDashboard ? getDashboardSummary().catch(() => null) : Promise.resolve(null),
      canAlerts ? getAlertOverview({ limit: 100 }).catch(() => null) : Promise.resolve(null),
      canIncidents ? getIncidentOverview({ limit: 100 }).catch(() => null) : Promise.resolve(null),
      canCctv ? getCctvOverview({ limit: 100 }).catch(() => null) : Promise.resolve(null),
      canIot ? getIotOverview({ limit: 100 }).catch(() => null) : Promise.resolve(null),
    ]);
    const province = dashboard?.province ?? alerts?.province ?? incidents?.province ?? cctv?.province ?? iot?.province ?? { code: "—", nameTh: "พื้นที่ตามสิทธิ์" };
    const highlights: AiHighlight[] = [];
    if (alerts) {
      highlights.push(...alerts.items.filter((item) => item.status !== "RESOLVED" && item.status !== "DISMISSED").slice(0, 5).map((item) => ({ id: item.id, module: "alerts" as const, title: item.title, detail: `${item.severityLabel} · ${item.statusLabel}`, tone: item.severity === "CRITICAL" ? "critical" as const : item.severity === "HIGH" || item.severity === "WARNING" ? "warning" as const : "info" as const, sourceUrl: "/alerts" })));
    }
    if (incidents) {
      highlights.push(...incidents.items.filter((item) => item.status !== "RESOLVED" && item.status !== "CLOSED").slice(0, 4).map((item) => ({ id: item.id, module: "incidents" as const, title: item.title, detail: `${item.categoryLabel} · ${item.statusLabel}`, tone: item.severity === "CRITICAL" ? "critical" as const : "info" as const, sourceUrl: "/incidents" })));
    }
    if (cctv) {
      highlights.push(...cctv.items.filter((item) => item.status === "OFFLINE").slice(0, 3).map((item) => ({ id: item.id, module: "cctv" as const, title: item.nameTh, detail: `${item.cameraCode} · ${item.statusLabel}`, tone: "warning" as const, sourceUrl: "/cctv" })));
    }
    if (iot) {
      highlights.push(...iot.items.filter((item) => item.status === "OFFLINE" || (item.battery !== null && item.battery <= 20)).slice(0, 3).map((item) => ({ id: item.id, module: "iot" as const, title: item.nameTh, detail: `${item.deviceCode} · ${item.statusLabel}${item.battery !== null && item.battery <= 20 ? " · แบตเตอรี่ต่ำ" : ""}`, tone: "warning" as const, sourceUrl: "/iot" })));
    }
    return {
      data: {
        generatedAt: new Date().toISOString(),
        province: { code: province.code, nameTh: province.nameTh },
        capabilities: { "command-center": canDashboard, alerts: canAlerts, incidents: canIncidents, cctv: canCctv, iot: canIot, dashboard: canDashboard, reports: false },
        summary: {
          activeAlerts: canAlerts ? alerts?.summary.open ?? 0 : 0,
          criticalAlerts: canAlerts ? alerts?.summary.critical ?? 0 : 0,
          openIncidents: canIncidents ? incidents?.summary.open ?? 0 : 0,
          criticalIncidents: canIncidents ? incidents?.summary.critical ?? 0 : 0,
          cctvOnline: canCctv ? cctv?.summary.online ?? 0 : 0,
          cctvTotal: canCctv ? cctv?.summary.total ?? 0 : 0,
          iotOnline: canIot ? iot?.summary.online ?? 0 : 0,
          iotTotal: canIot ? iot?.summary.total ?? 0 : 0,
        },
        metrics: {
          waterLevel: canDashboard ? metricFromDashboard({ value: dashboard?.metrics.waterLevel.value ?? 0, unit: dashboard?.metrics.waterLevel.unit ?? "เมตร", label: "ระดับน้ำ C7.A" }) : null,
          pm25: canDashboard ? metricFromDashboard({ value: dashboard?.metrics.pm25.value ?? 0, unit: dashboard?.metrics.pm25.unit ?? "µg/m³", label: "PM2.5" }) : null,
          rainfall: canDashboard ? metricFromDashboard({ value: dashboard?.metrics.rainfall.value ?? 0, unit: dashboard?.metrics.rainfall.unit ?? "มม.", label: "ฝนสะสมวันนี้" }) : null,
          traffic: canDashboard ? metricFromDashboard({ value: dashboard?.metrics.traffic.value ?? 0, unit: dashboard?.metrics.traffic.unit ?? "กม./ชม.", label: "ความเร็วเฉลี่ย" }) : null,
        },
        highlights: highlights.slice(0, 12),
      },
      isDemo: Boolean(dashboard?.isDemo || alerts?.isDemo || incidents?.isDemo || cctv?.isDemo || iot?.isDemo),
    };
  } catch (error) {
    if (process.env.NODE_ENV === "production") throw error;
    console.warn("AI context unavailable; using demo snapshot.", error instanceof Error ? error.message : error);
    return { data: createDemoAiContext(), isDemo: true };
  }
}

export async function getAiWorkspace(userId: string, permissions: string[]): Promise<AiWorkspace> {
  const [conversations, suggestedQuestions, context] = await Promise.all([
    getAiConversations(userId),
    getAiSuggestedQuestions("command-center"),
    getAiContext(permissions),
  ]);
  const activeConversation = conversations.data[0] ? (await getAiConversation(userId, conversations.data[0].id)).data : null;
  return {
    conversations: conversations.data,
    activeConversation,
    suggestedQuestions: suggestedQuestions.data,
    context: context.data,
    isDemo: conversations.isDemo || suggestedQuestions.isDemo || context.isDemo || Boolean(activeConversation?.isDemo),
  };
}
