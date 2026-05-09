import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/package/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/packages/$id",
      params: { id: params.id },
      replace: true,
    });
  },
});