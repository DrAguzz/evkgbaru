import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Trash2, ArrowUp, ArrowDown, Plus, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

type Slide = {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
};

function AdminSettings() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase
      .from("splash_screens")
      .select("*")
      .order("sort_order", { ascending: true });
    setSlides(data ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function uploadFile(file: File) {
    setBusy(true);
    const ext = file.name.split(".").pop();
    const path = `splash/splash-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("app-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setBusy(false);
      return toast.error(upErr.message);
    }
    const { data: pub } = supabase.storage.from("app-assets").getPublicUrl(path);
    const nextOrder = slides.length ? Math.max(...slides.map((s) => s.sort_order)) + 1 : 0;
    const { error } = await supabase.from("splash_screens").insert({
      image_url: pub.publicUrl,
      title: "",
      subtitle: "",
      sort_order: nextOrder,
    });
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
    toast.success("Deleted");
    load();
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = slides.findIndex((s) => s.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= slides.length) return;
    const a = slides[idx];
    const b = slides[j];
    await Promise.all([
      supabase.from("splash_screens").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("splash_screens").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    load();
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Splash screens</h1>
          <p className="text-sm text-muted-foreground">
            Upload one or more onboarding slides. Users can swipe through with Next, or Skip / Login / Register.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
        <Button disabled={busy} onClick={() => fileRef.current?.click()} className="rounded-full shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Add slide
        </Button>
      </div>

      {slides.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-10 text-center text-muted-foreground">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-60" />
            No splash screens yet. Click <b>Add slide</b> to upload your first image.
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
                  <div className="absolute top-2 left-2 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full">
                    #{idx + 1}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={s.title ?? ""}
                      onChange={(e) => setSlides((arr) => arr.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))}
                      onBlur={(e) => updateSlide(s.id, { title: e.target.value })}
                      placeholder="EV Kg Baru"
                    />
                  </div>
                  <div>
                    <Label>Subtitle</Label>
                    <Input
                      value={s.subtitle ?? ""}
                      onChange={(e) => setSlides((arr) => arr.map((x) => (x.id === s.id ? { ...x, subtitle: e.target.value } : x)))}
                      onBlur={(e) => updateSlide(s.id, { subtitle: e.target.value })}
                      placeholder="Explore KL on electric bikes"
                    />
                  </div>
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={s.image_url}
                      onChange={(e) => setSlides((arr) => arr.map((x) => (x.id === s.id ? { ...x, image_url: e.target.value } : x)))}
                      onBlur={(e) => updateSlide(s.id, { image_url: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex md:flex-col gap-2 justify-end">
                  <Button size="icon" variant="outline" disabled={idx === 0} onClick={() => move(s.id, -1)} className="rounded-full">
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" disabled={idx === slides.length - 1} onClick={() => move(s.id, 1)} className="rounded-full">
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" onClick={() => remove(s.id)} className="rounded-full text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button variant="outline" disabled={busy} onClick={() => fileRef.current?.click()} className="rounded-full">
        <Upload className="w-4 h-4 mr-2" /> Upload another slide
      </Button>
    </div>
  );
}
