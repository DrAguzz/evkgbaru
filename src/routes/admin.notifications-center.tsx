import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/admin/notifications-center")({ component: NotifCenter });

const NOTIF_TYPES = [
  { key: "booking_confirmed", label: "Booking confirmation", desc: "Sent when a booking is successfully created." },
  { key: "payment_success", label: "Payment success", desc: "Sent when a payment is verified." },
  { key: "payment_failed", label: "Payment failed", desc: "Sent when a payment attempt fails." },
  { key: "rider_assigned", label: "Rider assigned", desc: "Sent when a rider is assigned to a booking." },
  { key: "booking_reminder", label: "Booking reminder", desc: "Sent 24 hours and 1 hour before departure." },
  { key: "waiting_list_promotion", label: "Waiting list promotion", desc: "Sent when a slot opens up for a waiting customer." },
  { key: "ride_completed", label: "Ride completed", desc: "Sent when the trip is marked complete." },
  { key: "sos_alert", label: "SOS alert", desc: "Broadcast to hub admins and super admins." },
] as const;

const CHANNELS = [
  { key: "inapp", label: "In-app", desc: "Native notifications inside the customer app." },
  { key: "email", label: "Email", desc: "Transactional email (requires provider setup)." },
  { key: "sms", label: "SMS", desc: "Text messages (requires provider setup)." },
] as const;

interface Settings {
  notification_types: Record<string, boolean>;
  notification_channels: Record<string, boolean>;
}

function NotifCenter() {
  const { isSuperAdmin } = useAuth();
  const [s, setS] = useState<Settings | null>(null);

  useEffect(() => {
    supabase.from("app_settings").select("notification_types, notification_channels").eq("id", 1).single()
      .then(({ data }) => setS(data as Settings));
  }, []);

  async function save(next: Settings) {
    setS(next);
    const { error } = await supabase.from("app_settings").update(next).eq("id", 1);
    if (error) return toast.error(error.message);
    await logAudit({ action: "settings_update", entity: "notifications", metadata: next as unknown as Record<string, unknown> });
    toast.success("Saved");
  }

  if (!isSuperAdmin) return <div className="text-center py-20 text-muted-foreground">Only super admins can manage notifications.</div>;
  if (!s) return <div className="p-6">Loading…</div>;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Notifications" subtitle="Control which system notifications are sent and how they're delivered" icon={Bell} />

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-5">
          <div className="font-semibold mb-1">Delivery channels</div>
          <p className="text-xs text-muted-foreground mb-4">In-app is always available. Email/SMS require external provider credentials.</p>
          <div className="grid md:grid-cols-3 gap-3">
            {CHANNELS.map((c) => (
              <label key={c.key} className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border cursor-pointer">
                <Switch
                  checked={!!s.notification_channels[c.key]}
                  onCheckedChange={(v) => save({ ...s, notification_channels: { ...s.notification_channels, [c.key]: v } })}
                />
                <div>
                  <div className="font-medium text-sm">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-5">
          <div className="font-semibold mb-4">System notifications</div>
          <div className="divide-y">
            {NOTIF_TYPES.map((n) => (
              <div key={n.key} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-sm">{n.label}</div>
                  <div className="text-xs text-muted-foreground">{n.desc}</div>
                </div>
                <Switch
                  checked={s.notification_types[n.key] ?? true}
                  onCheckedChange={(v) => save({ ...s, notification_types: { ...s.notification_types, [n.key]: v } })}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
