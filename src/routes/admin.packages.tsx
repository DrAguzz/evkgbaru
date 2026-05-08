import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { money } from "@/lib/format";
import { Plus, Pencil, Clock, Users, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/packages")({ component: AdminPackages });

interface Pkg {
  id: string; package_name: string; description: string | null; price: number;
  duration_minutes: number; min_pax: number; max_pax: number; image: string | null;
  status: string;
}

function AdminPackages() {
  const [rows, setRows] = useState<Pkg[]>([]);
  const [editing, setEditing] = useState<Pkg | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("tour_packages").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Pkg[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  function newPkg() {
    setEditing({ id: "", package_name: "", description: "", price: 0, duration_minutes: 120, min_pax: 1, max_pax: 5, image: "", status: "active" });
    setOpen(true);
  }

  async function save() {
    if (!editing) return;
    const payload = { ...editing };
    delete (payload as Partial<Pkg>).id;
    if (editing.id) {
      const { error } = await supabase.from("tour_packages").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("tour_packages").insert(payload);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setOpen(false); setEditing(null); load();
  }

  async function del(p: Pkg) {
    if (!confirm(`Delete "${p.package_name}"?`)) return;
    const { error } = await supabase.from("tour_packages").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Tour packages</h1><p className="text-sm text-muted-foreground">{rows.length} packages</p></div>
        <Button className="rounded-full" onClick={newPkg}><Plus className="w-4 h-4 mr-1" /> New package</Button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((p) => (
          <Card key={p.id} className="rounded-2xl border-0 shadow-card overflow-hidden">
            <div className="aspect-[16/9] bg-muted"><img src={p.image ?? ""} alt="" className="w-full h-full object-cover" /></div>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold">{p.package_name}</div>
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del(p)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {p.duration_minutes}m</span>
                  <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" /> {p.min_pax}-{p.max_pax}</span>
                </div>
                <div className="font-bold">{money(p.price)}</div>
              </div>
              <div className="mt-2"><span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{p.status}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit package" : "New package"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.package_name} onChange={(e) => setEditing({ ...editing, package_name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Price (RM)</Label><Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
                <div><Label>Duration (min)</Label><Input type="number" value={editing.duration_minutes} onChange={(e) => setEditing({ ...editing, duration_minutes: Number(e.target.value) })} /></div>
                <div><Label>Min pax</Label><Input type="number" value={editing.min_pax} onChange={(e) => setEditing({ ...editing, min_pax: Number(e.target.value) })} /></div>
                <div><Label>Max pax</Label><Input type="number" value={editing.max_pax} onChange={(e) => setEditing({ ...editing, max_pax: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Image URL</Label><Input value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></div>
              <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={editing.status === "active"} onCheckedChange={(v) => setEditing({ ...editing, status: v ? "active" : "inactive" })} /></div>
              <Button className="w-full rounded-full" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
