import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, UserPlus, Pencil } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { createAdminUser, updateAdminUser } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

interface U { id: string; name: string; email: string; phone: string | null; nationality: string | null; status: string; created_at: string; }
interface RoleRow { user_id: string; role: string; }

function AdminUsers() {
  const [rows, setRows] = useState<U[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [q, setQ] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<U | null>(null);

  const createFn = useServerFn(createAdminUser);
  const updateFn = useServerFn(updateAdminUser);

  const load = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setRows((data ?? []) as U[]);
    const { data: r } = await supabase.from("user_roles").select("user_id, role");
    const map: Record<string, string[]> = {};
    (r as RoleRow[] ?? []).forEach((x) => { (map[x.user_id] ??= []).push(x.role); });
    setRoles(map);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = rows.filter((r) => !q || `${r.name} ${r.email} ${r.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {rows.length} users</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full"><UserPlus className="w-4 h-4 mr-2" />Register Admin</Button>
          </DialogTrigger>
          <CreateAdminDialog
            onSubmit={async (vals) => {
              try {
                await createFn({ data: vals });
                toast.success("Admin created");
                setCreateOpen(false);
                await load();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to create admin");
              }
            }}
          />
        </Dialog>
      </div>

      <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name, email, phone…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 rounded-full" />
        </div>
      </CardContent></Card>

      <Card className="rounded-2xl border-0 shadow-card"><CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted-foreground uppercase border-b">
              <tr><th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Nationality</th><th className="p-3">Roles</th><th className="p-3">Joined</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3"><div className="font-medium">{u.name}</div></td>
                  <td className="p-3 text-muted-foreground">{u.email}</td>
                  <td className="p-3 text-muted-foreground">{u.phone ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{u.nationality ?? "—"}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-1">{(roles[u.id] ?? []).map((r) => <span key={r} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{r}</span>)}</div></td>
                  <td className="p-3 text-muted-foreground">{fmtDate(u.created_at)}</td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(u)}><Pencil className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No users.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent></Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && (
          <EditUserDialog
            user={editing}
            isAdmin={(roles[editing.id] ?? []).includes("admin") || (roles[editing.id] ?? []).includes("super_admin")}
            onSubmit={async (vals) => {
              try {
                await updateFn({ data: { userId: editing.id, ...vals } });
                toast.success("User updated");
                setEditing(null);
                await load();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed to update");
              }
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

function CreateAdminDialog({ onSubmit }: { onSubmit: (v: { email: string; password: string; name: string; phone?: string }) => Promise<void> }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Register New Admin</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button
          disabled={busy || !email || !password || !name}
          onClick={async () => {
            setBusy(true);
            try { await onSubmit({ name, email, password, phone: phone || undefined }); }
            finally { setBusy(false); }
          }}
        >{busy ? "Creating…" : "Create Admin"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditUserDialog({
  user,
  isAdmin,
  onSubmit,
}: {
  user: U;
  isAdmin: boolean;
  onSubmit: (v: { name?: string; phone?: string | null; password?: string | null; isAdmin?: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [password, setPassword] = useState("");
  const [admin, setAdmin] = useState(isAdmin);
  const [busy, setBusy] = useState(false);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Email</Label><Input value={user.email} disabled /></div>
        <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <div><Label>New Password (optional)</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank to keep current" /></div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div><Label>Admin role</Label><p className="text-xs text-muted-foreground">Grants access to admin dashboard</p></div>
          <Switch checked={admin} onCheckedChange={setAdmin} />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSubmit({
                name: name !== user.name ? name : undefined,
                phone: phone !== (user.phone ?? "") ? phone : undefined,
                password: password ? password : undefined,
                isAdmin: admin !== isAdmin ? admin : undefined,
              });
            } finally { setBusy(false); }
          }}
        >{busy ? "Saving…" : "Save"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
