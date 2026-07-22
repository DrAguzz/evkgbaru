import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Trash2, ArrowUp, ArrowDown, Plus, ImageIcon, Settings, Save } from "lucide-react";
import { toast } from "sonner";
import { logAudit } from "@/lib/audit";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

type Slide = { id: string; image_url: string; title: string | null; subtitle: string | null; sort_order: number };

interface AppSettings {
  pickup_rate_per_km: number;
  free_pickup_km: number;
  waiting_list_response_minutes: number;
  waiting_expire_minutes: number;
  cancellation_hours: number;
  cancellation_fee_pct: number;
  default_slot_minutes: number;
  default_insurance_provider: string;
  operating_hours_note: string | null;
  payment_methods: { fpx: boolean; card: boolean; ewallet: boolean; cash: boolean };
}

function AdminSettings() {
  const { isSuperAdmin } = useAuth();
  if (!isSuperAdmin) return <div className="text-center py-20 text-muted-foreground">Only super admins can change settings.</div>;
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Settings" subtitle="Global system configuration" icon={Settings} />
      <Tabs defaultValue="operations">
        <TabsList className="rounded-full">
          <TabsTrigger value="operations" className="rounded-full">Operations</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-full">Payments</TabsTrigger>
          <TabsTrigger value="splash" className="rounded-full">Splash screens</TabsTrigger>
        </TabsList>
        <TabsContent value="operations" className="mt-4"><OperationsTab /></TabsContent>
        <TabsContent value="payments" className="mt-4"><PaymentsTab /></TabsContent>
        <TabsContent value="splash" className="mt-4"><SplashTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ============================================================ */

function OperationsTab() {
  const [s, setS] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("id", 1).single().then(({ data }) => setS(data as unknown as AppSettings));
  }, []);

  async function save() {
    if (!s) return;
    setSaving(true);
    const { error } = await supabase.from("app_settings").update({
      pickup_rate_per_km: s.pickup_rate_per_km,
      free_pickup_km: s.free_pickup_km,
      waiting_list_response_minutes: s.waiting_list_response_minutes,
      waiting_expire_minutes: s.waiting_expire_minutes,
      cancellation_hours: s.cancellation_hours,
      cancellation_fee_pct: s.cancellation_fee_pct,
      default_slot_minutes: s.default_slot_minutes,
      default_insurance_provider: s.default_insurance_provider,
      operating_hours_note: s.operating_hours_note,
    }).eq("id", 1);
    setSaving(false);
    if (error) return toast.error(error.message);
    await logAudit({ action: "settings_update", entity: "app_settings", metadata: { section: "operations" } });
    toast.success("Saved");
  }

  if (!s) return <div className="p-6">Loading…</div>;

  return (
    <Card className="rounded-2xl border-0 shadow-card">
      <CardContent className="p-5 grid md:grid-cols-2 gap-5">
        <Field label="Pickup rate per km (RM)"><Input type="number" step="0.10" value={s.pickup_rate_per_km} onChange={(e) => setS({ ...s, pickup_rate_per_km: Number(e.target.value) })} /></Field>
        <Field label="Free pickup within (km)"><Input type="number" step="0.5" value={s.free_pickup_km} onChange={(e) => setS({ ...s, free_pickup_km: Number(e.target.value) })} /></Field>
        <Field label="Waiting-list response window (min)"><Input type="number" value={s.waiting_list_response_minutes} onChange={(e) => setS({ ...s, waiting_list_response_minutes: Number(e.target.value) })} /></Field>
        <Field label="Waiting-list expiry (min)"><Input type="number" value={s.waiting_expire_minutes} onChange={(e) => setS({ ...s, waiting_expire_minutes: Number(e.target.value) })} /></Field>
        <Field label="Free-cancellation window (hours)"><Input type="number" value={s.cancellation_hours} onChange={(e) => setS({ ...s, cancellation_hours: Number(e.target.value) })} /></Field>
        <Field label="Late cancellation fee (%)"><Input type="number" value={s.cancellation_fee_pct} onChange={(e) => setS({ ...s, cancellation_fee_pct: Number(e.target.value) })} /></Field>
        <Field label="Default slot duration (min)"><Input type="number" value={s.default_slot_minutes} onChange={(e) => setS({ ...s, default_slot_minutes: Number(e.target.value) })} /></Field>
        <Field label="Default insurance provider"><Input value={s.default_insurance_provider} onChange={(e) => setS({ ...s, default_insurance_provider: e.target.value })} /></Field>
        <div className="md:col-span-2">
          <Field label="Operating hours note"><Textarea value={s.operating_hours_note ?? ""} onChange={(e) => setS({ ...s, operating_hours_note: e.target.value })} placeholder="e.g. Daily 8am – 8pm · Closed on public holidays" /></Field>
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" /> Save changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentsTab() {
  const [pm, setPm] = useState<AppSettings["payment_methods"] | null>(null);

  useEffect(() => {
    supabase.from("app_settings").select("payment_methods").eq("id", 1).single()
      .then(({ data }) => setPm((data?.payment_methods ?? { fpx: true, card: true, ewallet: true, cash: false }) as AppSettings["payment_methods"]));
  }, []);

  async function toggle(k: keyof AppSettings["payment_methods"], v: boolean) {
    if (!pm) return;
    const next = { ...pm, [k]: v };
    setPm(next);
    const { error } = await supabase.from("app_settings").update({ payment_methods: next }).eq("id", 1);
    if (error) return toast.error(error.message);
    await logAudit({ action: "settings_update", entity: "payment_methods", metadata: next });
    toast.success("Saved");
  }

  if (!pm) return <div className="p-6">Loading…</div>;

  const methods: Array<{ k: keyof AppSettings["payment_methods"]; label: string; desc: string }> = [
    { k: "fpx", label: "FPX / Online banking", desc: "Malaysia bank transfers via FPX." },
    { k: "card", label: "Credit / Debit card", desc: "Visa, Mastercard, Amex." },
    { k: "ewallet", label: "E-wallet", desc: "Touch 'n Go, GrabPay, Boost, ShopeePay." },
    { k: "cash", label: "Cash on arrival", desc: "Collected at the hub before ride." },
  ];

  return (
    <Card className="rounded-2xl border-0 shadow-card">
      <CardContent className="p-5">
        <div className="font-semibold mb-1">Accepted payment methods</div>
        <p className="text-xs text-muted-foreground mb-4">Turn checkout options on or off across the customer app.</p>
        <div className="divide-y">
          {methods.map((m) => (
            <div key={m.k} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium text-sm">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </div>
              <Switch checked={pm[m.k]} onCheckedChange={(v) => toggle(m.k, v)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SplashTab() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase.from("splash_screens").select("*").order("sort_order", { ascending: true });
    setSlides(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function uploadFile(file: File) {
    setBusy(true);
    const ext = file.name.split(".").pop();
    const path = `splash/splash-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("app-assets").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setBusy(false); return toast.error(upErr.message); }
    const { data: pub } = supabase.storage.from("app-assets").getPublicUrl(path);
    const nextOrder = slides.length ? Math.max(...slides.map((s) => s.sort_order)) + 1 : 0;
    const { error } = await supabase.from("splash_screens").insert({ image_url: pub.publicUrl, title: "", subtitle: "", sort_order: nextOrder });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Slide added");
    load();
  }
  async function updateSlide(id: string, patch: Partial<Slide>) {
    setSlides((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    await supabase.from("splash_screens").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
  }
  async function remove(id: string) {
    if (!confirm("Delete this slide?")) return;
    const { error } = await supabase.from("splash_screens").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  }
  async function move(id: string, dir: -1 | 1) {
    const idx = slides.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= slides.length) return;
    const a = slides[idx]; const b = slides[j];
    await Promise.all([
      supabase.from("splash_screens").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("splash_screens").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); if (fileRef.current) fileRef.current.value = ""; }} />
        <Button disabled={busy} onClick={() => fileRef.current?.click()} className="rounded-full"><Plus className="w-4 h-4 mr-1" /> Add slide</Button>
      </div>
      {slides.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-60" />No splash screens yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {slides.map((s, idx) => (
            <Card key={s.id} className="rounded-2xl border-0 shadow-card overflow-hidden">
              <CardContent className="p-4 grid md:grid-cols-[180px_1fr_auto] gap-4 items-start">
                <div className="relative aspect-[9/16] w-[180px] rounded-xl overflow-hidden ring-1 ring-border bg-gradient-to-br from-primary to-primary/60">
                  <img src={s.image_url} alt="" className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-x-0 bottom-0 p-2 text-white text-center bg-gradient-to-t from-black/70 to-transparent">
                    <div className="font-bold text-sm truncate">{s.title || "Title"}</div>
                    <div className="text-[10px] opacity-90 truncate">{s.subtitle || "Subtitle"}</div>
                  </div>
                  <div className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full">#{idx + 1}</div>
                </div>
                <div className="space-y-3">
                  <Field label="Title"><Input value={s.title ?? ""} onChange={(e) => setSlides((arr) => arr.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))} onBlur={(e) => updateSlide(s.id, { title: e.target.value })} /></Field>
                  <Field label="Subtitle"><Input value={s.subtitle ?? ""} onChange={(e) => setSlides((arr) => arr.map((x) => (x.id === s.id ? { ...x, subtitle: e.target.value } : x)))} onBlur={(e) => updateSlide(s.id, { subtitle: e.target.value })} /></Field>
                  <Field label="Image URL"><Input value={s.image_url} onChange={(e) => setSlides((arr) => arr.map((x) => (x.id === s.id ? { ...x, image_url: e.target.value } : x)))} onBlur={(e) => updateSlide(s.id, { image_url: e.target.value })} /></Field>
                </div>
                <div className="flex md:flex-col gap-2 justify-end">
                  <Button size="icon" variant="outline" disabled={idx === 0} onClick={() => move(s.id, -1)} className="rounded-full"><ArrowUp className="w-4 h-4" /></Button>
                  <Button size="icon" variant="outline" disabled={idx === slides.length - 1} onClick={() => move(s.id, 1)} className="rounded-full"><ArrowDown className="w-4 h-4" /></Button>
                  <Button size="icon" variant="outline" onClick={() => remove(s.id)} className="rounded-full text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
