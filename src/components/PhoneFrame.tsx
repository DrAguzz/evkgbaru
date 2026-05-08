import { type ReactNode } from "react";

/** On desktop: render content inside a phone bezel.
 *  On mobile (<768px): render full-screen. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <>
      {/* mobile: full bleed */}
      <div className="md:hidden min-h-screen bg-background">{children}</div>

      {/* desktop: framed */}
      <div className="hidden md:flex min-h-screen items-center justify-center bg-gradient-to-br from-accent to-muted py-10 px-4">
        <div className="relative">
          <div className="w-[390px] h-[820px] rounded-[3rem] bg-foreground p-3 shadow-2xl">
            <div className="w-full h-full rounded-[2.5rem] bg-background overflow-hidden relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground rounded-b-2xl z-50" />
              <div className="h-full overflow-y-auto">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
