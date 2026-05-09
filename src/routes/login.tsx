import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/auth",
      search: {
        mode: "login",
        ...(search.redirect ? { redirect: search.redirect } : {}),
      },
      replace: true,
    });
  },
});