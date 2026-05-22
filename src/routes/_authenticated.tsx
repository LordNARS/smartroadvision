import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("srm_user")) {
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});
