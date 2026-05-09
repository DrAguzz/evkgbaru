import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/promos")({ component: AdminPromos });

interface Promo {
  id: string; code: string; description: string | null;
  discount_type: string; discount_value: number; min_amount: number;
  max_uses: number | null; used_count: number;
  valid_from: string | null; valid_until: string | null; status: string;
}

function AdminPromos() {
  const [rows, setRows] = useState<Promo[]>([]);
  const [editing, setEditing] = useState<Promo | null>(null);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as Promo[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  function newPromo() {
    setEditing({ id: "", code: "", description: "", discount_type: "percentage", discount_value: 10, min_amount: 0, max_uses: null, used_count: 0, valid_from: null, valid_until: null, status: "active" });
    setOpen(true);
  }

  async function save() {
    if (!editing) return;
    const payload: Partial<Promo> = { ...editing, code: editing.code.trim().toUpperCase() };
    delete payload.id;
    delete payload.used_count;
    if (editing.id) {
      const { error } = await supabase.from("promo_codes").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("promo_codes").insert(payload as never);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved"); setOpen(false); setEditing(null); load();
  }

  async function del(p: Promo) {
    if (!confirm(`Delete code "${p.code}"?`)) return;
    const { error } = await supabase.from("promo_codes").delete().eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted"); load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Promo codes</h1><p className="text-sm text-muted-foreground">{rows.length} codes</p></div>
        <Button className="rounded-full" onClick={newPromo}><Plus className="w-4 h-4 mr-1" /> New code</Button>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((p) => (
          <Card key={p.id} className="rounded-2xl border-0 shadow-card overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary/10 text-primary"><Tag className="w-4 h-4" /></span>
                  <div>
                    <div className="font-bold tracking-wider">{p.code}</div>
                    <div className="text-xs text-muted-foreground">{p.discount_type === "percentage" ? `${p.discount_value}% off` : `RM${p.discount_value} off`}{p.min_amount > 0 && ` · min RM${p.min_amount}`}</div>
                  </div>
                </div>
                <div className="flex">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => del(p)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
              {p.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Used {p.used_count}{p.max_uses ? `/${p.max_uses}` : ""}</span>
                <span className={`px-2 py-0.5 rounded-full ${p.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{p.status}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {rows.length === 0 && <div className="text-sm text-muted-foreground">No promo codes yet.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit promo" : "New promo"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Code</Label><Input value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" /></div>
              <div><Label>Description</Label><Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Discount type</Label>
                  <Select value={editing.discount_type} onValueChange={(v) => setEditing({ ...editing, discount_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed (RM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Value</Label><Input type="number" value={editing.discount_value} onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })} /></div>
                <div><Label>Min amount (RM)</Label><Input type="number" value={editing.min_amount} onChange={(e) => setEditing({ ...editing, min_amount: Number(e.target.value) })} /></div>
                <div><Label>Max uses (blank = ∞)</Label><Input type="number" value={editing.max_uses ?? ""} onChange={(e) => setEditing({ ...editing, max_uses: e.target.value ? Number(e.target.value) : null })} /></div>
                <div><Label>Valid from</Label><Input type="datetime-local" value={editing.valid_from?.slice(0,16) ?? ""} onChange={(e) => setEditing({ ...editing, valid_from: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
                <div><Label>Valid until</Label><Input type="datetime-local" value={editing.valid_until?.slice(0,16) ?? ""} onChange={(e) => setEditing({ ...editing, valid_until: e.target.value ? new Date(e.target.value).toISOString() : null })} /></div>
              </div>
              <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={editing.status === "active"} onCheckedChange={(v) => setEditing({ ...editing, status: v ? "active" : "inactive" })} /></div>
              <Button className="w-full rounded-full" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
