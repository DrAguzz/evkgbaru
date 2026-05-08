import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { User, LogOut, Bike, MapPin, Globe } from "lucide-react";

export const Route = createFileRoute("/app/profile")({ component: AppProfile });

function AppProfile() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<{ name: string; email: string; phone: string | null; nationality: string | null } | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name,email,phone,nationality").eq("id", user.id).single().then(({ data }) => setProfile(data));
  }, [user]);

  return (
    <div className="px-5 pt-8 pb-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="grid place-items-center w-16 h-16 rounded-full bg-hero text-primary-foreground"><User className="w-7 h-7" /></div>
        <div>
          <div className="font-bold text-lg">{profile?.name}</div>
          <div className="text-xs text-muted-foreground">{profile?.email}</div>
        </div>
      </div>
      <div className="rounded-2xl bg-card shadow-card divide-y">
        <div className="flex items-center gap-3 p-4"><Bike className="w-4 h-4 text-primary" /><span className="text-sm">{profile?.phone ?? "Add phone number"}</span></div>
        <div className="flex items-center gap-3 p-4"><Globe className="w-4 h-4 text-primary" /><span className="text-sm">{profile?.nationality ?? "Add nationality"}</span></div>
        <div className="flex items-center gap-3 p-4"><MapPin className="w-4 h-4 text-primary" /><span className="text-sm">Kuala Lumpur</span></div>
      </div>
      <Button variant="outline" className="w-full rounded-full" onClick={async () => { await signOut(); nav({ to: "/" }); }}>
        <LogOut className="w-4 h-4 mr-2" /> Sign out
      </Button>
    </div>
  );
}
