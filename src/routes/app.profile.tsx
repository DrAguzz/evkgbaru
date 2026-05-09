import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  User, LogOut, Phone, MapPin, Globe, Camera, Loader2, Check, X, Pencil,
  FileText, Bell, Settings, ChevronRight, Moon, Sun,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/profile")({ component: AppProfile });

interface Profile { name: string; email: string; phone: string | null; nationality: string | null; avatar_url: string | null }
type EditField = "phone" | "name" | null;

const COUNTRIES = [
  "Malaysia", "Singapore", "Indonesia", "Thailand", "Vietnam", "Philippines", "Brunei",
  "Australia", "New Zealand", "Japan", "South Korea", "China", "Hong Kong", "Taiwan", "India",
  "United Kingdom", "Germany", "France", "Italy", "Spain", "Netherlands",
  "United States", "Canada", "Mexico", "Brazil", "Saudi Arabia", "United Arab Emirates", "Other",
];

function AppProfile() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<EditField>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [unread, setUnread] = useState(0);

  // App settings (persisted in localStorage)
  const [darkMode, setDarkMode] = useState<boolean>(() => typeof window !== "undefined" && document.documentElement.classList.contains("dark"));
  const [pushNotif, setPushNotif] = useState<boolean>(() => typeof window !== "undefined" && localStorage.getItem("pref_push") !== "0");
  const [emailNotif, setEmailNotif] = useState<boolean>(() => typeof window !== "undefined" && localStorage.getItem("pref_email") !== "0");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name,email,phone,nationality,avatar_url").eq("id", user.id).single()
      .then(({ data }) => setProfile(data as Profile | null));
    supabase.from("notifications").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).eq("status", "unread")
      .then(({ count }) => setUnread(count ?? 0));
  }, [user]);

  function toggleDark(v: boolean) {
    setDarkMode(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("pref_dark", v ? "1" : "0");
  }
  function togglePush(v: boolean) { setPushNotif(v); localStorage.setItem("pref_push", v ? "1" : "0"); toast.success(v ? "Push enabled" : "Push disabled"); }
  function toggleEmail(v: boolean) { setEmailNotif(v); localStorage.setItem("pref_email", v ? "1" : "0"); toast.success(v ? "Email enabled" : "Email disabled"); }

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

  async function saveNationality(value: string) {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ nationality: value }).eq("id", user.id);
    if (error) return toast.error(error.message);
    setProfile((p) => p ? { ...p, nationality: value } : p);
    toast.success("Nationality updated");
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

  return (
    <div className="px-5 pt-8 pb-28 space-y-4">
      {/* Avatar + name */}
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

      {/* Personal info card */}
      <SectionCard title="Personal info">
        {/* Phone */}
        <Row icon={Phone} label="Phone">
          {editing === "phone" ? (
            <InlineEditor draft={draft} setDraft={setDraft} type="tel" placeholder="Add phone number" onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving} />
          ) : (
            <button onClick={() => startEdit("phone")} className="flex items-center justify-between gap-2 flex-1 group">
              <span className={`text-sm font-medium truncate ${profile?.phone ? "" : "text-muted-foreground"}`}>{profile?.phone ?? "Add phone number"}</span>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
            </button>
          )}
        </Row>

        {/* Nationality dropdown */}
        <Row icon={Globe} label="Nationality">
          <Select value={profile?.nationality ?? undefined} onValueChange={saveNationality}>
            <SelectTrigger className="h-9 border-0 bg-transparent focus:ring-0 px-0 shadow-none">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </Row>

        {/* Location (read-only) */}
        <Row icon={MapPin} label="Location">
          <span className="text-sm font-medium">Kuala Lumpur</span>
        </Row>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications">
        <Row icon={Bell} label="Notifications">
          <Link to="/app/profile" className="flex items-center justify-between flex-1 -my-1">
            <span className="text-sm font-medium">Inbox</span>
            <span className="flex items-center gap-2">
              {unread > 0 && <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">{unread}</span>}
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </span>
          </Link>
        </Row>
        <Row icon={Bell} label="Push notifications">
          <Switch checked={pushNotif} onCheckedChange={togglePush} />
        </Row>
        <Row icon={Bell} label="Email updates">
          <Switch checked={emailNotif} onCheckedChange={toggleEmail} />
        </Row>
      </SectionCard>

      {/* App settings */}
      <SectionCard title="App settings">
        <Row icon={darkMode ? Moon : Sun} label="Dark mode">
          <Switch checked={darkMode} onCheckedChange={toggleDark} />
        </Row>
        <Row icon={Settings} label="Language">
          <span className="text-sm font-medium text-muted-foreground">English</span>
        </Row>

        {/* Terms & Conditions dialog */}
        <Dialog>
          <DialogTrigger asChild>
            <button type="button" className="w-full flex items-center gap-3 p-4 hover:bg-white/30 dark:hover:bg-white/5 transition text-left">
              <span className="grid place-items-center w-9 h-9 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur ring-1 ring-white/60 dark:ring-white/15 shadow-sm shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </span>
              <span className="text-sm font-medium flex-1">Terms & Conditions</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Terms & Conditions</DialogTitle>
              <DialogDescription>Last updated: 9 May 2026</DialogDescription>
            </DialogHeader>
            <div className="text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p><strong className="text-foreground">1. Acceptance of Terms.</strong> By using EV Kg Baru you agree to these terms. If you do not agree, please discontinue use of the platform.</p>
              <p><strong className="text-foreground">2. Bookings & Payments.</strong> All bookings are subject to availability. Payments are processed securely; refunds follow our cancellation policy.</p>
              <p><strong className="text-foreground">3. Safety.</strong> Riders must wear helmets, follow Malaysian traffic laws, and comply with rider instructions throughout the tour.</p>
              <p><strong className="text-foreground">4. Liability.</strong> EV Kg Baru is not liable for injury or loss arising from negligence, weather, or third-party actions.</p>
              <p><strong className="text-foreground">5. Privacy.</strong> Your data is handled according to our Privacy Policy and used only to deliver the service.</p>
              <p><strong className="text-foreground">6. Conduct.</strong> Abusive, illegal, or unsafe behaviour will result in immediate termination of service without refund.</p>
              <p><strong className="text-foreground">7. Changes.</strong> We may update these terms at any time. Continued use indicates acceptance of the updated terms.</p>
              <p>Contact: hello@evkgbaru.my · WhatsApp +60 12-345 6789</p>
            </div>
          </DialogContent>
        </Dialog>
      </SectionCard>

      <Button variant="outline" className="w-full rounded-full" onClick={async () => { await signOut(); nav({ to: "/" }); }}>
        <LogOut className="w-4 h-4 mr-2" /> Sign out
      </Button>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-2">{title}</div>
      <div className="relative rounded-3xl overflow-hidden border border-white/40 dark:border-white/10 bg-white/55 dark:bg-white/5 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18),inset_0_1px_0_0_rgba(255,255,255,0.6)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        <div className="pointer-events-none absolute -top-24 -left-10 w-56 h-56 rounded-full bg-white/40 blur-3xl opacity-60" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 w-56 h-56 rounded-full bg-primary/20 blur-3xl opacity-60" />
        <div className="relative divide-y divide-white/40 dark:divide-white/10">{children}</div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="grid place-items-center w-9 h-9 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur ring-1 ring-white/60 dark:ring-white/15 shadow-sm shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </span>
      <span className="sr-only">{label}</span>
      <div className="flex-1 min-w-0 flex items-center justify-end">{children}</div>
    </div>
  );
}

function InlineEditor({ draft, setDraft, type, placeholder, onSave, onCancel, saving }: {
  draft: string; setDraft: (v: string) => void; type: string; placeholder: string;
  onSave: () => void; onCancel: () => void; saving: boolean;
}) {
  return (
    <div className="flex items-center gap-2 flex-1">
      <Input
        autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
        type={type} placeholder={placeholder} className="h-9 flex-1"
        onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }}
      />
      <button onClick={onSave} disabled={saving} className="grid place-items-center w-8 h-8 rounded-full bg-primary text-primary-foreground shrink-0">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
      </button>
      <button onClick={onCancel} className="grid place-items-center w-8 h-8 rounded-full bg-muted text-foreground shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
