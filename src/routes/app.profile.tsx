import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { User, LogOut, Bike, MapPin, Globe, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({ component: AppProfile });

interface Profile { name: string; email: string; phone: string | null; nationality: string | null; avatar_url: string | null }

function AppProfile() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name,email,phone,nationality,avatar_url").eq("id", user.id).single()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image too large (max 5MB)");

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setUploading(false); return toast.error(upErr.message); }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: profErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    setUploading(false);
    if (profErr) return toast.error(profErr.message);
    setProfile((p) => p ? { ...p, avatar_url: url } : p);
    toast.success("Profile picture updated");
  }

  return (
    <div className="px-5 pt-8 pb-24 space-y-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative grid place-items-center w-20 h-20 rounded-full bg-hero text-primary-foreground overflow-hidden ring-2 ring-background shadow-md"
          aria-label="Change profile picture"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile?.name ?? ""} className="w-full h-full object-cover" />
          ) : (
            <User className="w-8 h-8" />
          )}
          <span className="absolute bottom-0 right-0 grid place-items-center w-7 h-7 rounded-full bg-primary text-primary-foreground ring-2 ring-background">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
        <div className="min-w-0">
          <div className="font-bold text-lg truncate">{profile?.name}</div>
          <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-primary font-semibold mt-1">
            {profile?.avatar_url ? "Change photo" : "Upload photo"}
          </button>
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
