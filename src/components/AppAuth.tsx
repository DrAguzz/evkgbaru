import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { toast } from "sonner";
import { ChevronLeft, Mail, Lock, User, Phone, Eye, EyeOff, Globe, Sparkles } from "lucide-react";
import evrideLogo from "@/assets/evride-logo.png.asset.json";
import { useServerFn } from "@tanstack/react-start";
import { ensureDemoUser } from "@/lib/demo-login.functions";

export function AppAuth({
  initialTab = "login",
  onBack,
  loginOnly = false,
  title,
  subtitle,
  showDemo = true,
}: {
  initialTab?: "login" | "register";
  onBack: () => void;
  loginOnly?: boolean;
  title?: string;
  subtitle?: string;
  showDemo?: boolean;
}) {
  const { signIn, signUp } = useAuth();
  const provisionDemo = useServerFn(ensureDemoUser);
  const [tab, setTab] = useState<"login" | "register">(loginOnly ? "login" : initialTab);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  async function handleDemoLogin() {
    try {
      setBusy(true);
      const creds = await provisionDemo({ data: { role: "customer" } });
      const { error } = await signIn(creds.email, creds.password);
      if (error) return toast.error(error);
      toast.success("Signed in as Demo Customer");
    } catch (e: any) {
      toast.error(e?.message ?? "Demo login failed");
    } finally {
      setBusy(false);
    }
  }

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rNat, setRNat] = useState("");
  const [rPassword, setRPassword] = useState("");

  const isLogin = tab === "login";

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background overflow-y-auto">
      {/* Hero header with brand gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground pb-14">
        <div className="absolute -top-20 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex items-center justify-between px-4 pt-4">
          <button
            onClick={onBack}
            className="grid place-items-center w-10 h-10 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/25 transition"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10" />
        </div>

        <div className="relative flex flex-col items-center text-center px-6 pt-6">
          <div className="w-20 h-20 rounded-3xl bg-white/15 backdrop-blur-md grid place-items-center shadow-xl ring-1 ring-white/20">
            <img src={evrideLogo.url} alt="EVRide" className="h-12 w-auto" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">
            {title ?? (isLogin ? "Welcome back" : "Create account")}
          </h1>
          <p className="mt-1.5 text-sm text-primary-foreground/80 max-w-xs">
            {subtitle ?? (isLogin
              ? "Sign in to continue your EV adventure."
              : "Join EVRide and start exploring the city.")}
          </p>
        </div>
      </div>

      {/* Card sheet */}
      <div className="flex-1 px-5 -mt-8">
        <div className="rounded-3xl bg-card shadow-xl border border-border/40 p-5 pb-7">
          {/* Segmented tabs */}
          {!loginOnly && (
            <div className="relative grid grid-cols-2 p-1 rounded-2xl bg-muted/70">
              <button
                onClick={() => setTab("login")}
                className={`relative z-10 py-2.5 text-sm font-semibold rounded-xl transition ${
                  isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setTab("register")}
                className={`relative z-10 py-2.5 text-sm font-semibold rounded-xl transition ${
                  !isLogin ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                Sign up
              </button>
            </div>
          )}

          {isLogin ? (
            <div className="space-y-3 mt-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <IconField icon={<Mail className="w-4 h-4" />}>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="Email address"
                  className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-12 pl-10"
                />
              </IconField>
              <IconField
                icon={<Lock className="w-4 h-4" />}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              >
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-12 pl-10 pr-10"
                />
              </IconField>

              <div className="flex justify-end -mt-1">
                <button className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </button>
              </div>

              <Button
                className="w-full h-12 rounded-2xl text-base font-semibold shadow-lg shadow-primary/25"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const { error } = await signIn(email, password);
                  setBusy(false);
                  if (error) return toast.error(error);
                  toast.success("Welcome back!");
                }}
              >
                {busy ? "Signing in..." : "Sign in"}
              </Button>

              {showDemo && (
                <>
                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card px-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                        For testing
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-2xl text-sm font-semibold border-dashed"
                    disabled={busy}
                    onClick={handleDemoLogin}
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-primary" />
                    {busy ? "Preparing demo..." : "Try demo account"}
                  </Button>
                </>
              )}

              {!loginOnly && (
                <p className="text-center text-xs text-muted-foreground pt-2">
                  Don't have an account?{" "}
                  <button onClick={() => setTab("register")} className="text-primary font-semibold">
                    Sign up
                  </button>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3 mt-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <IconField icon={<User className="w-4 h-4" />}>
                <Input
                  value={rName}
                  onChange={(e) => setRName(e.target.value)}
                  placeholder="Full name"
                  className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-12 pl-10"
                />
              </IconField>
              <IconField icon={<Mail className="w-4 h-4" />}>
                <Input
                  value={rEmail}
                  onChange={(e) => setREmail(e.target.value)}
                  type="email"
                  placeholder="Email address"
                  className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-12 pl-10"
                />
              </IconField>
              <IconField icon={<Phone className="w-4 h-4" />}>
                <Input
                  value={rPhone}
                  onChange={(e) => setRPhone(e.target.value)}
                  placeholder="Phone number"
                  className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-12 pl-10"
                />
              </IconField>
              <div className="relative rounded-2xl bg-muted/50 border border-border/60">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Select value={rNat} onValueChange={setRNat}>
                  <SelectTrigger className="border-0 bg-transparent focus:ring-0 shadow-none h-12 pl-10">
                    <SelectValue placeholder="Nationality" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.name}>
                        <span className="mr-2">{c.flag}</span>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <IconField
                icon={<Lock className="w-4 h-4" />}
                right={
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              >
                <Input
                  value={rPassword}
                  onChange={(e) => setRPassword(e.target.value)}
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-12 pl-10 pr-10"
                />
              </IconField>

              <Button
                className="w-full h-12 rounded-2xl text-base font-semibold shadow-lg shadow-primary/25 mt-2"
                disabled={busy}
                onClick={async () => {
                  if (!rName || !rEmail || !rPassword) return toast.error("Fill all required fields");
                  setBusy(true);
                  const { error } = await signUp(rEmail, rPassword, {
                    name: rName,
                    phone: rPhone,
                    nationality: rNat,
                  });
                  setBusy(false);
                  if (error) return toast.error(error);
                  toast.success("Account created successfully.");
                }}
              >
                {busy ? "Creating..." : "Create account"}
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-2">
                Already registered?{" "}
                <button onClick={() => setTab("login")} className="text-primary font-semibold">
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-5 pb-6 px-4 leading-relaxed">
          By continuing you agree to our{" "}
          <span className="underline">Terms</span> and{" "}
          <span className="underline">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}

function IconField({
  icon,
  right,
  children,
}: {
  icon: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl bg-muted/50 border border-border/60 focus-within:border-primary/60 focus-within:bg-background transition">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        {icon}
      </div>
      {children}
      {right && (
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{right}</div>
      )}
    </div>
  );
}
