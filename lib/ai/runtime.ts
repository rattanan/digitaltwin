import type { AiContextSnapshot, AiMessageSource, AiModule, AiStructuredResponse } from "@/lib/ai/types";

type AiRuntimeResult = { content: string; structured: AiStructuredResponse; sources: AiMessageSource[] };

function source(context: AiContextSnapshot, module: AiModule, sourceType: string, sourceName: string, sourceUrl: string): AiMessageSource {
  return { id: ("context-" + module + "-" + sourceType + "-" + sourceName).replace(/[^a-zA-Z0-9-]/g, "-"), sourceModule: module, sourceType, sourceName, sourceTimestamp: context.generatedAt, sourceUrl };
}

function metricLine(metric: AiContextSnapshot["metrics"][keyof AiContextSnapshot["metrics"]]) {
  return metric ? metric.label + " " + metric.value.toLocaleString("th-TH", { maximumFractionDigits: 2 }) + " " + metric.unit : "ยังไม่มีข้อมูล metric ในขอบเขตสิทธิ์ปัจจุบัน";
}

function uniqueModules(sources: AiMessageSource[]): AiModule[] {
  const modules = sources.map((item) => item.sourceModule).filter((item): item is AiModule => ["command-center", "alerts", "incidents", "cctv", "iot", "dashboard", "reports"].includes(item));
  return [...new Set(modules)];
}

