import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider, AuthProvider } from "@/lib/store";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-7xl font-bold gradient-text">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Signal lost</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This route is not on the city grid.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground glow"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-xl font-semibold">System fault detected</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A subsystem failed to load. Retry the request.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Retry
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border bg-secondary px-4 py-2 text-sm font-medium">
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "RoadVision - Intelligent Route System" },
      { name: "description", content: "Smart city dashboard for road condition monitoring, citizen complaints, and maintenance priority." },
      { property: "og:title", content: "RoadVision - Intelligent Route System" },
      { name: "twitter:title", content: "RoadVision - Intelligent Route System" },
      { property: "og:description", content: "Smart city dashboard for road condition monitoring, citizen complaints, and maintenance priority." },
      { name: "twitter:description", content: "Smart city dashboard for road condition monitoring, citizen complaints, and maintenance priority." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/qJFsm75rU9c4hoU3luZYQZwbfch2/social-images/social-1779518972284-WhatsApp_Image_2026-05-23_at_12.18.42.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/qJFsm75rU9c4hoU3luZYQZwbfch2/social-images/social-1779518972284-WhatsApp_Image_2026-05-23_at_12.18.42.webp" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <Outlet />
          <Toaster richColors theme="dark" position="top-right" />
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
