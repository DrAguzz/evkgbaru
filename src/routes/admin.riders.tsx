import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bike, Plus, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/riders")({ component: AdminRiders });

interface Rider {
  id: string; name: string; phone: string | null; vehicle_id: string | null; vehicle_type: string | null;
  status: string; rating: number; commission_rate: number; hub_id: string | null;
  hubs: { name: string } | null;
}
interface Hub { id: string; name: string; }

function AdminRiders() {
  const [rows, setRows] = useState<Rider[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [editing, setEditing] = useState<Rider | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("riders").select("*, hubs(name)").order("name");
    setRows((data ?? []) as unknown as Rider[]);
  }, []);
  useEffect(() => { load(); supabase.from("hubs").select("id, name").then(({ data }) => setHubs(data ?? [])); }, [load]);

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name is required");
    const { hubs: _h, id, ...payload } = editing;
    void _h;
    const op = id
      ? supabase.from("riders").update(payload).eq("id", id)
      : supabase.from("riders").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Saved"); setOpen(false); setEditing(null); load();
  }

  async function del(r: Rider) {
    if (!confirm(`Delete rider "${r.name}"?`)) return;
    const { error } = await supabase.from("riders").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Riders</h1><p className="text-sm text-muted-foreground">{rows.length} riders</p></div>
        <Button className="rounded-full" onClick={() => { setEditing({ id: "", name: "", phone: "", vehicle_id: "", vehicle_type: "e-bike", status: "available", rating: 5, commission_rate: 0.2, hub_id: hubs[0]?.id ?? null, hubs: null }); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New rider
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <Card key={r.id} className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid place-items-center w-11 h-11 rounded-xl bg-hero text-primary-foreground"><Bike className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" /> {Number(r.rating).toFixed(1)}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => del(r)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                <div>Hub: {r.hubs?.name ?? "—"}</div>
                <div>Vehicle: {r.vehicle_type} · {r.vehicle_id ?? "—"}</div>
                <div>Phone: {r.phone ?? "—"}</div>
              </div>
              <div className="mt-2"><span className={`text-xs px-2 py-0.5 rounded-full capitalize ${r.status === "available" ? "bg-success/10 text-success" : r.status === "assigned" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"}`}>{r.status}</span></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit rider" : "New rider"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
                <div><Label>Vehicle ID</Label><Input value={editing.vehicle_id ?? ""} onChange={(e) => setEditing({ ...editing, vehicle_id: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Hub</Label>
                  <Select value={editing.hub_id ?? ""} onValueChange={(v) => setEditing({ ...editing, hub_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select hub" /></SelectTrigger>
                    <SelectContent>{hubs.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Status</Label>
                  <Select value={editing.status} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Commission rate (0-1)</Label><Input type="number" step="0.05" value={editing.commission_rate} onChange={(e) => setEditing({ ...editing, commission_rate: Number(e.target.value) })} /></div>
              <Button className="w-full rounded-full" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
