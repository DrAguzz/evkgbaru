import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/locations")({ component: AdminLocations });

interface Loc {
  id: string; name: string; type: string; description: string | null;
  address: string | null; latitude: number | null; longitude: number | null;
  image: string | null; status: string;
}

const TYPES = ["checkpoint", "landmark", "rest_stop", "photo_spot"];

function AdminLocations() {
  const [rows, setRows] = useState<Loc[]>([]);
  const [editing, setEditing] = useState<Loc | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [typeF, setTypeF] = useState("all");

  const load = useCallback(async () => {
    const { data } = await supabase.from("locations").select("*").order("name");
    setRows((data ?? []) as Loc[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((r) => {
    if (typeF !== "all" && r.type !== typeF) return false;
    if (q && !`${r.name} ${r.address ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  function newRow() {
    setEditing({ id: "", name: "", type: "checkpoint", description: "", address: "", latitude: null, longitude: null, image: "", status: "active" });
    setOpen(true);
  }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) return toast.error("Name is required");
    const { id, ...payload } = editing;
    const op = id
      ? supabase.from("locations").update(payload).eq("id", id)
      : supabase.from("locations").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Saved"); setOpen(false); setEditing(null); load();
  }

  async function del(row: Loc) {
    if (!confirm(`Delete "${row.name}"?`)) return;
    const { error } = await supabase.from("locations").delete().eq("id", row.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Locations & Checkpoints</h1><p className="text-sm text-muted-foreground">{filtered.length} of {rows.length}</p></div>
        <Button className="rounded-full" onClick={newRow}><Plus className="w-4 h-4 mr-1" /> New location</Button>
      </div>

      <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 rounded-full" />
          </div>
          <Select value={typeF} onValueChange={setTypeF}>
            <SelectTrigger className="w-44 rounded-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((l) => (
          <Card key={l.id} className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary"><MapPin className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{l.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{l.type.replace(/_/g, " ")}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setEditing(l); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => del(l)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
              {l.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{l.description}</p>}
              <div className="mt-2 text-xs text-muted-foreground">{l.address ?? "—"}</div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">No locations.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit location" : "New location"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name *</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Type</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><Label>Address</Label><Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Latitude</Label><Input type="number" step="0.000001" value={editing.latitude ?? ""} onChange={(e) => setEditing({ ...editing, latitude: e.target.value ? Number(e.target.value) : null })} /></div>
                <div><Label>Longitude</Label><Input type="number" step="0.000001" value={editing.longitude ?? ""} onChange={(e) => setEditing({ ...editing, longitude: e.target.value ? Number(e.target.value) : null })} /></div>
              </div>
              <div><Label>Image URL</Label><Input value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></div>
              <Button className="w-full rounded-full" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
