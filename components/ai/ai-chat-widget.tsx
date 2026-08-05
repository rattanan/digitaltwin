"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, ExternalLink, RefreshCw, Send, Sparkles, X } from "lucide-react";
import type { AiConversationDetail, AiSuggestedQuestion, AiWorkspace } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

type ApiPayload<T> = { success?: boolean; data?: T; message?: string };

async function api<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options, headers: { "content-type": "application/json", ...(options?.headers ?? {}) } });
  const payload = await response.json() as ApiPayload<T>;
  if (!response.ok || !payload.success || payload.data === undefined) throw new Error(payload.message ?? "ดำเนินการไม่สำเร็จ");
  return payload.data;
}

function ChatMessage({ message }: { message: AiConversationDetail["messages"][number] }) {
  const isUser = message.role === "USER";
  return <div className={cn("flex gap-2", isUser ? "justify-end" : "justify-start")}><div className={cn("max-w-[88%] rounded-2xl px-3 py-2.5", isUser ? "rounded-br-md bg-violet-300/15 text-violet-50" : "rounded-bl-md border border-white/[.08] bg-black/20 text-slate-300")}><div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[.14em] text-slate-600">{isUser ? "คุณ" : <><Sparkles className="size-2.5 text-violet-200" />Copilot</>}{message.status === "ERROR" && <span className="text-rose-200">error</span>}</div><p className="mt-1.5 whitespace-pre-wrap text-xs leading-5">{message.content}</p>{message.sources.length > 0 && <div className="mt-2 flex flex-wrap gap-1 border-t border-white/[.08] pt-2">{message.sources.slice(0, 3).map((source) => source.sourceUrl ? <Link key={source.id} href={source.sourceUrl} className="inline-flex items-center rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-[9px] text-cyan-200 transition hover:bg-cyan-200/10">{source.sourceName}</Link> : <span key={source.id} className="rounded-full border border-white/10 bg-white/[.04] px-2 py-1 text-[9px] text-slate-500">{source.sourceName}</span>)}</div>}</div></div>;
}

