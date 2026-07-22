import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ChevronLeft, Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/app/notifications")({ component: AppNotifications });

interface Notif { id: string; title: string; message: string | null; type: string | null; status: string; created_at: string; }

function AppNotifications() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Notif[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications")
      .select("id,title,message,type,status,created_at")
      .eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
    setRows(data ?? []);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications").update({ status: "read" }).eq("user_id", user.id).eq("status", "unread");
    void load();
  }
  async function markRead(id: string) {
    await supabase.from("notifications").update({ status: "read" }).eq("id", id);
    void load();
  }

  return (
    <div className="px-5 pt-8 pb-24">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => nav({ to: "/app/profile" })} className="grid place-items-center w-10 h-10 rounded-full bg-accent">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <Button variant="ghost" size="sm" onClick={markAllRead}><CheckCheck className="w-4 h-4 mr-1" /> Mark all</Button>
      </div>
      <h1 className="text-xl font-bold mb-4">Notifications</h1>
      {rows.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="text-sm">No notifications yet</div>
        </div>
      )}
      <div className="space-y-2">
        {rows.map((n) => (
          <button key={n.id} onClick={() => markRead(n.id)}
            className={`w-full text-left rounded-2xl border p-3 transition ${n.status === "unread" ? "bg-primary/5 border-primary/30" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-sm">{n.title}</div>
              {n.status === "unread" && <span className="w-2 h-2 rounded-full bg-primary mt-1.5" />}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
