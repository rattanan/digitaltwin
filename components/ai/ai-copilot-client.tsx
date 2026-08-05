"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Activity, Archive, Bot, BrainCircuit, Check, ChevronRight, Clock3, Database, FileText, Link2, MessageSquare, Pin, Plus, RefreshCw, Send, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AI_MODULES, type AiConversationDetail, type AiConversationSummary, type AiContextSnapshot, type AiModule, type AiSuggestedQuestion, type AiWorkspace } from "@/lib/ai/types";
import { cn, formatDateTime, formatNumber } from "@/lib/utils";

type ApiPayload<T> = { success?: boolean; data?: T; message?: string };
type ConversationListPayload = { items: AiConversationSummary[]; isDemo?: boolean };

const moduleLabels: Record<AiModule, string> = { "command-center": "ศูนย์บัญชาการ", alerts: "Alerts", incidents: "Incidents", cctv: "CCTV", iot: "IoT", dashboard: "Dashboard", reports: "Reports" };
const capabilityLabels: Record<AiModule, string> = { "command-center": "ศูนย์บัญชาการ", alerts: "Alert Center", incidents: "Incident workflow", cctv: "CCTV", iot: "IoT", dashboard: "Dashboard", reports: "Reports" };

async function api<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options, headers: { "content-type": "application/json", ...(options?.headers ?? {}) } });
  const payload = await response.json() as ApiPayload<T>;
  if (!response.ok || !payload.success || payload.data === undefined) throw new Error(payload.message ?? "ดำเนินการไม่สำเร็จ");
  return payload.data;
}

function ChatMessage({ message }: { message: AiConversationDetail["messages"][number] }) {
  const isUser = message.role === "USER";
  return <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}><div className={cn("max-w-[92%] rounded-2xl px-4 py-3 sm:max-w-[80%]", isUser ? "rounded-br-md bg-violet-300/15 text-violet-50" : "rounded-bl-md border border-white/[.08] bg-black/15 text-slate-300")}><div className="flex items-center gap-2 text-[10px] uppercase tracking-[.14em] text-slate-600">{isUser ? "You" : <><Sparkles className="size-3 text-violet-200" />Copilot</>}{message.status === "ERROR" && <Badge variant="danger">error</Badge>}</div><p className="mt-2 whitespace-pre-wrap text-sm leading-7">{message.content}</p>{message.sources.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/[.08] pt-2.5">{message.sources.map((source) => source.sourceUrl ? <Link key={source.id} href={source.sourceUrl} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[10px] text-cyan-200 transition hover:bg-cyan-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"><Link2 className="size-3" />{source.sourceName}</Link> : <span key={source.id} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[10px] text-slate-400"><Link2 className="size-3" />{source.sourceName}</span>)}</div>}</div></div>;
}

function ConversationRow({ conversation, selected, onSelect }: { conversation: AiConversationSummary; selected: boolean; onSelect: () => void }) {
  const timestamp = conversation.lastMessageAt ? " · " + formatDateTime(conversation.lastMessageAt) : "";
  return <button type="button" onClick={onSelect} aria-pressed={selected} className={cn("group w-full rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70 motion-reduce:transition-none", selected ? "border-violet-200/30 bg-violet-200/[.08]" : "border-white/[.06] bg-white/[.02] hover:border-white/15 hover:bg-white/[.04]")}><div className="flex items-start gap-2.5"><MessageSquare className={cn("mt-0.5 size-4 shrink-0", selected ? "text-violet-200" : "text-slate-600")} /><span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-xs font-medium text-slate-200">{conversation.title}</span>{conversation.isPinned && <Pin className="size-3 shrink-0 text-amber-200" />}</span><span className="mt-1 block text-[10px] text-slate-600">{conversation.messageCount} messages{timestamp}</span></span><ChevronRight className={cn("mt-1 size-3.5 shrink-0", selected ? "text-violet-200" : "text-slate-700")} /></div></button>;
}

