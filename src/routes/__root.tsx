import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  ClientOnly,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "framer-motion";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import NotFound from "@/screens/NotFound";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuthBootstrap } from "@/hooks/useAuthBootstrap";
import MagneticCursor from "@/components/MagneticCursor";
import RouteTransition from "@/components/RouteTransition";
import VisitorTracker from "@/components/VisitorTracker";
import { injectGoogle } from "@/components/admin/AdminGoogle";

/** Public site settings needed in <head> on every page (Google verification etc). */
const getHeadSettings = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { publicCatalogClient } = await import('@/lib/public-catalog.server');
    const sb = publicCatalogClient();
    const { data } = await sb
      .from("site_settings")
      .select("google_site_verification, bing_site_verification, ga_measurement_id, gtm_id, brand_name")
      .limit(1)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
});

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try again or head back home.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try { return await getHeadSettings(); } catch { return null; }
  },
  staleTime: 5 * 60_000,
  head: ({ loaderData }) => {
    const meta: Record<string, string>[] = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Bnoy Studios" },
      { name: "description", content: "Premium, production-ready web & mobile codebases. Buy, preview & ship in minutes." },
      { name: "author", content: "Bnoy Studios" },
      { property: "og:site_name", content: "Bnoy Studios" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (loaderData?.google_site_verification) meta.push({ name: "google-site-verification", content: loaderData.google_site_verification });
    if (loaderData?.bing_site_verification) meta.push({ name: "msvalidate.01", content: loaderData.bing_site_verification });
    return {
      meta,
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap" },
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.png", type: "image/png" },
        { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ClientEffects() {
  useAuthBootstrap();
  const data = Route.useLoaderData();
  useEffect(() => {
    injectGoogle(data?.ga_measurement_id, data?.gtm_id);
  }, [data?.ga_measurement_id, data?.gtm_id]);
  return (
    <>
      <RouteTransition />
      <MagneticCursor />
      <VisitorTracker />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MotionConfig reducedMotion="user">
          <ClientOnly fallback={null}>
            <ClientEffects />
            <Toaster />
            <SonnerToaster position="top-center" richColors />
          </ClientOnly>
          <Outlet />
        </MotionConfig>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
