import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Bike, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Slide = { image_url: string | null; title: string | null; subtitle: string | null };

export function SplashScreen({
  interactive = false,
  onLogin,
  onRegister,
}: {
  interactive?: boolean;
  onLogin?: () => void;
  onRegister?: () => void;
}) {
  const navigate = useNavigate();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [i, setI] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: list } = await supabase
        .from("splash_screens")
        .select("image_url,title,subtitle")
        .order("sort_order", { ascending: true });
      if (list && list.length > 0) {
        setSlides(list);
      } else {
        const { data: s } = await supabase
          .from("app_settings")
          .select("splash_image_url,splash_title,splash_subtitle")
          .eq("id", 1)
          .maybeSingle();
        setSlides([
          {
            image_url: s?.splash_image_url ?? null,
            title: s?.splash_title ?? null,
            subtitle: s?.splash_subtitle ?? null,
          },
        ]);
      }
      setLoaded(true);
    })();
  }, []);

  const cur = slides[i] ?? { image_url: null, title: null, subtitle: null };
  const isLast = i >= slides.length - 1;

  const goLogin = () => navigate({ to: "/login", search: { redirect: "/app" } });
  const goRegister = () => navigate({ to: "/register", search: { redirect: "/app" } });

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gradient-to-br from-primary via-primary to-primary/70 text-primary-foreground overflow-hidden">
      {cur.image_url ? (
        <img
          key={cur.image_url}
          src={cur.image_url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-60 animate-fade-in"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/70" />

      {/* Skip */}
      {interactive && !isLast && (
        <button
          onClick={goLogin}
          className="absolute top-4 right-4 z-10 text-xs font-semibold tracking-wide bg-white/15 backdrop-blur px-3 py-1.5 rounded-full ring-1 ring-white/30 hover:bg-white/25 transition"
        >
          Skip
        </button>
      )}

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-end px-7 pb-8 text-center animate-fade-in">
        <div className="mx-auto grid place-items-center w-16 h-16 rounded-3xl bg-white/15 backdrop-blur ring-1 ring-white/30 mb-4">
          <Bike className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight drop-shadow">
          {cur.title || "EV Kg Baru"}
        </h1>
        <p className="text-sm opacity-90 mt-2 max-w-xs">
          {cur.subtitle || "Explore KL on electric bikes"}
        </p>

        {/* Dots */}
        {slides.length > 1 && (
          <div className="mt-6 flex items-center justify-center gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-6 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        )}

        {/* Actions */}
        {interactive ? (
          <div className="mt-7 w-full max-w-xs space-y-2.5">
            {!isLast ? (
              <Button
                onClick={() => setI((v) => v + 1)}
                className="w-full rounded-full bg-white text-primary hover:bg-white/90 font-semibold h-11"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button
                  onClick={goLogin}
                  className="w-full rounded-full bg-white text-primary hover:bg-white/90 font-semibold h-11"
                >
                  Login
                </Button>
                <Button
                  onClick={goRegister}
                  variant="outline"
                  className="w-full rounded-full bg-transparent border-white/60 text-white hover:bg-white/15 hover:text-white font-semibold h-11"
                >
                  Register
                </Button>
              </>
            )}
          </div>
        ) : (
          loaded && (
            <div className="mt-6 mx-auto w-10 h-1 rounded-full bg-white/40 overflow-hidden">
              <div className="h-full w-1/2 bg-white animate-[slide_1.2s_ease-in-out_infinite]" />
            </div>
          )
        )}
      </div>
    </div>
  );
}
