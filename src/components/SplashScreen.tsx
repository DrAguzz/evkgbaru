import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bike } from "lucide-react";

export function SplashScreen() {
  const [s, setS] = useState<{ splash_image_url: string | null; splash_title: string | null; splash_subtitle: string | null } | null>(null);
  useEffect(() => {
    supabase.from("app_settings").select("splash_image_url,splash_title,splash_subtitle").eq("id", 1).maybeSingle().then(({ data }) => setS(data));
  }, []);
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground overflow-hidden">
      {s?.splash_image_url ? (
        <img src={s.splash_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/40" />
      <div className="relative text-center animate-fade-in px-8">
        <div className="mx-auto grid place-items-center w-20 h-20 rounded-3xl bg-white/15 backdrop-blur ring-1 ring-white/30 mb-4 animate-pulse">
          <Bike className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{s?.splash_title || "EVRide"}</h1>
        <p className="text-sm opacity-90 mt-1">{s?.splash_subtitle || "Explore KL on electric bikes"}</p>
        <div className="mt-6 mx-auto w-10 h-1 rounded-full bg-white/40 overflow-hidden">
          <div className="h-full w-1/2 bg-white animate-[slide_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