function ContextPanel({ context }: { context: AiContextSnapshot }) {
  const summaryCards = [{ label: "Alert เปิด", value: context.summary.activeAlerts, tone: "text-amber-200" }, { label: "Incident เปิด", value: context.summary.openIncidents, tone: "text-rose-200" }, { label: "CCTV online", value: context.summary.cctvOnline, tone: "text-cyan-200" }, { label: "IoT online", value: context.summary.iotOnline, tone: "text-emerald-200" }];
  const metrics = [context.metrics.waterLevel, context.metrics.pm25, context.metrics.rainfall, context.metrics.traffic].filter(Boolean);
  return <div className="space-y-4"><Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><Activity className="size-4 text-cyan-200" />Context snapshot</CardTitle><p className="text-[10px] text-slate-600">ข้อมูลตามสิทธิ์ของบัญชี · {formatDateTime(context.generatedAt)}</p></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-2">{summaryCards.map((item) => <div key={item.label} className="rounded-xl bg-white/[.035] p-3"><p className="text-[10px] text-slate-500">{item.label}</p><p className={cn("mt-1 text-xl font-semibold", item.tone)}>{formatNumber(item.value)}</p></div>)}</div><div className="space-y-2 border-t border-white/[.06] pt-3"><p className="flex items-center gap-2 text-[10px] uppercase tracking-[.14em] text-slate-600"><Database className="size-3" />Accessible modules</p>{AI_MODULES.map((module) => <div key={module} className="flex items-center justify-between gap-2 text-xs"><span className="text-slate-400">{capabilityLabels[module]}</span>{context.capabilities[module] ? <span className="flex items-center gap-1 text-emerald-200"><Check className="size-3" />พร้อมใช้</span> : <span className="text-slate-700">ไม่มีสิทธิ์</span>}</div>)}</div></CardContent></Card><Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><BrainCircuit className="size-4 text-violet-200" />Key metrics</CardTitle></CardHeader><CardContent className="space-y-2">{metrics.length === 0 ? <p className="text-xs text-slate-500">ไม่มี metric ในขอบเขตสิทธิ์ปัจจุบัน</p> : metrics.map((metric) => <div key={metric!.label} className="flex items-center justify-between gap-3 rounded-xl border border-white/[.06] bg-white/[.02] px-3 py-2.5"><span className="text-xs text-slate-400">{metric!.label}</span><span className="font-mono text-xs text-slate-200">{metric!.value.toLocaleString("th-TH", { maximumFractionDigits: 2 })} {metric!.unit}</span></div>)}</CardContent></Card><Card><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm"><TriangleAlert className="size-4 text-amber-200" />ควรติดตาม</CardTitle></CardHeader><CardContent className="space-y-2">{context.highlights.length === 0 ? <p className="text-xs text-slate-500">ยังไม่มีรายการเด่นใน context</p> : context.highlights.slice(0, 5).map((item) => <Link key={item.id} href={item.sourceUrl ?? "/" + item.module} className="block rounded-xl border border-white/[.06] px-3 py-2.5 transition hover:border-violet-200/25 hover:bg-white/[.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70"><p className="truncate text-xs text-slate-200">{item.title}</p><p className="mt-1 truncate text-[10px] text-slate-600">{item.detail}</p></Link>)}</CardContent></Card></div>;
}

function SuggestedQuestions({ questions, onAsk }: { questions: AiSuggestedQuestion[]; onAsk: (question: string) => void }) {
  return <div className="flex flex-wrap gap-2">{questions.slice(0, 8).map((question) => <button type="button" key={question.id} onClick={() => onAsk(question.questionTh)} className="rounded-full border border-violet-200/15 bg-violet-200/[.05] px-3 py-2 text-left text-[11px] text-violet-100 transition hover:border-violet-200/35 hover:bg-violet-200/[.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70">{question.questionTh}</button>)}</div>;
}

