import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";
import { approveRiderApplication, setApplicationStatus } from "@/lib/rider-admin.functions";
import { ClipboardList } from "lucide-react";

export const Route = createFileRoute("/admin/rider-applications")({ component: RiderApps });

type Status = "submitted" | "under_review" | "interview_scheduled" | "approved" | "rejected";

interface App {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  ic_passport: string;
  employment_type: "full_time" | "part_time";
  hub_id: string | null;
  status: Status;
  languages: string[] | null;
  driving_experience_years: number | null;
  license_number: string | null;
  photo_url: string | null;
  resume_url: string | null;
  address: string | null;
  gender: string | null;
  dob: string | null;
  review_notes: string | null;
  interview_at: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<Status, string> = {
  submitted: "Submitted",
  under_review: "Under Review",
  interview_scheduled: "Interview Scheduled",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_COLOR: Record<Status, string> = {
  submitted: "bg-slate-100 text-slate-700",
  under_review: "bg-amber-100 text-amber-700",
  interview_scheduled: "bg-blue-100 text-blue-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
};

function RiderApps() {
  const [rows, setRows] = useState<App[]>([]);
  const [hubMap, setHubMap] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Status | "all">("all");
  const [detail, setDetail] = useState<App | null>(null);
  const [approvePw, setApprovePw] = useState("");
  const [notes, setNotes] = useState("");
  const [interviewAt, setInterviewAt] = useState("");
  const [busy, setBusy] = useState(false);

  const approveFn = useServerFn(approveRiderApplication);
  const statusFn = useServerFn(setApplicationStatus);

  const load = useCallback(async () => {
    const { data: h } = await supabase.from("hubs").select("id, name");
    setHubMap(Object.fromEntries((h ?? []).map((x) => [x.id, x.name])));
    const { data } = await supabase
      .from("rider_applications")
      .select("*")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as App[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (detail) {
      setNotes(detail.review_notes ?? "");
      setInterviewAt(detail.interview_at ? new Date(detail.interview_at).toISOString().slice(0, 16) : "");
      setApprovePw("");
    }
  }, [detail]);

  const filtered = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  async function runStatus(status: Exclude<Status, "approved">) {
    if (!detail) return;
    setBusy(true);
    try {
      await statusFn({
        data: {
          applicationId: detail.id,
          status,
          notes: notes || undefined,
          interviewAt: interviewAt ? new Date(interviewAt).toISOString() : null,
        },
      });
      toast.success("Updated");
      setDetail(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function runApprove() {
    if (!detail) return;
    if (approvePw.length < 6) return toast.error("Set a password of 6+ chars for the new rider");
    setBusy(true);
    try {
      await approveFn({ data: { applicationId: detail.id, password: approvePw } });
      toast.success("Rider approved and account created");
      setDetail(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rider Applications</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {rows.length} applications
          </p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as Status | "all")}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-2xl border-0 shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground uppercase border-b">
                <tr>
                  <th className="p-3">Applicant</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Hub</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setDetail(a)}
                    className="border-b last:border-0 cursor-pointer hover:bg-muted/40"
                  >
                    <td className="p-3 font-medium">
                      <span className="inline-flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-muted-foreground" />
                        {a.full_name}
                      </span>
                      <div className="text-xs text-muted-foreground">{a.ic_passport}</div>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      <div>{a.email}</div>
                      <div className="text-xs">{a.phone}</div>
                    </td>
                    <td className="p-3 capitalize">{a.employment_type.replace("_", "-")}</td>
                    <td className="p-3">{a.hub_id ? hubMap[a.hub_id] ?? "—" : "—"}</td>
                    <td className="p-3">
                      <Badge className={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{fmtDate(a.created_at)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No applications.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        {detail && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{detail.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-4">
                {detail.photo_url && (
                  <img src={detail.photo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                )}
                <div className="text-sm space-y-0.5">
                  <div>
                    <span className="text-muted-foreground">IC/Passport:</span> {detail.ic_passport}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span> {detail.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span> {detail.phone}
                  </div>
                  <div>
                    <span className="text-muted-foreground">DOB:</span> {detail.dob ?? "—"} ·{" "}
                    <span className="text-muted-foreground">Gender:</span> {detail.gender ?? "—"}
                  </div>
                </div>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-muted-foreground">Address:</span> {detail.address ?? "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">License:</span> {detail.license_number ?? "—"} ·{" "}
                  <span className="text-muted-foreground">Experience:</span>{" "}
                  {detail.driving_experience_years ?? 0} yrs
                </div>
                <div>
                  <span className="text-muted-foreground">Languages:</span>{" "}
                  {(detail.languages ?? []).join(", ") || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>{" "}
                  <span className="capitalize">{detail.employment_type.replace("_", "-")}</span> ·{" "}
                  <span className="text-muted-foreground">Hub:</span>{" "}
                  {detail.hub_id ? hubMap[detail.hub_id] ?? "—" : "—"}
                </div>
                {detail.resume_url && (
                  <div>
                    <a className="text-primary underline" href={detail.resume_url} target="_blank" rel="noreferrer">
                      View Resume
                    </a>
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-lg border p-3">
                <div className="text-sm font-semibold">Review notes</div>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                <Label className="text-xs">Interview date/time (optional)</Label>
                <Input type="datetime-local" value={interviewAt} onChange={(e) => setInterviewAt(e.target.value)} />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => runStatus("under_review")}>
                    Mark Under Review
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => runStatus("interview_scheduled")}
                  >
                    Schedule Interview
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => runStatus("rejected")}
                  >
                    Reject
                  </Button>
                </div>
              </div>

              {detail.status !== "approved" && (
                <div className="space-y-2 rounded-lg border p-3 bg-emerald-50/50">
                  <div className="text-sm font-semibold">Approve & Create Rider Account</div>
                  <Label className="text-xs">Initial password for rider</Label>
                  <Input
                    type="password"
                    value={approvePw}
                    onChange={(e) => setApprovePw(e.target.value)}
                    placeholder="min 6 characters"
                  />
                  <p className="text-xs text-muted-foreground">
                    Creates an account for {detail.email}, grants rider role, and generates a Rider ID.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDetail(null)}>
                Close
              </Button>
              {detail.status !== "approved" && (
                <Button disabled={busy} onClick={runApprove}>
                  {busy ? "Approving…" : "Approve"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
