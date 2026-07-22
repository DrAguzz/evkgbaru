import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type SB = SupabaseClient<Database>;

async function assertSuperAdmin(sb: SB, userId: string) {
  const { data, error } = await sb.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Response(error.message, { status: 500 });
  const roles = (data ?? []).map((r) => r.role as string);
  if (!roles.includes("super_admin") && !roles.includes("admin")) {
    throw new Response("Forbidden: super admin only", { status: 403 });
  }
}

async function assertAdminOfHub(sb: SB, userId: string, hubId: string | null) {
  const { data, error } = await sb.from("user_roles").select("role, hub_id").eq("user_id", userId);
  if (error) throw new Response(error.message, { status: 500 });
  const rows = (data ?? []) as { role: string; hub_id: string | null }[];
  const isSuper = rows.some((r) => r.role === "super_admin" || r.role === "admin");
  if (isSuper) return;
  const isHubAdmin =
    hubId != null &&
    rows.some((r) => (r.role === "hub_admin" || r.role === "hub_manager") && r.hub_id === hubId);
  if (!isHubAdmin) throw new Response("Forbidden", { status: 403 });
}

export const approveRiderApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        applicationId: z.string().uuid(),
        password: z.string().min(6),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as SB;
    const { data: app, error: appErr } = await sb
      .from("rider_applications")
      .select("*")
      .eq("id", data.applicationId)
      .maybeSingle();
    if (appErr || !app) throw new Response(appErr?.message ?? "Application not found", { status: 404 });

    await assertAdminOfHub(sb, context.userId, app.hub_id);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email: app.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: app.full_name, phone: app.phone },
    });
    if (cErr || !created.user)
      throw new Response(cErr?.message ?? "User creation failed", { status: 400 });
    const uid = created.user.id;

    await supabaseAdmin.from("profiles").upsert({
      id: uid,
      name: app.full_name,
      email: app.email,
      phone: app.phone,
      avatar_url: app.photo_url,
    });

    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid).eq("role", "customer");
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: uid, role: "rider", hub_id: app.hub_id }, { onConflict: "user_id,role" });

    const { error: rErr } = await supabaseAdmin.from("riders").insert({
      user_id: uid,
      name: app.full_name,
      phone: app.phone,
      hub_id: app.hub_id,
      employment_type: app.employment_type,
      application_id: data.applicationId,
      status: "available",
    });
    if (rErr) throw new Response(rErr.message, { status: 400 });

    await supabaseAdmin
      .from("rider_applications")
      .update({ status: "approved", reviewer_id: context.userId })
      .eq("id", data.applicationId);

    return { ok: true, userId: uid };
  });

export const setApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        applicationId: z.string().uuid(),
        status: z.enum(["submitted", "under_review", "interview_scheduled", "rejected"]),
        notes: z.string().optional(),
        interviewAt: z.string().optional().nullable(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as SB;
    const { data: app } = await sb
      .from("rider_applications")
      .select("hub_id")
      .eq("id", data.applicationId)
      .maybeSingle();
    await assertAdminOfHub(sb, context.userId, app?.hub_id ?? null);

    const patch: {
      status: "submitted" | "under_review" | "interview_scheduled" | "rejected";
      reviewer_id: string;
      review_notes?: string;
      interview_at?: string | null;
    } = { status: data.status, reviewer_id: context.userId };
    if (data.notes !== undefined) patch.review_notes = data.notes;
    if (data.interviewAt !== undefined) patch.interview_at = data.interviewAt;

    const { error } = await sb.from("rider_applications").update(patch).eq("id", data.applicationId);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true };
  });

export const createHubAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        phone: z.string().optional().nullable(),
        hubId: z.string().uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as unknown as SB;
    await assertSuperAdmin(sb, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, phone: data.phone ?? null },
    });
    if (error || !created.user) throw new Response(error?.message ?? "Create failed", { status: 400 });
    const uid = created.user.id;

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: uid, name: data.name, email: data.email, phone: data.phone ?? null });

    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid).eq("role", "customer");
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: uid, role: "hub_admin", hub_id: data.hubId }, { onConflict: "user_id,role" });

    return { ok: true, userId: uid };
  });
