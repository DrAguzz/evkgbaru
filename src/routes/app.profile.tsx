import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, LogOut, Phone, MapPin, Globe, Camera, Loader2, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({ component: AppProfile });

interface Profile { name: string; email: string; phone: string | null; nationality: string | null; avatar_url: string | null }

type EditField = "phone" | "nationality" | "name" | null;

function AppProfile() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<EditField>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name,email,phone,nationality,avatar_url").eq("id", user.id).single()
      .then(({ data }) => setProfile(data as Profile | null));
  }, [user]);

  function startEdit(field: Exclude<EditField, null>) {
    if (!profile) return;
    setEditing(field);
    setDraft((profile[field] as string | null) ?? "");
  }

  async function saveEdit() {
    if (!user || !editing) return;
    setSaving(true);
    const value = draft.trim() || null;
    const payload = { [editing]: value } as Partial<Profile>;
    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    setProfile((p) => p ? { ...p, [editing]: value } as Profile : p);
    toast.success("Saved");
    setEditing(null);
  }

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

  const rows: { field: Exclude<EditField, null> | null; icon: typeof Phone; placeholder: string; value: string | null | undefined; editable: boolean }[] = [
    { field: "phone", icon: Phone, placeholder: "Add phone number", value: profile?.phone, editable: true },
    { field: "nationality", icon: Globe, placeholder: "Add nationality", value: profile?.nationality, editable: true },
    { field: null, icon: MapPin, placeholder: "Location", value: "Kuala Lumpur", editable: false },
  ];

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
        <div className="min-w-0 flex-1">
          {editing === "name" ? (
            <div className="flex items-center gap-2">
              <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="h-9" />
              <button onClick={saveEdit} disabled={saving} className="grid place-items-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => setEditing(null)} className="grid place-items-center w-8 h-8 rounded-full bg-muted text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => startEdit("name")} className="flex items-center gap-1.5 group">
              <span className="font-bold text-lg truncate">{profile?.name ?? "Add name"}</span>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </button>
          )}
          <div className="text-xs text-muted-foreground truncate">{profile?.email}</div>
          <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-primary font-semibold mt-1">
            {profile?.avatar_url ? "Change photo" : "Upload photo"}
          </button>
        </div>
      </div>

      <div className="relative rounded-3xl overflow-hidden border border-white/40 dark:border-white/10 bg-white/55 dark:bg-white/5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <div className="pointer-events-none absolute -top-24 -left-10 w-56 h-56 rounded-full bg-white/40 blur-3xl opacity-60" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 w-56 h-56 rounded-full bg-primary/20 blur-3xl opacity-60" />

        <div className="relative divide-y divide-white/40 dark:divide-white/10">
          {rows.map((r, i) => {
            const isEditing = r.field !== null && editing === r.field;
            return (
              <div key={i} className="flex items-center gap-3 p-4">
                <span className="grid place-items-center w-9 h-9 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur ring-1 ring-white/60 dark:ring-white/15 shadow-sm shrink-0">
                  <r.icon className="w-4 h-4 text-primary" />
                </span>
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={r.placeholder}
                      type={r.field === "phone" ? "tel" : "text"}
                      className="h-9 flex-1"
                      onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(null); }}
                    />
                    <button onClick={saveEdit} disabled={saving} className="grid place-items-center w-8 h-8 rounded-full bg-primary text-primary-foreground shrink-0">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setEditing(null)} className="grid place-items-center w-8 h-8 rounded-full bg-muted text-foreground shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!r.editable}
                    onClick={() => r.editable && r.field && startEdit(r.field)}
                    className="flex items-center justify-between gap-2 flex-1 min-w-0 text-left group disabled:cursor-default"
                  >
                    <span className={`text-sm font-medium truncate ${r.value ? "" : "text-muted-foreground"}`}>
                      {r.value ?? r.placeholder}
                    </span>
                    {r.editable && (
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition shrink-0" />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Button variant="outline" className="w-full rounded-full" onClick={async () => { await signOut(); nav({ to: "/" }); }}>
        <LogOut className="w-4 h-4 mr-2" /> Sign out
      </Button>
    </div>
  );
}
