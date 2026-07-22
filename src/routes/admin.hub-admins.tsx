import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createHubAdmin } from "@/lib/rider-admin.functions";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/admin/hub-admins")({ component: AdminHubAdmins });

interface Row {
  user_id: string;
  hub_id: string | null;
  hub_name: string | null;
  profile_name: string | null;
  profile_email: string | null;
  created_at: string;
}
interface Hub {
  id: string;
  name: string;
}

function AdminHubAdmins() {
  const [rows, setRows] = useState<Row[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [open, setOpen] = useState(false);
  const createFn = useServerFn(createHubAdmin);

  const load = useCallback(async () => {
    const { data: h } = await supabase.from("hubs").select("id, name").order("name");
    setHubs((h ?? []) as Hub[]);
    const { data } = await supabase
      .from("user_roles")
      .select("user_id, hub_id, created_at, profiles:profiles!user_roles_user_id_fkey(name, email), hubs:hubs!user_roles_hub_id_fkey(name)")
      .in("role", ["hub_admin", "hub_manager"]);
    // fallback: fetch profiles & hubs manually if joins fail
    if (!data || data.length === 0) {
      const { data: raw } = await supabase
        .from("user_roles")
        .select("user_id, hub_id, created_at")
        .in("role", ["hub_admin", "hub_manager"]);
      const userIds = (raw ?? []).map((r) => r.user_id);
      const { data: profs } = await supabase.from("profiles").select("id, name, email").in("id", userIds);
      const hubMap = new Map((h ?? []).map((x) => [x.id, x.name]));
      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      setRows(
        (raw ?? []).map((r) => ({
          user_id: r.user_id,
          hub_id: r.hub_id ?? null,
          hub_name: r.hub_id ? hubMap.get(r.hub_id) ?? null : null,
          profile_name: profMap.get(r.user_id)?.name ?? null,
          profile_email: profMap.get(r.user_id)?.email ?? null,
          created_at: r.created_at,
        })),
      );
      return;
    }
    setRows(
      (data as unknown as Array<{
        user_id: string;
        hub_id: string | null;
        created_at: string;
        profiles: { name: string; email: string } | null;
        hubs: { name: string } | null;
      }>).map((r) => ({
        user_id: r.user_id,
        hub_id: r.hub_id,
        hub_name: r.hubs?.name ?? null,
        profile_name: r.profiles?.name ?? null,
        profile_email: r.profiles?.email ?? null,
        created_at: r.created_at,
      })),
    );
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(r: Row) {
    if (!confirm(`Revoke hub admin access for ${r.profile_email ?? r.user_id}?`)) return;
    const q = supabase.from("user_roles").delete().eq("user_id", r.user_id).in("role", ["hub_admin", "hub_manager"]);
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success("Revoked");
    await load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hub Admins</h1>
          <p className="text-sm text-muted-foreground">{rows.length} accounts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <UserPlus className="w-4 h-4 mr-1" /> New hub admin
            </Button>
          </DialogTrigger>
          <CreateDialog
            hubs={hubs}
            onSubmit={async (vals) => {
              try {
                await createFn({ data: vals });
                toast.success("Hub admin created");
                setOpen(false);
                await load();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Create failed");
              }
            }}
          />
        </Dialog>
      </div>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase border-b">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Hub</th>
                  <th className="p-3">Granted</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.user_id} className="border-b last:border-0">
                    <td className="p-3 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-muted-foreground" />
                        {r.profile_name ?? "—"}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{r.profile_email ?? "—"}</td>
                    <td className="p-3">{r.hub_name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{fmtDate(r.created_at)}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="icon" onClick={() => revoke(r)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No hub admins yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreateDialog({
  hubs,
  onSubmit,
}: {
  hubs: Hub[];
  onSubmit: (v: { email: string; password: string; name: string; phone?: string; hubId: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [hubId, setHubId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New Hub Admin</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <Label>Hub</Label>
          <Select value={hubId} onValueChange={setHubId}>
            <SelectTrigger>
              <SelectValue placeholder="Select hub" />
            </SelectTrigger>
            <SelectContent>
              {hubs.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={busy || !email || !password || !name || !hubId}
          onClick={async () => {
            setBusy(true);
            try {
              await onSubmit({ name, email, password, phone: phone || undefined, hubId });
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Creating…" : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