export function AiChatWidget({ canRead, canUse }: { canRead: boolean; canUse: boolean }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [conversation, setConversation] = useState<AiConversationDetail | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<AiSuggestedQuestion[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length, open]);

  async function loadWorkspace(force = false) {
    if (!canRead || loading || (!force && loaded)) return;
    setLoading(true);
    setError("");
    try {
      const workspace = await api<AiWorkspace>("/api/v1/ai");
      setConversation(workspace.activeConversation);
      setSuggestedQuestions(workspace.suggestedQuestions);
      setLoaded(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "โหลด City Intelligence Copilot ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  function toggleOpen() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) void loadWorkspace();
  }

  async function sendMessage(question = draft) {
    const content = question.trim();
    if (!canUse || !content || sending || loading) return;
    setSending(true);
    setError("");
    try {
      let target = conversation;
      if (!target) {
        target = await api<AiConversationDetail>("/api/v1/ai/conversations", { method: "POST", body: JSON.stringify({ contextModule: "command-center" }) });
        setConversation(target);
      }
      const result = await api<AiConversationDetail>(`/api/v1/ai/conversations/${target.id}/messages`, { method: "POST", body: JSON.stringify({ content }) });
      setConversation(result);
      setDraft("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "ส่งคำถามไม่สำเร็จ");
    } finally {
      setSending(false);
    }
  }

  return <div className="fixed bottom-4 right-4 z-50"><div className={cn("absolute bottom-14 right-0 flex h-[min(620px,calc(100vh-6rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-violet-200/20 bg-[var(--background-card)] shadow-[0_24px_80px_rgba(0,0,0,.45)] transition duration-200", open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0")} role="dialog" aria-label="City Intelligence Copilot"><div className="flex items-center justify-between border-b border-white/[.08] bg-violet-300/[.06] px-4 py-3"><div className="flex min-w-0 items-center gap-2.5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-300/15 text-violet-200"><Bot className="size-4" /></span><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">City Intelligence Copilot</p><p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500"><span className={cn("size-1.5 rounded-full", canRead ? "bg-emerald-300" : "bg-slate-600")} />{canRead ? "Context-aware · พร้อมตอบคำถาม" : "ไม่มีสิทธิ์ใช้งาน AI"}</p></div></div><div className="flex items-center gap-1"><button type="button" onClick={() => void loadWorkspace(true)} disabled={!canRead || loading} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white disabled:opacity-40" aria-label="รีเฟรช Copilot"><RefreshCw className={cn("size-3.5", loading && "animate-spin motion-reduce:animate-none")} /></button><Link href="/ai" className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white" aria-label="เปิดหน้า AI Copilot"><ExternalLink className="size-3.5" /></Link></div></div><div className="min-h-0 flex-1 overflow-y-auto px-3 py-3" aria-live="polite">{error && <div role="alert" className="mb-3 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-[11px] leading-5 text-rose-200">{error}</div>}{loading ? <div className="flex h-full min-h-48 items-center justify-center gap-2 text-xs text-slate-500"><RefreshCw className="size-4 animate-spin motion-reduce:animate-none text-violet-200" />กำลังเชื่อมต่อ Copilot...</div> : !canRead ? <div className="flex h-full min-h-48 flex-col items-center justify-center px-5 text-center"><Bot className="size-8 text-slate-600" /><p className="mt-3 text-sm text-slate-400">บัญชีนี้ยังไม่มีสิทธิ์ดู AI Copilot</p><p className="mt-1 text-[11px] leading-5 text-slate-600">ติดต่อผู้ดูแลระบบเพื่อขอสิทธิ์ ai.read</p></div> : conversation && conversation.messages.length > 0 ? <div className="space-y-3">{conversation.messages.map((message) => <ChatMessage key={message.id} message={message} />)}<div ref={messagesEndRef} /></div> : <div className="flex min-h-full flex-col justify-center py-5 text-center"><Sparkles className="mx-auto size-8 text-violet-200/60" /><p className="mt-3 text-sm text-slate-300">ถามข้อมูลเมืองได้เลย</p><p className="mx-auto mt-1 max-w-[280px] text-[11px] leading-5 text-slate-600">พิมพ์คำถามเกี่ยวกับสถานการณ์เมือง ระบบ CCTV, IoT, Alert หรือ Incident</p>{suggestedQuestions.length > 0 && <div className="mt-4 flex flex-wrap justify-center gap-1.5">{suggestedQuestions.slice(0, 4).map((question) => <button key={question.id} type="button" onClick={() => void sendMessage(question.questionTh)} disabled={!canUse || sending} className="rounded-full border border-violet-200/15 bg-violet-200/[.05] px-2.5 py-1.5 text-left text-[10px] text-violet-100 transition hover:border-violet-200/35 hover:bg-violet-200/[.1] disabled:opacity-45">{question.questionTh}</button>)}</div>}</div>}</div><form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="border-t border-white/[.08] bg-black/10 p-3"><div className="flex items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} disabled={!canRead || !canUse || loading || sending} rows={2} maxLength={4000} placeholder={canUse ? "พิมพ์คำถามของคุณ..." : "บัญชีนี้ไม่มีสิทธิ์ส่งคำถาม"} aria-label="พิมพ์คำถามถึง City Intelligence Copilot" className="min-h-16 flex-1 resize-none rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs leading-5 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-violet-200/50 focus:ring-2 focus:ring-violet-200/10 disabled:opacity-50" /><button type="submit" disabled={!canRead || !canUse || loading || sending || !draft.trim()} className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-300 text-slate-950 transition hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-40" aria-label="ส่งคำถาม">{sending ? <RefreshCw className="size-3.5 animate-spin motion-reduce:animate-none" /> : <Send className="size-3.5" />}</button></div><p className="mt-1.5 text-[9px] text-slate-600">Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่</p></form></div><button type="button" onClick={toggleOpen} className={cn("flex size-11 items-center justify-center rounded-full text-[var(--background-primary)] shadow-[0_0_25px_rgba(167,139,250,.32)] transition hover:scale-105", open ? "bg-violet-200" : "bg-[var(--nt-yellow)] shadow-[0_0_25px_rgba(255,210,0,.22)] hover:bg-[var(--nt-yellow-hover)]")} aria-label={open ? "ปิด City Intelligence Copilot" : "เปิด City Intelligence Copilot"} aria-expanded={open}>{open ? <X className="size-5" /> : <Bot className="size-5" />}</button></div>;
}
