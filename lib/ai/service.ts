import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { serializeJsonText } from "@/lib/db/legacy-json";
import { buildAiReply } from "@/lib/ai/runtime";
import { getAiContext, getAiConversation } from "@/lib/ai/queries";
import type { AiConversationDetail, AiModule } from "@/lib/ai/types";

export async function findOwnedConversation(userId: string, id: string) {
  return prisma.aiConversation.findFirst({ where: { userId, deletedAt: null, OR: [{ id }, { publicId: id }] }, select: { id: true, publicId: true, title: true, contextModule: true } });
}

export async function createAiConversation(userId: string, input: { title?: string; contextModule?: AiModule }): Promise<AiConversationDetail> {
  const conversation = await prisma.aiConversation.create({ data: { publicId: randomUUID(), userId, title: input.title || "แชทใหม่", contextModule: input.contextModule || "command-center" } });
  const detail = (await getAiConversation(userId, conversation.id)).data;
  if (!detail) throw new Error("Created AI conversation could not be loaded");
  return detail;
}

export async function sendAiMessage(userId: string, conversationId: string, content: string, permissions: string[]): Promise<AiConversationDetail> {
  const conversation = await findOwnedConversation(userId, conversationId);
  if (!conversation) throw new Error("AI conversation not found");
  const context = (await getAiContext(permissions)).data;
  const reply = buildAiReply(content, context);
  const now = new Date();
  const nextTitle = conversation.title === "แชทใหม่" ? content.slice(0, 80) : conversation.title;
  await prisma.$transaction(async (transaction) => {
    await transaction.aiMessage.create({ data: { conversationId: conversation.id, role: "USER", content, status: "COMPLETED", createdAt: now } });
    await transaction.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: reply.content,
        status: "COMPLETED",
        structuredJson: serializeJsonText(reply.structured),
        createdAt: new Date(now.getTime() + 1),
        sources: { create: reply.sources.map((source) => ({ id: randomUUID(), sourceModule: source.sourceModule, sourceType: source.sourceType, sourceName: source.sourceName, sourceTimestamp: source.sourceTimestamp ? new Date(source.sourceTimestamp) : null, sourceUrl: source.sourceUrl })) },
      },
    });
    await transaction.aiConversation.update({ where: { id: conversation.id }, data: { title: nextTitle, lastMessageAt: now } });
  });
  const detail = (await getAiConversation(userId, conversation.id)).data;
  if (!detail) throw new Error("AI conversation could not be loaded after sending a message");
  return detail;
}

export async function updateAiConversation(userId: string, id: string, input: { title?: string; isPinned?: boolean }): Promise<AiConversationDetail | null> {
  const conversation = await findOwnedConversation(userId, id);
  if (!conversation) return null;
  await prisma.aiConversation.update({ where: { id: conversation.id }, data: { ...(input.title !== undefined ? { title: input.title } : {}), ...(input.isPinned !== undefined ? { isPinned: input.isPinned } : {}) } });
  return (await getAiConversation(userId, conversation.id)).data;
}

export async function archiveAiConversation(userId: string, id: string) {
  const conversation = await findOwnedConversation(userId, id);
  if (!conversation) return null;
  await prisma.aiConversation.update({ where: { id: conversation.id }, data: { deletedAt: new Date(), isPinned: false } });
  return conversation;
}
