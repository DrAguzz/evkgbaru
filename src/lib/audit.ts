import { supabase } from "@/integrations/supabase/client";

export interface AuditInput {
  action: string;
  entity?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  hub_id?: string | null;
}

let cachedUA: string | null = null;
function getUA() {
  if (cachedUA !== null) return cachedUA;
  cachedUA = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return cachedUA;
}

export async function logAudit(input: AuditInput) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return;
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const actorRole = roleRows?.[0]?.role ?? null;
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      actor_role: actorRole,
      action: input.action,
      entity: input.entity ?? null,
      entity_id: input.entity_id ?? null,
      metadata: (input.metadata ?? {}) as never,
      hub_id: input.hub_id ?? null,
      user_agent: getUA(),
    });
  } catch (e) {
    console.warn("audit log failed", e);
  }
}
