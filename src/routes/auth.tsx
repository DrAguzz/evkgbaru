import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { ensureDemoUser } from "@/lib/demo-login.functions";
import { toast } from "sonner";
import { User, Bike, Building2, ShieldCheck } from "lucide-react";

const DEMO_ROLES = [
  { key: "hub_admin", label: "Hub Admin", icon: Building2 },
  { key: "super_admin", label: "Super Admin", icon: ShieldCheck },
] as const;

type Search = { mode?: "login" | "register"; redirect?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s.mode === "register" ? "register" : "login",
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState<"login" | "register">(search.mode ?? "login");

  // login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // register state
  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rNat, setRNat] = useState("");
  const [rPassword, setRPassword] = useState("");

  const [busy, setBusy] = useState(false);

  const after = (path?: string) => {
    const target = path && path.startsWith("/") ? path : "/";
    navigate({ to: target as "/", replace: true });
  };

  useEffect(() => {
    if (!loading && user) {
      after(search.redirect);
    }
  }, [loading, user, search.redirect]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 grid place-items-center px-4 py-12">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 grid place-items-center px-4 py-12">
        <Card className="w-full max-w-md rounded-2xl border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to EVRide</CardTitle>
            <CardDescription>Sign in to book and track your EV bike tours.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-3 mt-4">
                <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" /></div>
                <div><Label>Password</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></div>
                <Button className="w-full" disabled={busy} onClick={async () => {
                  setBusy(true);
                  const { error } = await signIn(email, password);
                  setBusy(false);
                  if (error) return toast.error(error);
                  toast.success("Welcome back!");
                }}>Login</Button>
                <button type="button" className="text-xs text-muted-foreground hover:text-primary" onClick={() => toast.info("Reset link will be sent (mock)")}>
                  Forgot password?
                </button>
              </TabsContent>
              <TabsContent value="register" className="space-y-3 mt-4">
                <div><Label>Full name</Label><Input value={rName} onChange={(e) => setRName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Phone</Label><Input value={rPhone} onChange={(e) => setRPhone(e.target.value)} /></div>
                  <div>
                    <Label>Nationality</Label>
                    <Select value={rNat} onValueChange={setRNat}>
                      <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.name}>
                            <span className="mr-2">{c.flag}</span>{c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Email</Label><Input value={rEmail} onChange={(e) => setREmail(e.target.value)} type="email" /></div>
                <div><Label>Password</Label><Input value={rPassword} onChange={(e) => setRPassword(e.target.value)} type="password" /></div>
                <Button className="w-full" disabled={busy} onClick={async () => {
                  if (!rName || !rEmail || !rPassword) return toast.error("Fill all required fields");
                  setBusy(true);
                  const { error } = await signUp(rEmail, rPassword, { name: rName, phone: rPhone, nationality: rNat });
                  setBusy(false);
                  if (error) return toast.error(error);
                  toast.success("Account created successfully.");
                }}>Create account</Button>
              </TabsContent>
            </Tabs>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Demo login</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {DEMO_ROLES.map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        const creds = await ensureDemoUser({ data: { role: key } });
                        const { error } = await signIn(creds.email, creds.password);
                        if (error) throw new Error(error);
                        toast.success(`Signed in as ${label}`);
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Demo login failed");
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    <Icon className="h-4 w-4 mr-1" />
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Demo accounts are auto-created for previewing each role.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
