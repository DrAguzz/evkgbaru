import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/hubs")({ component: AdminHubs });

interface Hub { id: string; name: string; address: string | null; pic_name: string | null; pic_phone: string | null; operating_hour: string | null; status: string; }

function AdminHubs() {
  const [rows, setRows] = useState<Hub[]>([]);
  const [editing, setEditing] = useState<Hub | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("hubs").select("*").order("name");
    setRows((data ?? []) as Hub[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!editing) return;
    const payload = { ...editing }; delete (payload as Partial<Hub>).id;
    const op = editing.id
      ? supabase.from("hubs").update(payload).eq("id", editing.id)
      : supabase.from("hubs").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
  }

  async function del(h: Hub) {
    if (!confirm(`Delete hub "${h.name}"?`)) return;
    const { error } = await supabase.from("hubs").delete().eq("id", h.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Hubs</h1><p className="text-sm text-muted-foreground">{rows.length} pickup locations</p></div>
        <Button className="rounded-full" onClick={() => { setEditing({ id: "", name: "", address: "", pic_name: "", pic_phone: "", operating_hour: "9am - 9pm", status: "active" }); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New hub
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((h) => (
          <Card key={h.id} className="rounded-2xl border-0 shadow-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary"><MapPin className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{h.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{h.address}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setEditing(h); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => del(h)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
              <div className="mt-3 text-xs text-muted-foreground space-y-0.5">
                <div>Hours: {h.operating_hour ?? "—"}</div>
                <div>PIC: {h.pic_name ?? "—"} {h.pic_phone && <>· {h.pic_phone}</>}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit hub" : "New hub"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Address</Label><Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>PIC name</Label><Input value={editing.pic_name ?? ""} onChange={(e) => setEditing({ ...editing, pic_name: e.target.value })} /></div>
                <div><Label>PIC phone</Label><Input value={editing.pic_phone ?? ""} onChange={(e) => setEditing({ ...editing, pic_phone: e.target.value })} /></div>
              </div>
              <div><Label>Operating hours</Label><Input value={editing.operating_hour ?? ""} onChange={(e) => setEditing({ ...editing, operating_hour: e.target.value })} /></div>
              <Button className="w-full rounded-full" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
