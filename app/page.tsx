import { redirect } from "next/navigation";
import { getCurrentAuthContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Home() {
  const context = await getCurrentAuthContext();
  redirect(context ? "/dashboard" : "/login");
}
