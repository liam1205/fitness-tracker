import { Outlet } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSideBar } from "@/components/views/sidebar/AppSideBar";

/**
 * Shell for every signed-in page: the app sidebar on the left, the matched
 * child route on the right. Wired up once as the `_authenticated` layout, so
 * individual pages render only their own content.
 */
export function PageLayout() {
  return (
    <SidebarProvider>
      <AppSideBar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-6">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
