import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Truck, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/vehicle-types")({ component: AdminVehicleTypes });

interface VT {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

function AdminVehicleTypes() {
  const [rows, setRows] = useState<VT[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VT | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("vehicle_types").select("*").order("name");
    setRows((data ?? []) as VT[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!editing) return;
    const { id, ...payload } = editing;
    const op = id
      ? supabase.from("vehicle_types").update(payload).eq("id", id)
      : supabase.from("vehicle_types").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setOpen(false);
    await load();
  }

  async function del(v: VT) {
    if (!confirm(`Delete vehicle type "${v.name}"?`)) return;
    const { error } = await supabase.from("vehicle_types").delete().eq("id", v.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Types</h1>
          <p className="text-sm text-muted-foreground">{rows.length} types</p>
        </div>
        <Button
          className="rounded-full"
          onClick={() => {
            setEditing({ id: "", code: "", name: "", active: true });
            setOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> New type
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((v) => (
          <Card key={v.id} className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-5 flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{v.name}</div>
                <div className="text-xs text-muted-foreground">
                  {v.code} · {v.active ? "Active" : "Inactive"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditing(v);
                  setOpen(true);
                }}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => del(v)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit vehicle type" : "New vehicle type"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Code</Label>
                <Input
                  value={editing.code}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                  placeholder="ev_motorcycle"
                />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Active</Label>
                <Switch
                  checked={editing.active}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                />
              </div>
              <Button className="w-full rounded-full" onClick={save}>
                Save
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
