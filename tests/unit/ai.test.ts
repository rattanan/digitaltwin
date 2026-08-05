import { describe, expect, it } from "vitest";
import { createDemoAiContext, createDemoAiWorkspace, createDemoSuggestedQuestions } from "@/lib/ai/demo-data";
import { buildAiReply } from "@/lib/ai/runtime";
import { AI_MODULES } from "@/lib/ai/types";
import { aiConversationCreateSchema, aiConversationUpdateSchema, aiMessageSchema } from "@/lib/validations/ai";

describe("Phase 6 AI Copilot", () => {
  it("builds a complete demo workspace with suggested questions and context", () => {
    const workspace = createDemoAiWorkspace("demo-user-001");

    expect(workspace.isDemo).toBe(true);
    expect(workspace.activeConversation.messages).toHaveLength(1);
    expect(workspace.suggestedQuestions).toHaveLength(9);
    expect(workspace.context.capabilities).toEqual({
      "command-center": true,
      alerts: true,
      incidents: true,
      cctv: true,
      iot: true,
      dashboard: true,
      reports: false,
    });
    expect(workspace.context.summary).toMatchObject({ activeAlerts: 19, criticalAlerts: 2, openIncidents: 9, criticalIncidents: 2 });
  });

  it("filters suggested questions by module while retaining command-center prompts", () => {
    const questions = createDemoSuggestedQuestions("iot");

    expect(questions).toHaveLength(6);
    expect(questions.map((question) => question.questionTh)).toEqual([
      "สรุปสถานการณ์สำคัญวันนี้",
      "มี Alert ระดับ Critical กี่รายการ",
      "อุปกรณ์ใด Offline อยู่บ้าง",
      "อำเภอใดมีฝนสะสมสูงที่สุด",
      "Sensor ใดมีค่าผิดปกติ",
      "PM2.5 วันนี้เทียบกับเมื่อวานเป็นอย่างไร",
    ]);
  });

  it("returns cited, deterministic answers for critical alerts", () => {
    const result = buildAiReply("มี Alert ระดับ Critical กี่รายการ", createDemoAiContext());

    expect(result.structured).toMatchObject({ intent: "critical-alerts", provider: "CONTEXT_ENGINE", relatedUrl: "/alerts" });
    expect(result.structured.citedModules).toContain("alerts");
    expect(result.content).toContain("2 รายการ");
    expect(result.sources[0]).toMatchObject({ sourceModule: "alerts", sourceUrl: "/alerts" });
  });

  it("does not answer from modules outside the current permission context", () => {
    const context = createDemoAiContext();
    context.capabilities.alerts = false;
    context.summary.criticalAlerts = 0;

    const result = buildAiReply("สรุป Alert Critical", context);

    expect(result.content).toContain("ยังไม่มีสิทธิ์");
    expect(result.sources).toHaveLength(0);
    expect(result.structured.relatedUrl).toBeNull();
  });

  it("keeps AI contracts strict and module values controlled", () => {
    expect(AI_MODULES).toContain("command-center");
    expect(aiConversationCreateSchema.parse({ title: "ติดตามน้ำ", contextModule: "dashboard" })).toMatchObject({ title: "ติดตามน้ำ" });
    expect(aiConversationUpdateSchema.safeParse({ isPinned: true, role: "ADMIN" }).success).toBe(false);
    expect(aiMessageSchema.safeParse({ content: "ตรวจสอบสถานการณ์ล่าสุด" }).success).toBe(true);
    expect(aiMessageSchema.safeParse({ content: "x" }).success).toBe(false);
    expect(aiMessageSchema.safeParse({ content: "ตรวจสอบ", metadata: {} }).success).toBe(false);
  });
});
