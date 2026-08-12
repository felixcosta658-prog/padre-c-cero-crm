import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Shell } from "@/components/Shell";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import appCss from "@/styles.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CRM | Fábrica de Cabos Padre Cícero" },
      {
        name: "description",
        content:
          "Sistema interno de CRM e gestão da Fábrica de Cabos Padre Cícero — clientes, pedidos, contratos, funcionários, estoque e despesas.",
      },
      {
        property: "og:title",
        content: "CRM | Fábrica de Cabos Padre Cícero",
      },
      {
        property: "og:description",
        content:
          "Clientes, pedidos, contratos, funcionários, estoque e despesas da fábrica de cabos em madeira.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/favicon.svg" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "CRM | Fábrica de Cabos Padre Cícero" },
      {
        name: "twitter:description",
        content: "Sistema interno de CRM e gestão da fábrica de cabos em madeira.",
      },
      { name: "twitter:image", content: "/favicon.svg" },
    ],
    links: [
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  notFoundComponent: NotFound,
  errorComponent: RouteError,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Shell>
        <Outlet />
      </Shell>
      <Toaster />
    </QueryClientProvider>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-7xl font-bold text-muted-foreground/30">404</p>
      <div>
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">A página que você procura não existe.</p>
      </div>
      <Button asChild>
        <a href="/">Go home</a>
      </Button>
    </div>
  );
}

function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();

  console.error(error);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-7xl font-bold text-destructive/40">Ops!</p>
      <div>
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Ocorreu um erro ao renderizar esta página. Tente novamente ou volte para o início.
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </Button>
        <Button asChild variant="outline">
          <a href="/">Go home</a>
        </Button>
      </div>
    </div>
  );
}
