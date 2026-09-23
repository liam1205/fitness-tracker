import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Dumbbell, House, LogOut, NotebookTabs } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { User } from "@/lib/auth";
import { auth, useAuth } from "@/lib/auth";
import { toastError } from "@/lib/errors";
import { Separator } from "@/components/ui/separator";

/** Primary navigation. Add entries here as protected routes are added. */
const NAV_ITEMS = [
  { to: "/", label: "Home", icon: House },
  { to: "/templates", label: "Templates", icon: NotebookTabs },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
] as const;

/**
 * Up to two initials for the footer avatar, e.g. "Ada Lovelace" -> "AL". Falls
 * back to the email so the box is never empty for users without a name.
 */
function initialsOf(user: User): string {
  const initials = `${user.firstName.at(0) ?? ""}${user.lastName.at(0) ?? ""}`;
  return (initials || user.email.at(0) || "?").toUpperCase();
}

/**
 * Application sidebar: branding, primary navigation and the signed-in user with
 * a log out action. Rendered by `PageLayout`, so it only ever appears inside the
 * `_authenticated` guard and can assume there is a user.
 */
export function AppSideBar() {
  const router = useRouter();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function logout() {
    // `auth.logout` clears the local session even when the backend call fails,
    // so leave for /login either way and just report what went wrong.
    try {
      await auth.logout();
    } catch (err) {
      toastError(err, "Log out failed.");
    } finally {
      await router.navigate({ to: "/login" });
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
                  A
                </div>
                <span className="font-semibold">App</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.to}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <Separator></Separator>
      <SidebarFooter>
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="cursor-default hover:bg-transparent active:bg-transparent"
              // Collapsed the name/email are clipped away, so the initials box
              // carries the identity and the tooltip spells it out.
              tooltip={
                user
                  ? {
                      children: (
                        <div className="grid leading-tight">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs opacity-80">
                            {user.email}
                          </span>
                        </div>
                      ),
                    }
                  : undefined
              }
            >
              <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent-foreground text-sidebar-accent text-xs font-medium">
                {user ? initialsOf(user) : "?"}
              </div>
              <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">
                  {user?.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => void logout()} tooltip="Log out">
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
