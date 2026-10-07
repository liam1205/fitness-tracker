import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { auth } from "@/lib/auth";
import { toastError } from "@/lib/errors";

/** Where to land after successful auth when no redirect target is given. */
const DEFAULT_REDIRECT = "/";

type Mode = "signin" | "signup";

interface AuthenticationViewProps {
  /** Path to return to after auth (set by the auth guard's `?redirect=`). */
  redirectTo?: string;
}

/**
 * Full-screen auth view handling both sign-in and sign-up. This is the only
 * thing an unauthenticated user can see — every other route is gated behind the
 * `_authenticated` guard, which sends them here. On success it flips the auth
 * store and navigates onward; on failure the reason is surfaced as a toast.
 *
 * Both flows are placeholders (see `@/lib/auth`); swap `auth.login` / `auth.signup`
 * for real backend calls and this view keeps working unchanged.
 */
export function AuthenticationView({ redirectTo }: AuthenticationViewProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";

  function switchMode(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirmPassword("");
  }

  /** Cheap client-side checks. Returns an error message, or null if all good. */
  function validate(): string | null {
    if (isSignup && (!firstName.trim() || !lastName.trim())) {
      return t("auth.validation.nameRequired");
    }
    if (!email.trim()) return t("auth.validation.emailRequired");
    if (!password) return t("auth.validation.passwordRequired");
    if (isSignup && password !== confirmPassword) {
      return t("auth.validation.passwordMismatch");
    }
    return null;
  }

  async function submit() {
    const invalid = validate();
    if (invalid) {
      toast.error(invalid);
      return;
    }

    setPending(true);
    try {
      if (isSignup) {
        await auth.signup({ firstName, lastName, email, password });
      } else {
        await auth.login(email, password);
      }
      // Re-run route guards now that auth state changed, then continue on.
      await router.invalidate();
      router.history.push(redirectTo || DEFAULT_REDIRECT);
    } catch (err) {
      toastError(
        err,
        isSignup
          ? t("common.errors.signUpFailed")
          : t("common.errors.signInFailed"),
      );
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4 bg-[rgba(0,0,0,0.01)] ">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t(`auth.${mode}.title`)}</CardTitle>
          <CardDescription>{t(`auth.${mode}.description`)}</CardDescription>
        </CardHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <CardContent className="space-y-4">
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="first-name">
                    {t("auth.fields.firstName")}
                  </Label>
                  <Input
                    id="first-name"
                    autoComplete="given-name"
                    placeholder={t("auth.placeholders.firstName")}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">{t("auth.fields.lastName")}</Label>
                  <Input
                    id="last-name"
                    autoComplete="family-name"
                    placeholder={t("auth.placeholders.lastName")}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.fields.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder={t("auth.placeholders.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 mb-3">
              <Label htmlFor="password">{t("auth.fields.password")}</Label>
              <PasswordInput
                id="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {isSignup && (
              <div className="space-y-2 mb-3">
                <Label htmlFor="confirm-password">
                  {t("auth.fields.confirmPassword")}
                </Label>
                <PasswordInput
                  id="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? t("auth.pending") : t(`auth.${mode}.cta`)}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isSignup ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => switchMode(isSignup ? "signin" : "signup")}
              >
                {isSignup ? t("auth.signin.cta") : t("auth.signup.cta")}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
