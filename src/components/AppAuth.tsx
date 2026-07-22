import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import { toast } from "sonner";
import { ChevronLeft, Bike } from "lucide-react";
import evrideLogo from "@/assets/evride-logo.png.asset.json";

export function AppAuth({
  initialTab = "login",
  onBack,
}: {
  initialTab?: "login" | "register";
  onBack: () => void;
}) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [rName, setRName] = useState("");
  const [rEmail, setREmail] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rNat, setRNat] = useState("");
  const [rPassword, setRPassword] = useState("");

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 bg-background/90 backdrop-blur border-b">
        <button
          onClick={onBack}
          className="grid place-items-center w-9 h-9 rounded-full hover:bg-muted transition"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src={evrideLogo.url} alt="EVRide" className="h-8 w-auto" />
        </div>
      </div>

      <div className="flex-1 px-5 py-6">
        <h1 className="text-xl font-bold tracking-tight">Welcome</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in or create an account to continue.
        </p>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")} className="mt-5">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-3 mt-5">
            <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" /></div>
            <div><Label>Password</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></div>
            <Button
              className="w-full h-11 rounded-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const { error } = await signIn(email, password);
                setBusy(false);
                if (error) return toast.error(error);
                toast.success("Welcome back!");
              }}
            >
              Login
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-3 mt-5">
            <div><Label>Full name</Label><Input value={rName} onChange={(e) => setRName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Phone</Label><Input value={rPhone} onChange={(e) => setRPhone(e.target.value)} /></div>
              <div>
                <Label>Nationality</Label>
                <Select value={rNat} onValueChange={setRNat}>
                  <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
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
            <Button
              className="w-full h-11 rounded-full"
              disabled={busy}
              onClick={async () => {
                if (!rName || !rEmail || !rPassword) return toast.error("Fill all required fields");
                setBusy(true);
                const { error } = await signUp(rEmail, rPassword, { name: rName, phone: rPhone, nationality: rNat });
                setBusy(false);
                if (error) return toast.error(error);
                toast.success("Account created successfully.");
              }}
            >
              Create account
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
