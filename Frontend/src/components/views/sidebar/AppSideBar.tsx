import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { Trans, useTranslation } from "react-i18next";
import {
  BicepsFlexed,
  Dumbbell,
  House,
  Lightbulb,
  ListChecks,
  LogOut,
  Moon,
  NotebookTabs,
  Pause,
  Play,
  Settings,
  Square,
  Sun,
} from "lucide-react";
import {
  getGetUserSettingsQueryKey,
  useGetUserSettings,
  useUpdateUserSettings,
} from "@/api/endpoints/user-settings/user-settings";
import { useListActiveWorkoutSessions } from "@/api/endpoints/workout-sessions/workout-sessions";
import type { Language, Theme, WorkoutSessionRead } from "@/api/model";
import {
  canCompleteSession,
  useSessionControls,
} from "@/hooks/use-session-controls";
import { CompleteBlockedTooltip } from "@/components/views/workout/CompleteBlockedTooltip";
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
import { currentLanguageSetting, LANGUAGE_TO_LOCALE } from "@/lib/i18n";
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
  { to: "/", labelKey: "sidebar.nav.home", icon: House },
  { to: "/templates", labelKey: "sidebar.nav.templates", icon: NotebookTabs },
  { to: "/workouts", labelKey: "sidebar.nav.workouts", icon: Dumbbell },
  { to: "/exercises", labelKey: "sidebar.nav.exercises", icon: ListChecks },
] as const;

const THEMES = [
  { value: "light", icon: <Sun /> },
  { value: "dark", icon: <Moon /> },
  { value: "system", icon: <Settings /> },
] as const;

// Language names stay in their own language so users can always find theirs.
const LANGUAGES = ["english", "german"] as const;

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
  // Subscribing via the hook re-renders the select when the language changes.
  const { t, i18n } = useTranslation();
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
  const {
    pause: pauseWorkoutSession,
    resume: resumeWorkoutSession,
    complete: completeWorkoutSession,
    isPending: isSessionActionPending,
  } = useSessionControls();

  // The server is the source of truth for a signed-in user's theme and
  // language, but only apply them once on load — otherwise this fires again
  // after every local change and reverts it before the mutation has a chance
  // to persist.
  const hasSyncedSettings = useRef(false);
  useEffect(() => {
    if (userSettings && !hasSyncedSettings.current) {
      hasSyncedSettings.current = true;
      if (userSettings.theme !== theme) {
        setTheme(userSettings.theme);
      }
      const locale = LANGUAGE_TO_LOCALE[userSettings.language];
      if (locale !== i18n.resolvedLanguage) {
        void i18n.changeLanguage(locale);
      }
    }
  }, [userSettings, theme, setTheme, i18n]);

  function handleThemeChange(value: Theme) {
    setTheme(value);
    updateSettings({ data: { theme: value } });
  }

  function handleLanguageChange(value: Language) {
    void i18n.changeLanguage(LANGUAGE_TO_LOCALE[value]);
    updateSettings({ data: { language: value } });
  }

  function handleTogglePause(
    event: React.MouseEvent<HTMLButtonElement>,
    session: WorkoutSessionRead,
  ) {
    event.stopPropagation();
    if (session.is_paused) {
      resumeWorkoutSession(session.id);
    } else {
      pauseWorkoutSession(session.id);
    }
  }

  function handleCompleteSession(
    event: React.MouseEvent<HTMLButtonElement>,
    session: WorkoutSessionRead,
  ) {
    event.stopPropagation();
    completeWorkoutSession(session);
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
      toastError(err, t("common.errors.logOutFailed"));
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
                  <BicepsFlexed></BicepsFlexed>
                </div>
                <span className="font-semibold">
                  <Trans
                    i18nKey="sidebar.brand"
                    values={{ name: user?.firstName ?? "" }}
                    components={{
                      highlight: (
                        <span className="rounded-md px-1 bg-foreground text-background" />
                      ),
                    }}
                  />
                </span>
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
                      tooltip={t(item.labelKey)}
                    >
                      <Link to={item.to} onClick={collapseSidebar}>
                        <Icon />
                        <span>{t(item.labelKey)}</span>
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
            <SidebarGroupLabel>
              {t("sidebar.activeSessions.title")}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {activeSessions.map((session) => (
                  <SidebarMenuItem
                    key={session.id}
                    onClick={() => {
                      router.navigate({
                        to: "/workouts/$workoutId",
                        params: { workoutId: session.id },
                      });
                      collapseSidebar();
                    }}
                    className="flex flex-row gap-1"
                  >
                    <SidebarMenuButton className="flex justify-between">
                      <span>
                        {session.template_name ??
                          t("sidebar.activeSessions.untitled")}
                      </span>
                      <div className="flex justify-center items-center mr-2">
                        {session.is_paused && (
                          <Pause className="size-3.5 text-muted-foreground"></Pause>
                        )}
                      </div>
                    </SidebarMenuButton>
                    <Button
                      variant={"outline"}
                      size={"icon"}
                      disabled={isSessionActionPending}
                      aria-label={
                        session.is_paused
                          ? t("sidebar.activeSessions.resume")
                          : t("sidebar.activeSessions.pause")
                      }
                      onClick={(event) => handleTogglePause(event, session)}
                    >
                      {session.is_paused ? <Play></Play> : <Pause></Pause>}
                    </Button>
                    <CompleteBlockedTooltip
                      blocked={!canCompleteSession(session)}
                    >
                      <Button
                        variant={"destructive"}
                        size={"icon"}
                        disabled={
                          isSessionActionPending || !canCompleteSession(session)
                        }
                        aria-label={t("sidebar.activeSessions.complete")}
                        onClick={(event) =>
                          handleCompleteSession(event, session)
                        }
                      >
                        <Square></Square>
                      </Button>
                    </CompleteBlockedTooltip>
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
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t("sidebar.themes.label")}</SelectLabel>
                  {THEMES.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.icon}
                      {t(`sidebar.themes.${theme.value}`)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Select
              value={currentLanguageSetting()}
              onValueChange={handleLanguageChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t("sidebar.languages.label")}</SelectLabel>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {t(`sidebar.languages.${language}`)}
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
            <SidebarMenuButton
              onClick={() => void logout()}
              tooltip={t("sidebar.logOut")}
            >
              <LogOut />
              <span>{t("sidebar.logOut")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