export function AiCopilotClient({ initialData, canUse }: { initialData: AiWorkspace; canUse: boolean }) {
  const [workspace, setWorkspace] = useState(initialData);
  const [activeId, setActiveId] = useState(initialData.activeConversation?.id ?? "");
  const [conversation, setConversation] = useState<AiConversationDetail | null>(initialData.activeConversation);
  const [draft, setDraft] = useState("");
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const activeSummary = useMemo(() => workspace.conversations.find((item) => item.id === activeId) ?? null, [activeId, workspace.conversations]);

  async function refreshList() {
    const result = await api<ConversationListPayload>("/api/v1/ai/conversations?limit=50");
    setWorkspace((current) => ({ ...current, conversations: result.items }));
  }

  async function openConversation(id: string) {
    if (id === activeId && conversation) return;
    setActiveId(id);
    setLoadingConversation(true);
    setError("");
    try { setConversation(await api<AiConversationDetail>("/api/v1/ai/conversations/" + id)); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "โหลดบทสนทนาไม่สำเร็จ"); } finally { setLoadingConversation(false); }
  }

  async function createConversation() {
    if (!canUse) return;
    setError("");
    try {
      const created = await api<AiConversationDetail>("/api/v1/ai/conversations", { method: "POST", body: JSON.stringify({ contextModule: "command-center" }) });
      setConversation(created);
      setActiveId(created.id);
      setWorkspace((current) => ({ ...current, conversations: [created, ...current.conversations] }));
    } catch (createError) { setError(createError instanceof Error ? createError.message : "สร้างบทสนทนาไม่สำเร็จ"); }
  }

  async function sendMessage(question = draft) {
    const content = question.trim();
    if (!canUse || !content || sending) return;
    setSending(true);
    setError("");
    try {
      let target = conversation;
      if (!target) {
        target = await api<AiConversationDetail>("/api/v1/ai/conversations", { method: "POST", body: JSON.stringify({ contextModule: "command-center" }) });
        setConversation(target);
        setActiveId(target.id);
      }
      const result = await api<AiConversationDetail>("/api/v1/ai/conversations/" + target.id + "/messages", { method: "POST", body: JSON.stringify({ content }) });
      setConversation(result);
      setDraft("");
      await refreshList();
    } catch (sendError) { setError(sendError instanceof Error ? sendError.message : "ส่งคำถามไม่สำเร็จ"); } finally { setSending(false); }
  }

  async function togglePin() {
    if (!activeSummary || !canUse) return;
    try {
      const result = await api<AiConversationDetail>("/api/v1/ai/conversations/" + activeSummary.id, { method: "PATCH", body: JSON.stringify({ isPinned: !activeSummary.isPinned }) });
      setConversation(result);
      setWorkspace((current) => ({ ...current, conversations: current.conversations.map((item) => item.id === result.id ? result : item) }));
    } catch (pinError) { setError(pinError instanceof Error ? pinError.message : "อัปเดตบทสนทนาไม่สำเร็จ"); }
  }

  async function archiveConversation() {
    if (!activeSummary || !canUse) return;
    try {
      await api<{ deleted: boolean }>("/api/v1/ai/conversations/" + activeSummary.id, { method: "DELETE" });
      const remaining = workspace.conversations.filter((item) => item.id !== activeSummary.id);
      const next = remaining[0];
      setWorkspace((current) => ({ ...current, conversations: remaining }));
      setActiveId(next?.id ?? "");
      setConversation(null);
      if (next) await openConversation(next.id);
    } catch (archiveError) { setError(archiveError instanceof Error ? archiveError.message : "เก็บบทสนทนาไม่สำเร็จ"); }
  }

  async function refreshAll() {
    setRefreshing(true);
    try {
      const result = await api<AiWorkspace>("/api/v1/ai");
      setWorkspace(result);
      setActiveId(result.activeConversation?.id ?? "");
      setConversation(result.activeConversation);
      setError("");
    } catch (refreshError) { setError(refreshError instanceof Error ? refreshError.message : "รีเฟรช AI workspace ไม่สำเร็จ"); } finally { setRefreshing(false); }
  }

  function askQuestion(question: string) {
    setDraft(question);
    void sendMessage(question);
  }

  return <div className="mx-auto max-w-[1800px] space-y-5">
    <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-lg bg-violet-300/10 text-violet-200"><Bot className="size-4" /></span><p className="text-xs font-medium uppercase tracking-[.18em] text-violet-200/70">City intelligence · Phase 6</p></div><h2 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">AI Copilot</h2><p className="mt-1 text-sm text-slate-500">ถามข้อมูลเมืองด้วยภาษาธรรมชาติ พร้อม context และแหล่งอ้างอิงตามสิทธิ์ของบัญชี</p></div><div className="flex flex-wrap items-center gap-2"><div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.03] px-3 py-2 text-[11px] text-slate-400"><Clock3 className="size-3.5 text-violet-200" />{workspace.isDemo && <span className="rounded bg-amber-300/10 px-1.5 py-0.5 text-[9px] text-amber-200">DEMO CONTEXT</span>}<span>{canUse ? "พร้อมใช้งาน" : "ดูได้อย่างเดียว"}</span></div><Button variant="secondary" size="sm" onClick={() => void refreshAll()} disabled={refreshing}><RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />รีเฟรช</Button><Button variant="default" size="sm" onClick={() => void createConversation()} disabled={!canUse}><Plus className="size-3.5" />แชทใหม่</Button></div></div>
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200"><span>{error}</span><button type="button" onClick={() => setError("")} className="rounded-lg px-2 py-1 hover:bg-rose-300/10" aria-label="ปิดข้อความแจ้งเตือน">ปิด</button></div>}
    <section className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_320px]">
      <Card className="h-fit overflow-hidden"><CardHeader className="flex-row items-center justify-between border-b border-white/[.06] pb-3"><CardTitle className="text-sm">บทสนทนา</CardTitle><Badge variant="neutral">{formatNumber(workspace.conversations.length)}</Badge></CardHeader><CardContent className="space-y-2 p-3">{workspace.conversations.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center text-xs text-slate-500">ยังไม่มีบทสนทนา</div> : workspace.conversations.map((item) => <ConversationRow key={item.id} conversation={item} selected={item.id === activeId} onSelect={() => void openConversation(item.id)} />)}<div className="border-t border-white/[.06] pt-3"><p className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.14em] text-slate-600"><Sparkles className="size-3 text-violet-200" />Suggested questions</p><SuggestedQuestions questions={workspace.suggestedQuestions} onAsk={askQuestion} /></div></CardContent></Card>
      <Card className="flex min-h-[680px] min-w-0 flex-col overflow-hidden"><CardHeader className="flex-row items-center justify-between border-b border-white/[.06] pb-4"><div className="flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-300/15 text-violet-200"><Bot className="size-5" /></span><div className="min-w-0"><CardTitle className="truncate text-base">{activeSummary?.title ?? "เริ่มบทสนทนาใหม่"}</CardTitle><p className="mt-1 truncate text-[10px] text-slate-600">{activeSummary?.contextModule ? moduleLabels[activeSummary.contextModule] : "Command center context"} · Permission-aware context engine</p></div></div><div className="flex shrink-0 items-center gap-1"><Button variant="ghost" size="icon" onClick={() => void togglePin()} disabled={!activeSummary || !canUse} aria-label={activeSummary?.isPinned ? "ยกเลิกปักหมุดบทสนทนา" : "ปักหมุดบทสนทนา"}><Pin className="size-3.5" /></Button><Button variant="ghost" size="icon" onClick={() => void archiveConversation()} disabled={!activeSummary || !canUse} aria-label="เก็บบทสนทนา"><Archive className="size-3.5 text-rose-200" /></Button></div></CardHeader><CardContent className="flex min-h-0 flex-1 flex-col p-4 sm:p-5"><div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1" aria-live="polite">{loadingConversation ? <div className="flex min-h-[420px] items-center justify-center gap-3 text-sm text-slate-500"><RefreshCw className="size-5 animate-spin motion-reduce:animate-none text-violet-200" />กำลังโหลดบทสนทนา...</div> : conversation && conversation.messages.length > 0 ? conversation.messages.map((message) => <ChatMessage key={message.id} message={message} />) : <div className="flex min-h-[420px] flex-col items-center justify-center text-center"><Sparkles className="size-10 text-violet-200/50" /><p className="mt-4 text-sm text-slate-300">เริ่มถาม Copilot ได้เลย</p><p className="mt-1 max-w-sm text-xs leading-5 text-slate-600">Copilot จะอธิบายจากข้อมูลที่บัญชีนี้เข้าถึงได้ และแนบแหล่งอ้างอิงให้ตรวจสอบต่อ</p><div className="mt-5 max-w-xl"><SuggestedQuestions questions={workspace.suggestedQuestions} onAsk={askQuestion} /></div></div>}</div><form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="mt-4 border-t border-white/[.06] pt-4"><div className="flex items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} disabled={!canUse || sending} rows={2} maxLength={4000} placeholder={canUse ? "ถามเกี่ยวกับสถานการณ์เมือง..." : "บัญชีนี้ดูบทสนทนาได้ แต่ไม่มีสิทธิ์ส่งคำถาม"} aria-label="คำถามถึง AI Copilot" className="min-h-20 flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2.5 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-200/50 focus:ring-2 focus:ring-violet-200/10 disabled:opacity-50" /><Button type="submit" size="icon" disabled={!canUse || sending || !draft.trim()} aria-label="ส่งคำถาม">{sending ? <RefreshCw className="size-4 animate-spin motion-reduce:animate-none" /> : <Send className="size-4" />}</Button></div><p className="mt-2 text-[10px] text-slate-600">กด Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่ · ข้อมูลที่อ้างอิงจะแสดงใต้คำตอบ</p></form></CardContent></Card>
      <ContextPanel context={workspace.context} />
    </section>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[.06] pt-3 text-[10px] text-slate-600"><span className="flex items-center gap-1.5"><FileText className="size-3" />Provider: Context Engine · ไม่เรียก external AI API</span><span className="flex items-center gap-1.5"><Check className="size-3 text-emerald-300/70" />Source-aware response</span></div>
  </div>;
}
