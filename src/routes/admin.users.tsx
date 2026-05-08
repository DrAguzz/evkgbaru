import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

interface U { id: string; name: string; email: string; phone: string | null; nationality: string | null; status: string; created_at: string; }
interface RoleRow { user_id: string; role: string; }

function AdminUsers() {
  const [rows, setRows] = useState<U[]>([]);
  const [roles, setRoles] = useState<Record<string, string[]>>({});
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      setRows((data ?? []) as U[]);
      const { data: r } = await supabase.from("user_roles").select("user_id, role");
      const map: Record<string, string[]> = {};
      (r as RoleRow[] ?? []).forEach((x) => { (map[x.user_id] ??= []).push(x.role); });
      setRoles(map);
    })();
  }, []);

  const filtered = rows.filter((r) => !q || `${r.name} ${r.email} ${r.phone ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold">Users</h1><p className="text-sm text-muted-foreground">{filtered.length} of {rows.length} users</p></div>

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
              <tr><th className="p-3">User</th><th className="p-3">Email</th><th className="p-3">Phone</th><th className="p-3">Nationality</th><th className="p-3">Roles</th><th className="p-3">Joined</th></tr>
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
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users.</td></tr>}
            </tbody>
          </table>
        </div>
      </CardContent></Card>
    </div>
  );
}
