import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const [splashImage, setSplashImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) { setSplashImage(data.splash_image_url); setTitle(data.splash_title ?? ""); setSubtitle(data.splash_subtitle ?? ""); }
    });
  }, []);

  async function uploadFile(file: File) {
    setBusy(true);
    const ext = file.name.split(".").pop();
    const path = `splash/splash-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("app-assets").upload(path, file, { upsert: true, contentType: file.type });
    if (error) { setBusy(false); return toast.error(error.message); }
    const { data: pub } = supabase.storage.from("app-assets").getPublicUrl(path);
    setSplashImage(pub.publicUrl);
    setBusy(false);
    toast.success("Image uploaded — don't forget to save");
  }

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("app_settings").update({ splash_image_url: splashImage, splash_title: title, splash_subtitle: subtitle, updated_at: new Date().toISOString() }).eq("id", 1);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">App settings</h1>
        <p className="text-sm text-muted-foreground">Customize the mobile splash screen shown to users.</p>
      </div>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-5 space-y-4">
          <Label className="text-base font-semibold">Splash screen</Label>

          <div className="grid md:grid-cols-[200px_1fr] gap-5 items-start">
            <div className="relative aspect-[9/16] w-[200px] rounded-2xl overflow-hidden ring-1 ring-border bg-gradient-to-br from-primary to-primary/60">
              {splashImage ? <img src={splashImage} alt="Splash preview" className="w-full h-full object-cover opacity-70" /> : <div className="w-full h-full grid place-items-center text-primary-foreground/70"><ImageIcon className="w-10 h-10" /></div>}
              <div className="absolute inset-x-0 bottom-0 p-3 text-white text-center bg-gradient-to-t from-black/60 to-transparent">
                <div className="font-bold">{title || "EV Kg Baru"}</div>
                <div className="text-[10px] opacity-90">{subtitle || "Explore KL"}</div>
              </div>
            </div>

            <div className="space-y-3">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
              <Button variant="outline" disabled={busy} onClick={() => fileRef.current?.click()} className="rounded-full"><Upload className="w-4 h-4 mr-2" /> Upload image</Button>
              <div><Label>Image URL</Label><Input value={splashImage ?? ""} onChange={(e) => setSplashImage(e.target.value || null)} placeholder="https://…" /></div>
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="EV Kg Baru" /></div>
              <div><Label>Subtitle</Label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Explore KL on electric bikes" /></div>
            </div>
          </div>

          <Button className="rounded-full" disabled={busy} onClick={save}>Save settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
