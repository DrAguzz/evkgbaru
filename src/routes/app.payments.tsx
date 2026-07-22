import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ChevronLeft, CreditCard } from "lucide-react";
import { money } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/app/payments")({ component: AppPayments });

interface Pay {
  id: string; amount: number; status: string; payment_method: string;
  payment_reference: string | null; transaction_id: string | null; paid_at: string | null; created_at: string;
  bookings: { booking_no: string; id: string } | null;
}

function AppPayments() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Pay[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("payments")
      .select("id,amount,status,payment_method,payment_reference,transaction_id,paid_at,created_at,bookings!inner(id,booking_no,tourist_id)")
      .eq("bookings.tourist_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setRows((data ?? []) as unknown as Pay[]));
  }, [user]);

  return (
    <div className="px-5 pt-8 pb-24">
      <button onClick={() => nav({ to: "/app/profile" })} className="grid place-items-center w-10 h-10 rounded-full bg-accent mb-4">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="text-xl font-bold mb-4">Payment history</h1>
      {rows.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <div className="text-sm">No payments yet</div>
        </div>
      )}
      <div className="space-y-2">
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border p-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{money(p.amount)}</div>
                <div className="text-xs text-muted-foreground">{p.bookings?.booking_no} · {p.payment_method}</div>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 font-mono">
              {p.payment_reference ?? p.transaction_id} · {new Date(p.paid_at ?? p.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
