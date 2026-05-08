import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, Plus, Trash2, MapPin, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/routes")({ component: AdminRoutes });

interface Pkg { id: string; package_name: string; }
interface Loc { id: string; name: string; }
interface RouteRow { id: string; sequence_no: number; estimated_minutes: number; location_id: string; locations: { name: string } | null; }

function AdminRoutes() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [locations, setLocations] = useState<Loc[]>([]);
  const [pkgId, setPkgId] = useState<string>("");
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [newLoc, setNewLoc] = useState("");
  const [newMins, setNewMins] = useState(15);

  useEffect(() => {
    supabase.from("tour_packages").select("id, package_name").order("package_name").then(({ data }) => {
      setPackages(data ?? []);
      if (data?.[0] && !pkgId) setPkgId(data[0].id);
    });
    supabase.from("locations").select("id, name").order("name").then(({ data }) => setLocations(data ?? []));
  }, [pkgId]);

  const load = useCallback(async () => {
    if (!pkgId) return;
    const { data } = await supabase.from("package_routes")
      .select("id, sequence_no, estimated_minutes, location_id, locations(name)")
      .eq("package_id", pkgId).order("sequence_no");
    setRoutes((data ?? []) as unknown as RouteRow[]);
  }, [pkgId]);
  useEffect(() => { load(); }, [load]);

  async function add() {
    if (!newLoc) return toast.error("Select a checkpoint");
    const seq = (routes[routes.length - 1]?.sequence_no ?? 0) + 1;
    const { error } = await supabase.from("package_routes").insert({
      package_id: pkgId, location_id: newLoc, sequence_no: seq,
      estimated_minutes: newMins, is_checkpoint: true,
    });
    if (error) return toast.error(error.message);
    setNewLoc(""); setNewMins(15); load();
  }

  async function move(idx: number, dir: -1 | 1) {
    const a = routes[idx]; const b = routes[idx + dir];
    if (!a || !b) return;
    await supabase.from("package_routes").update({ sequence_no: b.sequence_no }).eq("id", a.id);
    await supabase.from("package_routes").update({ sequence_no: a.sequence_no }).eq("id", b.id);
    load();
  }

  async function del(id: string) {
    if (!confirm("Remove this checkpoint?")) return;
    await supabase.from("package_routes").delete().eq("id", id);
    // resequence
    const remaining = routes.filter((r) => r.id !== id);
    for (let i = 0; i < remaining.length; i++) {
      await supabase.from("package_routes").update({ sequence_no: i + 1 }).eq("id", remaining[i].id);
    }
    load();
  }

  async function updateMins(id: string, mins: number) {
    await supabase.from("package_routes").update({ estimated_minutes: mins }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Package Routes</h1><p className="text-sm text-muted-foreground">Arrange checkpoint sequence</p></div>
      </div>

      <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-5 space-y-4">
        <div>
          <Label>Package</Label>
          <Select value={pkgId} onValueChange={setPkgId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Choose package" /></SelectTrigger>
            <SelectContent>{packages.map((p) => <SelectItem key={p.id} value={p.id}>{p.package_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </CardContent></Card>

      {pkgId && (
        <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <RouteIcon className="w-4 h-4 text-primary" />
            <div className="font-semibold">Checkpoints ({routes.length})</div>
          </div>

          <ol className="space-y-2">
            {routes.map((r, i) => (
              <li key={r.id} className="flex items-center gap-2 p-3 rounded-xl border bg-card">
                <div className="grid place-items-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">{r.sequence_no}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" /> {r.locations?.name}</div>
                </div>
                <Input type="number" className="w-20" value={r.estimated_minutes} onChange={(e) => updateMins(r.id, Number(e.target.value))} />
                <span className="text-xs text-muted-foreground">min</span>
                <Button variant="ghost" size="icon" disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" disabled={i === routes.length - 1} onClick={() => move(i, 1)}><ChevronDown className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => del(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </li>
            ))}
            {routes.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No checkpoints yet.</div>}
          </ol>

          <div className="mt-5 pt-4 border-t flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[200px]">
              <Label>Add checkpoint</Label>
              <Select value={newLoc} onValueChange={setNewLoc}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>{locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-24"><Label>Minutes</Label><Input type="number" value={newMins} onChange={(e) => setNewMins(Number(e.target.value))} /></div>
            <Button onClick={add}><Plus className="w-4 h-4 mr-1" /> Add</Button>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
