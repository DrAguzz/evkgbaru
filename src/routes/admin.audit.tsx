import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { ScrollText, Search, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/admin/audit")({ component: AdminAudit });

interface AuditRow {
  id: string; created_at: string; action: string; entity: string | null;
  entity_id: string | null; actor_role: string | null; user_id: string | null;
  metadata: Record<string, unknown>; ip: string | null; user_agent: string | null;
  hub_id: string | null;
}

const ACTIONS = ["all", "login", "logout", "booking_status_change", "rider_assign", "rider_unassign", "payment_verify", "package_toggle", "settings_update", "rider_approve", "rider_reject"];

const PAGE_SIZE = 25;

function AdminAudit() {
  const { isSuperAdmin } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [action, setAction] = useState("all");
  const [search, setSearch] = useState("");
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (action !== "all") q = q.eq("action", action);
    if (search) q = q.or(`entity.ilike.%${search}%,entity_id.ilike.%${search}%,action.ilike.%${search}%`);
    const { data, count } = await q;
    setRows((data ?? []) as AuditRow[]);
    setTotal(count ?? 0);
    // Fetch user emails for shown user_ids
    const ids = [...new Set((data ?? []).map((r) => r.user_id).filter((x): x is string => !!x))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, email, name").in("id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p) => { map[p.id] = p.name ?? p.email ?? p.id; });
      setEmails(map);
    }
    setLoading(false);
  }, [action, search, page]);

  useEffect(() => { load(); }, [load]);

  if (!isSuperAdmin) {
    return <div className="text-center py-20 text-muted-foreground">Only super admins can view the audit log.</div>;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit log"
        subtitle="Every important system action, searchable and filterable"
        icon={ScrollText}
        actions={<Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>}
      />

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search action, entity or ID" className="pl-9" value={search} onChange={(e) => { setPage(0); setSearch(e.target.value); }} />
          </div>
          <Select value={action} onValueChange={(v) => { setPage(0); setAction(v); }}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>{ACTIONS.map((a) => <SelectItem key={a} value={a}>{a === "all" ? "All actions" : a.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground bg-muted/50">
              <tr>
                <th className="p-3">When</th><th className="p-3">User</th><th className="p-3">Role</th>
                <th className="p-3">Action</th><th className="p-3">Entity</th><th className="p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No log entries.</td></tr>}
              {rows.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 text-xs">{r.user_id ? (emails[r.user_id] ?? r.user_id.slice(0, 8)) : "—"}</td>
                  <td className="p-3"><StatusBadge status={r.actor_role ?? "n/a"} /></td>
                  <td className="p-3 font-medium">{r.action}</td>
                  <td className="p-3 text-xs">
                    <div>{r.entity ?? "—"}</div>
                    {r.entity_id && <div className="font-mono text-muted-foreground">{r.entity_id.slice(0, 12)}</div>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {Object.keys(r.metadata ?? {}).length > 0 && (
                      <code className="font-mono text-[11px] break-all">{JSON.stringify(r.metadata).slice(0, 120)}</code>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between p-3 border-t text-xs text-muted-foreground">
            <div>{total} entries · page {page + 1} / {totalPages}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
