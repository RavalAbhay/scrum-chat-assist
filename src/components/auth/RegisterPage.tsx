import { FormEvent, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { register } from "@/services/chatService";
import { Bot, Loader2, AlertCircle, CheckCircle2, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { z } from "zod";

const DEMO_PASSWORD = "Demo@1234";

const registerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name is too long" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Only letters, spaces, ' and -" }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(50, { message: "Last name is too long" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Only letters, spaces, ' and -" }),
  email: z
    .string()
    .trim()
    .email({ message: "Enter a valid email address" })
    .max(255)
    .refine((v) => !/@(gmail|yahoo|outlook|hotmail|icloud)\./i.test(v), {
      message: "Please use your company email",
    }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(128)
    .regex(/[A-Z]/, { message: "Add at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Add at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Add at least one number" }),
  scrumToken: z
    .string()
    .trim()
    .min(10, { message: "Token looks too short" })
    .max(512, { message: "Token is too long" }),
});

type FieldKey = "firstName" | "lastName" | "email" | "password" | "scrumToken";

interface Props {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: Props) {
  const setToken = useAuthStore((s) => s.setToken);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [scrumToken, setScrumToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ name: string; companyName: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setFieldErrors({});

    const parsed = registerSchema.safeParse({
      firstName,
      lastName,
      email,
      password,
      scrumToken,
    });
    if (!parsed.success) {
      const fe: Partial<Record<FieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as FieldKey;
        if (!fe[k]) fe[k] = issue.message;
      }
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      const res = await register(parsed.data);
      setSuccess({ name: res.name, companyName: res.companyName });
      setTimeout(() => setToken(res.token), 900);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) setErr("An account with this email already exists");
      else if (e?.code === "ERR_NETWORK") setErr("Network error — please try again");
      else setErr(e?.response?.data?.detail || e?.response?.data?.message || e?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-4">
        <div className="w-full max-w-sm rounded-xl border border-border bg-surface-elevated p-6 text-center">
          <div className="mx-auto h-11 w-11 rounded-full bg-accent/10 text-accent flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-base font-semibold">Welcome, {success.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Connected to <span className="text-foreground font-medium">{success.companyName}</span>
          </p>
          <p className="mt-3 text-xs text-muted-foreground">Signing you in…</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-6">
            <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <h1 className="mt-3 text-xl font-semibold">Create your account</h1>
            <p className="text-sm text-muted-foreground">
              Connect your Scrum workspace to get started
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-xl border border-border bg-surface-elevated p-5 space-y-3"
            noValidate
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">First name</label>
                <input
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  placeholder="Jane"
                />
                {fieldErrors.firstName && (
                  <p className="mt-1 text-[11px] text-destructive">{fieldErrors.firstName}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Last name</label>
                <input
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                  placeholder="Doe"
                />
                {fieldErrors.lastName && (
                  <p className="mt-1 text-[11px] text-destructive">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Company email</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="you@company.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-[11px] text-destructive">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Password requirements"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[220px]">
                    <p className="text-xs font-semibold mb-1">Password must contain:</p>
                    <ul className="text-[11px] space-y-0.5 list-disc pl-3.5">
                      <li>At least 8 characters</li>
                      <li>One uppercase letter (A-Z)</li>
                      <li>One lowercase letter (a-z)</li>
                      <li>One number (0-9)</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </div>
              <input
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder={DEMO_PASSWORD}
              />
              {fieldErrors.password && (
                <p className="mt-1 text-[11px] text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Jira / Scrum API token
              </label>
              <input
                type="password"
                required
                value={scrumToken}
                onChange={(e) => setScrumToken(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono outline-none focus:border-accent"
                placeholder="ATATT..."
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                We'll use this to fetch your company workspace. Stored encrypted.
              </p>
              {fieldErrors.scrumToken && (
                <p className="mt-1 text-[11px] text-destructive">{fieldErrors.scrumToken}</p>
              )}
            </div>

            {err && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition disabled:opacity-60"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create account
            </button>

            <p className="text-center text-xs text-muted-foreground pt-1">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-accent hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
