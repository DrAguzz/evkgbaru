import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DEMO_PASSWORD = "demo1234";

const DEMOS = {
  customer: { email: "demo.customer@evkgbaru.test", name: "Demo Customer", role: "customer" as const },
  rider: { email: "demo.rider@evkgbaru.test", name: "Demo Rider", role: "rider" as const },
  hub_admin: { email: "demo.hub@evkgbaru.test", name: "Demo Hub Admin", role: "hub_admin" as const },
  super_admin: { email: "demo.super@evkgbaru.test", name: "Demo Super Admin", role: "super_admin" as const },
};

export const ensureDemoUser = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ role: z.enum(["customer", "rider", "hub_admin", "super_admin"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const info = DEMOS[data.role];

    // Try to find existing user by email
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = list?.users?.find((u) => u.email?.toLowerCase() === info.email.toLowerCase());

    if (!user) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: info.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { name: info.name },
      });
      if (error || !created.user) throw new Response(error?.message ?? "Failed", { status: 500 });
      user = created.user;
    } else {
      // Ensure password is reset to demo
      await supabaseAdmin.auth.admin.updateUserById(user.id, { password: DEMO_PASSWORD });
    }

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: user.id, name: info.name, email: info.email });

    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: user.id, role: info.role }, { onConflict: "user_id,role" });

    return { email: info.email, password: DEMO_PASSWORD };
  });
