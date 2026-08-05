import { hasPermission } from "@/lib/auth/access";
import { requirePageAuth } from "@/lib/auth/guards";
import { AiCopilotClient } from "@/components/ai/ai-copilot-client";
import { getAiWorkspace } from "@/lib/ai/queries";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const auth = await requirePageAuth("ai.read");
  const workspace = await getAiWorkspace(auth.user.id, auth.permissions);
  return <AiCopilotClient initialData={workspace} canUse={hasPermission(auth.user, "ai.use")} />;
}
