import { FormEvent, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { login } from "@/services/chatService";
import { Bot, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(128),
});

interface Props {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: Props) {
  const setToken = useAuthStore((s) => s.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"email" | "password", string>>>({});

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    setFieldErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fe: typeof fieldErrors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as "email" | "password";
        if (!fe[k]) fe[k] = issue.message;
      }
      setFieldErrors(fe);
      return;
    }

    setLoading(true);
    try {
      const token = await login(parsed.data.email, parsed.data.password);
      setToken(token);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 400) setErr("Invalid email or password");
      else if (e?.code === "ERR_NETWORK") setErr("Network error — please try again");
      else setErr(e?.response?.data?.detail || e?.response?.data?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <h1 className="mt-3 text-xl font-semibold">Scrum AI</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-border bg-surface-elevated p-5 space-y-3"
          noValidate
        >
          <div>
            <label className="text-xs font-medium text-muted-foreground">Email</label>
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
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              placeholder="••••••••"
            />
            {fieldErrors.password && (
              <p className="mt-1 text-[11px] text-destructive">{fieldErrors.password}</p>
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
            Sign in
          </button>

          <p className="text-center text-xs text-muted-foreground pt-1">
            No account?{" "}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-accent hover:underline font-medium"
            >
              Create one
            </button>
          </p>
        </form>


      </div>
    </div>
  );
}
