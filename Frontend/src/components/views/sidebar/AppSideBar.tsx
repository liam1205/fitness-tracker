import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import {
  CircleStop,
  Dumbbell,
  House,
  Icon,
  ListChecks,
  LogOut,
  NotebookTabs,
  Pause,
  Square,
  StopCircle,
  StopCircleIcon,
} from "lucide-react";
import {
  getGetUserSettingsQueryKey,
  getListActiveWorkoutSessionsQueryKey,
  getListCompletedWorkoutSessionsQueryKey,
  useCompleteWorkoutSession,
  useGetUserSettings,
  useListActiveWorkoutSessions,
  useUpdateUserSettings,
} from "@/api/endpoints";
import type { Theme } from "@/api/model";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import type { User } from "@/lib/auth";
import { auth, useAuth } from "@/lib/auth";
import { toastError } from "@/lib/errors";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

/** Primary navigation. Add entries here as protected routes are added. */
const NAV_ITEMS = [
  { to: "/", label: "Home", icon: House },
  { to: "/templates", label: "Templates", icon: NotebookTabs },
  { to: "/workouts", label: "Workouts", icon: Dumbbell },
  { to: "/exercises", label: "Exercises", icon: ListChecks },
] as const;

const THEMES = [
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
  { label: "System", value: "system" },
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
  const { isMobile, setOpenMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const { data: userSettings } = useGetUserSettings();
  const { data: activeSessions } = useListActiveWorkoutSessions();
  const { mutate: updateSettings } = useUpdateUserSettings({
    mutation: {
      // Keep the cached settings in sync so this doesn't fight the local
      // theme on the next render, and so other consumers see the new value
      // without a refetch.
      onSuccess: (data) => {
        queryClient.setQueryData(getGetUserSettingsQueryKey(), data);
      },
    },
  });
  const { mutate: completeWorkoutSession } = useCompleteWorkoutSession({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getListActiveWorkoutSessionsQueryKey(),
        });
        queryClient.invalidateQueries({
          queryKey: getListCompletedWorkoutSessionsQueryKey(),
        });
      },
      onError: (err) => {
        toastError(err, "Couldn't complete the workout session.");
      },
    },
  });

  // The server is the source of truth for a signed-in user's theme, but only
  // apply it once on load — otherwise this fires again after every local
  // change and reverts it before the mutation has a chance to persist.
  const hasSyncedTheme = useRef(false);
  useEffect(() => {
    if (userSettings && !hasSyncedTheme.current) {
      hasSyncedTheme.current = true;
      if (userSettings.theme !== theme) {
        setTheme(userSettings.theme);
      }
    }
  }, [userSettings, theme, setTheme]);

  function handleThemeChange(value: Theme) {
    setTheme(value);
    updateSettings({ data: { theme: value } });
  }

  function handleCompleteSession(
    event: React.MouseEvent<HTMLButtonElement>,
    sessionId: number,
  ) {
    event.stopPropagation();
    completeWorkoutSession({ sessionId });
  }

  function collapseSidebar() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

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
                      <Link to={item.to} onClick={collapseSidebar}>
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

        {activeSessions && activeSessions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Active sessions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {activeSessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton className="flex justify-between w-full">
                      <span>{session.template_name ?? "Workout"}</span>
                      <div className="flex justify-center items-center mr-2">
                        <Button
                          className="size-1"
                          variant={"destructive"}
                          size={"icon"}
                          onClick={(event) =>
                            handleCompleteSession(event, session.id)
                          }
                        >
                          <Square></Square>
                        </Button>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu className="gap-2">
          <SidebarMenuItem>
            <Select value={theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-full max-w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Themes</SelectLabel>
                  {THEMES.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SidebarMenuItem>
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
