import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bike, Star, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rider/profile")({ component: RiderProfile });

interface R { id: string; name: string; phone: string | null; vehicle_id: string | null; vehicle_type: string | null; status: string; rating: number; commission_rate: number; }

function RiderProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [r, setR] = useState<R | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("riders").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setR(data as R | null));
  }, [user]);

  if (!r) return <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>;

  const isAvailable = r.status === "available";

  async function toggle(v: boolean) {
    const status = v ? "available" : "offline";
    await supabase.from("riders").update({ status }).eq("id", r!.id);
    setR({ ...r!, status });
    toast.success(v ? "You're online" : "You're offline");
  }

  return (
    <div className="px-5 pt-8 pb-6">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-14 h-14 rounded-2xl bg-hero text-primary-foreground"><Bike className="w-6 h-6" /></div>
        <div>
          <div className="text-lg font-bold">{r.name}</div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" /> {Number(r.rating).toFixed(1)} rating</div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-card shadow-card p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">Available for tours</div>
          <div className="text-xs text-muted-foreground">{isAvailable ? "You'll receive new assignments" : "You won't get new tours"}</div>
        </div>
        <Switch checked={isAvailable} onCheckedChange={toggle} />
      </div>

      <div className="mt-4 rounded-2xl bg-card shadow-card p-4 space-y-2 text-sm">
        <Row k="Phone" v={r.phone ?? "—"} />
        <Row k="Vehicle" v={`${r.vehicle_type ?? ""} · ${r.vehicle_id ?? "—"}`} />
        <Row k="Commission" v={`${(Number(r.commission_rate) * 100).toFixed(0)}%`} />
        <Row k="Email" v={user?.email ?? ""} />
      </div>

      <Button variant="outline" className="w-full rounded-full mt-6" onClick={async () => { await signOut(); navigate({ to: "/" }); }}>
        <LogOut className="w-4 h-4 mr-1" /> Sign out
      </Button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>;
}
