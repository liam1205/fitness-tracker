import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { Loader, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Values made available to every route's `beforeLoad`/`loader` via `context`. */
export interface RouterContext {
  auth: typeof auth;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
  errorComponent: ErrorBoundary,
});

/**
 * The root renders nothing but the matched route: unauthenticated visitors get
 * the full-screen sign-in screen, and every protected page brings its own chrome
 * via `PageLayout`.
 */
function RootLayout() {
  return (
    <>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}

function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground">{t("common.notFound")}</p>
      <Button asChild>
        <Link to="/">{t("common.actions.goHome")}</Link>
      </Button>
    </div>
  );
}

function ErrorBoundary({ error }: { error: Error }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        {t("common.errors.somethingWentWrong")}
      </h1>
      <p className="max-w-prose text-sm text-muted-foreground">
        {error.message}
      </p>
      <Button onClick={() => window.location.reload()}>
        <RotateCcw />
        {t("common.actions.reload")}
      </Button>
    </div>
  );
}
