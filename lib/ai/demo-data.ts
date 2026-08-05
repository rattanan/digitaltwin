import { demoDashboardSnapshot } from "@/lib/demo-data";
import { createDemoAlertOverview } from "@/lib/operations/demo-data";
import { createDemoIncidentOverview } from "@/lib/operations/demo-data";
import { createDemoCctvOverview } from "@/lib/cctv/demo-data";
import { createDemoIotOverview } from "@/lib/iot/demo-data";
import type { AiContextSnapshot, AiConversationDetail, AiConversationSummary, AiMessage, AiModule, AiSuggestedQuestion } from "@/lib/ai/types";

const DEMO_NOW = "2026-08-05T13:00:00.000Z";

const questionSeeds: [AiModule, string][] = [
  ["command-center", "สรุปสถานการณ์สำคัญวันนี้"],
  ["command-center", "มี Alert ระดับ Critical กี่รายการ"],
  ["command-center", "อุปกรณ์ใด Offline อยู่บ้าง"],
  ["command-center", "อำเภอใดมีฝนสะสมสูงที่สุด"],
  ["cctv", "กล้องใด Offline เกิน 30 นาที"],
  ["cctv", "วันนี้ AI ตรวจพบเหตุอะไรบ้าง"],
  ["iot", "Sensor ใดมีค่าผิดปกติ"],
  ["iot", "PM2.5 วันนี้เทียบกับเมื่อวานเป็นอย่างไร"],
  ["reports", "สร้างรายงานสถานการณ์วันนี้"],
];

function demoSource(id: string, sourceModule: string, sourceType: string, sourceName: string, sourceUrl: string): AiMessage["sources"][number] {
  return { id, sourceModule, sourceType, sourceName, sourceTimestamp: DEMO_NOW, sourceUrl };
}

export function createDemoSuggestedQuestions(module?: AiModule): AiSuggestedQuestion[] {
  return questionSeeds
    .map(([questionModule, questionTh], index) => ({ id: `demo-ai-question-${index + 1}`, module: questionModule, questionTh, questionEn: null, sortOrder: index }))
    .filter((question) => !module || question.module === module || question.module === "command-center");
}

export function createDemoAiContext(): AiContextSnapshot {
  const alerts = createDemoAlertOverview({ limit: 100 });
  const incidents = createDemoIncidentOverview({ limit: 100 });
  const cctv = createDemoCctvOverview({ limit: 100 });
  const iot = createDemoIotOverview({ limit: 100 });
  return {
    generatedAt: new Date().toISOString(),
    province: { code: demoDashboardSnapshot.province.code, nameTh: demoDashboardSnapshot.province.nameTh },
    capabilities: { "command-center": true, alerts: true, incidents: true, cctv: true, iot: true, dashboard: true, reports: false },
    summary: {
      activeAlerts: alerts.summary.open,
      criticalAlerts: alerts.summary.critical,
      openIncidents: incidents.summary.open,
      criticalIncidents: incidents.summary.critical,
      cctvOnline: cctv.summary.online,
      cctvTotal: cctv.summary.total,
      iotOnline: iot.summary.online,
      iotTotal: iot.summary.total,
    },
    metrics: {
      waterLevel: { value: demoDashboardSnapshot.metrics.waterLevel.value, unit: demoDashboardSnapshot.metrics.waterLevel.unit, label: "ระดับน้ำ C7.A" },
      pm25: { value: demoDashboardSnapshot.metrics.pm25.value, unit: demoDashboardSnapshot.metrics.pm25.unit, label: "PM2.5" },
      rainfall: { value: demoDashboardSnapshot.metrics.rainfall.value, unit: demoDashboardSnapshot.metrics.rainfall.unit, label: "ฝนสะสมวันนี้" },
      traffic: { value: demoDashboardSnapshot.metrics.traffic.value, unit: demoDashboardSnapshot.metrics.traffic.unit, label: "ความเร็วเฉลี่ย" },
    },
    highlights: [
      ...alerts.items.filter((item) => item.status !== "RESOLVED" && item.status !== "DISMISSED").slice(0, 3).map((item) => ({ id: item.id, module: "alerts" as const, title: item.title, detail: `${item.severityLabel} · ${item.statusLabel}`, tone: item.severity === "CRITICAL" ? "critical" as const : "warning" as const, sourceUrl: "/alerts" })),
      ...incidents.items.filter((item) => item.status !== "RESOLVED" && item.status !== "CLOSED").slice(0, 2).map((item) => ({ id: item.id, module: "incidents" as const, title: item.title, detail: `${item.categoryLabel} · ${item.statusLabel}`, tone: item.severity === "CRITICAL" ? "critical" as const : "info" as const, sourceUrl: "/incidents" })),
      ...cctv.items.filter((item) => item.status === "OFFLINE").slice(0, 1).map((item) => ({ id: item.id, module: "cctv" as const, title: item.nameTh, detail: `${item.cameraCode} · ออฟไลน์`, tone: "warning" as const, sourceUrl: "/cctv" })),
    ],
  };
}

function demoAssistantMessage(conversationId: string): AiMessage {
  return {
    id: `${conversationId}-assistant`,
    role: "ASSISTANT",
    content: "ผมพร้อมช่วยวิเคราะห์ข้อมูลเมืองจาก Dashboard, Alert Center, Incident workflow, CCTV และ IoT ครับ ลองเลือกคำถามแนะนำหรือพิมพ์คำถามเกี่ยวกับสถานการณ์จังหวัดได้เลย",
    status: "COMPLETED",
    createdAt: DEMO_NOW,
    sources: [demoSource(`${conversationId}-source`, "dashboard", "Context", "City Intelligence context", "/dashboard")],
  };
}

export function createDemoAiConversation(userId: string, id = `demo-ai-conversation-${userId}`): AiConversationDetail {
  const message = demoAssistantMessage(id);
  return {
    id,
    publicId: id,
    title: "Demo: สรุปสถานการณ์จังหวัด",
    contextModule: "command-center",
    lastMessageAt: message.createdAt,
    isPinned: true,
    updatedAt: message.createdAt,
    messageCount: 1,
    messages: [message],
    isDemo: true,
  };
}

export function createDemoAiWorkspace(userId: string): { conversations: AiConversationSummary[]; activeConversation: AiConversationDetail; suggestedQuestions: AiSuggestedQuestion[]; context: AiContextSnapshot; isDemo: true } {
  const activeConversation = createDemoAiConversation(userId);
  return { conversations: [activeConversation], activeConversation, suggestedQuestions: createDemoSuggestedQuestions(), context: createDemoAiContext(), isDemo: true };
}
