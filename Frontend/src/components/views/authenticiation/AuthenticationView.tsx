import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
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

const COPY: Record<Mode, { title: string; description: string; cta: string }> =
  {
    signin: {
      title: "Sign in",
      description: "Enter your credentials to access the app.",
      cta: "Sign in",
    },
    signup: {
      title: "Create account",
      description: "Sign up to get started.",
      cta: "Sign up",
    },
  };

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
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);

  const isSignup = mode === "signup";
  const copy = COPY[mode];

  function switchMode(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirmPassword("");
  }

  /** Cheap client-side checks. Returns an error message, or null if all good. */
  function validate(): string | null {
    if (isSignup && (!firstName.trim() || !lastName.trim())) {
      return "Enter your first and last name.";
    }
    if (!email.trim()) return "Enter your email address.";
    if (!password) return "Enter your password.";
    if (isSignup && password !== confirmPassword) {
      return "Passwords do not match.";
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
      toastError(err, isSignup ? "Sign up failed." : "Sign in failed.");
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4 bg-[rgba(0,0,0,0.01)] ">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
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
                  <Label htmlFor="first-name">First name</Label>
                  <Input
                    id="first-name"
                    autoComplete="given-name"
                    placeholder="Jane"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input
                    id="last-name"
                    autoComplete="family-name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 mb-3">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {isSignup && (
              <div className="space-y-2 mb-3">
                <Label htmlFor="confirm-password">Confirm password</Label>
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
              {pending ? "Please wait…" : copy.cta}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => switchMode(isSignup ? "signin" : "signup")}
              >
                {isSignup ? "Sign in" : "Sign up"}
              </button>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
