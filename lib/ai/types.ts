export const AI_MODULES = ["command-center", "alerts", "incidents", "cctv", "iot", "dashboard", "reports"] as const;
export type AiModule = (typeof AI_MODULES)[number];

export const AI_MESSAGE_ROLES = ["USER", "ASSISTANT", "SYSTEM"] as const;
export type AiMessageRole = (typeof AI_MESSAGE_ROLES)[number];

export const AI_MESSAGE_STATUSES = ["PENDING", "COMPLETED", "ERROR"] as const;
export type AiMessageStatus = (typeof AI_MESSAGE_STATUSES)[number];

export type AiMessageSource = {
  id: string;
  sourceModule: string;
  sourceType: string;
  sourceName: string;
  sourceTimestamp: string | null;
  sourceUrl: string | null;
};

export type AiMessage = {
  id: string;
  role: AiMessageRole;
  content: string;
  status: AiMessageStatus;
  createdAt: string;
  sources: AiMessageSource[];
};

export type AiConversationSummary = {
  id: string;
  publicId: string;
  title: string;
  contextModule: AiModule | null;
  lastMessageAt: string | null;
  isPinned: boolean;
  updatedAt: string;
  messageCount: number;
};

export type AiConversationDetail = AiConversationSummary & {
  messages: AiMessage[];
  isDemo: boolean;
};

export type AiSuggestedQuestion = {
  id: string;
  module: AiModule;
  questionTh: string;
  questionEn: string | null;
  sortOrder: number;
};

export type AiHighlight = {
  id: string;
  module: AiModule;
  title: string;
  detail: string;
  tone: "critical" | "warning" | "info" | "success";
  sourceUrl: string | null;
};

export type AiMetricSnapshot = {
  value: number;
  unit: string;
  label: string;
};

export type AiContextSnapshot = {
  generatedAt: string;
  province: { code: string; nameTh: string };
  capabilities: Record<AiModule, boolean>;
  summary: {
    activeAlerts: number;
    criticalAlerts: number;
    openIncidents: number;
    criticalIncidents: number;
    cctvOnline: number;
    cctvTotal: number;
    iotOnline: number;
    iotTotal: number;
  };
  metrics: {
    waterLevel: AiMetricSnapshot | null;
    pm25: AiMetricSnapshot | null;
    rainfall: AiMetricSnapshot | null;
    traffic: AiMetricSnapshot | null;
  };
  highlights: AiHighlight[];
};

export type AiWorkspace = {
  conversations: AiConversationSummary[];
  activeConversation: AiConversationDetail | null;
  suggestedQuestions: AiSuggestedQuestion[];
  context: AiContextSnapshot;
  isDemo: boolean;
};

export type AiStructuredResponse = {
  intent: string;
  confidence: number;
  citedModules: AiModule[];
  provider: "CONTEXT_ENGINE";
  relatedUrl: string | null;
};