export function buildAiReply(question: string, context: AiContextSnapshot): AiRuntimeResult {
  const normalized = question.trim().toLocaleLowerCase("th-TH");
  const sources: AiMessageSource[] = [];
  let content: string;
  let intent = "overview";
  let relatedUrl: string | null = "/dashboard";

  if (!context.capabilities.alerts && /alert|แจ้งเตือน|critical|วิกฤต/i.test(normalized)) {
    content = "คำถามนี้ต้องใช้สิทธิ์อ่าน Alert Center แต่บัญชีปัจจุบันยังไม่มีสิทธิ์ดังกล่าวครับ";
    relatedUrl = null;
  } else if (/critical|วิกฤต/i.test(normalized) && context.capabilities.alerts) {
    intent = "critical-alerts";
    relatedUrl = "/alerts";
    content = "ขณะนี้พบ Alert ระดับวิกฤตที่ยังเปิดอยู่ " + context.summary.criticalAlerts.toLocaleString("th-TH") + " รายการ\n\nแนะนำให้เปิด Alert Center เพื่อตรวจสอบรายการต้นทางและ status transition ล่าสุดครับ";
    sources.push(source(context, "alerts", "Summary", "Alert Center · Critical alerts", "/alerts"));
  } else if (/incident|เหตุการณ์|เคส|งานที่ต้องติดตาม/i.test(normalized) && context.capabilities.incidents) {
    intent = "open-incidents";
    relatedUrl = "/incidents";
    content = "ขณะนี้มี Incident ที่ยังเปิดอยู่ " + context.summary.openIncidents.toLocaleString("th-TH") + " รายการ โดยเป็นระดับวิกฤต " + context.summary.criticalIncidents.toLocaleString("th-TH") + " รายการ\n\nควรตรวจสอบรายการที่เกินกำหนดและผู้รับผิดชอบต่อจากหน้า Incident workflow ครับ";
    sources.push(source(context, "incidents", "Summary", "Incident workflow · Open incidents", "/incidents"));
  } else if (/offline|ออฟไลน์|กล้อง/i.test(normalized)) {
    intent = "offline-assets";
    relatedUrl = context.capabilities.cctv ? "/cctv" : context.capabilities.iot ? "/iot" : null;
    const offlineHighlights = context.highlights.filter((item) => item.module === "cctv" || item.module === "iot").slice(0, 4);
    if (!context.capabilities.cctv && !context.capabilities.iot) {
      content = "คำถามนี้ต้องใช้สิทธิ์อ่าน CCTV หรือ IoT แต่บัญชีปัจจุบันยังไม่มีสิทธิ์ของแหล่งข้อมูลดังกล่าวครับ";
    } else {
      content = "ภาพรวมแหล่งข้อมูลที่ควรตรวจสอบต่อมี " + offlineHighlights.length.toLocaleString("th-TH") + " รายการจาก context ที่เข้าถึงได้\n" + (offlineHighlights.length > 0 ? offlineHighlights.map((item) => "• " + item.title + " — " + item.detail).join("\n") : "• ยังไม่พบรายการ Offline ใน context ล่าสุด");
      offlineHighlights.forEach((item) => sources.push(source(context, item.module, "Operational item", item.title, item.sourceUrl ?? "/" + item.module)));
    }
  } else if (/น้ำ|water|c7/i.test(normalized) && context.capabilities.dashboard) {
    intent = "water-level";
    relatedUrl = "/dashboard";
    content = "ค่าที่อ่านได้ล่าสุดคือ " + metricLine(context.metrics.waterLevel) + "\n\nควรเทียบกับฝนสะสมและ Alert ที่เกี่ยวข้องก่อนตัดสินใจประสานหน่วยงานภาคสนามครับ";
    sources.push(source(context, "dashboard", "Metric", context.metrics.waterLevel?.label ?? "ระดับน้ำ", "/dashboard"));
    if (context.capabilities.alerts) sources.push(source(context, "alerts", "Context", "Alert Center · Water related", "/alerts"));
  } else if (/pm2?\.5|ฝุ่น|อากาศ/i.test(normalized) && context.capabilities.dashboard) {
    intent = "air-quality";
    relatedUrl = "/dashboard";
    content = "ค่าที่อ่านได้ล่าสุดคือ " + metricLine(context.metrics.pm25) + "\n\nหากต้องการตรวจสอบจุดวัดรายตัว ให้เปิดศูนย์ IoT เพื่อดู metric และ readings ย้อนหลังครับ";
    sources.push(source(context, "dashboard", "Metric", context.metrics.pm25?.label ?? "PM2.5", "/dashboard"));
    if (context.capabilities.iot) sources.push(source(context, "iot", "Metric", "IoT · PM2.5 readings", "/iot"));
  } else if (/ฝน|rain/i.test(normalized) && context.capabilities.dashboard) {
    intent = "rainfall";
    relatedUrl = "/dashboard";
    content = "ค่าฝนสะสมล่าสุดคือ " + metricLine(context.metrics.rainfall) + "\n\nแนะนำให้ตรวจสอบ Alert และ Incident ในพื้นที่เดียวกันเพื่อประเมินผลกระทบต่อเนื่องครับ";
    sources.push(source(context, "dashboard", "Metric", context.metrics.rainfall?.label ?? "ฝนสะสม", "/dashboard"));
  } else {
    const topHighlights = context.highlights.slice(0, 4);
    intent = "situation-summary";
    content = "สรุปภาพรวม " + context.province.nameTh + "\n• Alert ที่ยังเปิด: " + context.summary.activeAlerts.toLocaleString("th-TH") + " รายการ (Critical " + context.summary.criticalAlerts.toLocaleString("th-TH") + ")\n• Incident ที่ยังเปิด: " + context.summary.openIncidents.toLocaleString("th-TH") + " รายการ (Critical " + context.summary.criticalIncidents.toLocaleString("th-TH") + ")\n• CCTV ออนไลน์: " + context.summary.cctvOnline.toLocaleString("th-TH") + " / " + context.summary.cctvTotal.toLocaleString("th-TH") + " จุด\n• IoT ออนไลน์: " + context.summary.iotOnline.toLocaleString("th-TH") + " / " + context.summary.iotTotal.toLocaleString("th-TH") + " อุปกรณ์" + (topHighlights.length > 0 ? "\n\nประเด็นที่ควรติดตาม\n" + topHighlights.map((item) => "• " + item.title + " — " + item.detail).join("\n") : "");
    if (context.capabilities.dashboard) sources.push(source(context, "dashboard", "Summary", "Dashboard · " + context.province.nameTh, "/dashboard"));
    if (context.capabilities.alerts) sources.push(source(context, "alerts", "Summary", "Alert Center", "/alerts"));
    if (context.capabilities.incidents) sources.push(source(context, "incidents", "Summary", "Incident workflow", "/incidents"));
    topHighlights.forEach((item) => sources.push(source(context, item.module, "Operational item", item.title, item.sourceUrl ?? "/" + item.module)));
  }

  return {
    content,
    structured: { intent, confidence: sources.length > 0 ? 0.92 : 0.65, citedModules: uniqueModules(sources), provider: "CONTEXT_ENGINE", relatedUrl },
    sources: sources.slice(0, 8),
  };
}
