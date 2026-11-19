"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  createContext,
  useContext,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { AdminActionName } from "@/lib/admin-action-names";
import { cn } from "@/lib/site";

const STORAGE_KEY = "rsl_admin_token";

const FormPendingContext = createContext(false);

function readStoredToken(): string | null {
  try {
    const sp = new URLSearchParams(window.location.search);
    return sp.get("__at") || sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function withIframeTokenIfNeeded(targetPath: string): string {
  try {
    const currentSp = new URLSearchParams(window.location.search);
    const urlToken = currentSp.get("__at");
    if (!urlToken || targetPath.includes("__at=")) return targetPath;
    const sep = targetPath.includes("?") ? "&" : "?";
    return `${targetPath}${sep}__at=${encodeURIComponent(urlToken)}`;
  } catch {
    return targetPath;
  }
}

export function SubmitButton({
  children,
  className,
  variant = "primary",
}: {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "default" | "danger";
}) {
  const pending = useContext(FormPendingContext);
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "danger" && "btn-danger",
        className,
      )}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

export function AdminForm({
  action,
  children,
  className,
  confirmMessage,
  resetOnSuccess = false,
}: {
  action: AdminActionName;
  children: ReactNode;
  className?: string;
  confirmMessage?: string;
  resetOnSuccess?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (confirmMessage && !window.confirm(confirmMessage)) return;

    const formEl = e.currentTarget;
    const fd = new FormData(formEl);
    fd.set("__action", action);

    const token = readStoredToken();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) {
      fd.set("__admin_token", token);
      headers["x-rsl-admin-token"] = token;
    }

    setPending(true);
    setInlineError(null);

    try {
      const res = await fetch("/api/admin/mutate", {
        method: "POST",
        credentials: "include",
        headers,
        body: fd,
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
        redirectTo?: string;
      };

      if (res.status === 401) {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore storage errors
        }
        router.replace("/admin");
        router.refresh();
        return;
      }

      if (data.ok && resetOnSuccess) {
        formEl.reset();
      }

      if (data.redirectTo) {
        const nextUrl = withIframeTokenIfNeeded(data.redirectTo);
        const nextPathname = nextUrl.split("?")[0];
        if (nextPathname !== pathname) {
          router.push(nextUrl);
        } else {
          router.replace(nextUrl, { scroll: false });
        }
        router.refresh();
        return;
      }

      if (!res.ok || !data.ok) {
        setInlineError(data.error || "Could not save changes. Please try again.");
      } else {
        router.refresh();
      }
    } catch {
      setInlineError("Network error while saving. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <FormPendingContext.Provider value={pending}>
      <form onSubmit={handleSubmit} className={className}>
        {children}
        {inlineError && className !== "contents" ? (
          <p className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 sm:col-span-full">
            {inlineError}
          </p>
        ) : null}
      </form>
    </FormPendingContext.Provider>
  );
}

/** A compact form that asks for confirmation before running an action. */
export function ConfirmForm({
  action,
  message,
  hidden,
  children,
  className,
  variant = "danger",
}: {
  action: AdminActionName;
  message: string;
  hidden: Record<string, string | number>;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "default" | "danger";
}) {
  return (
    <AdminForm action={action} confirmMessage={message} className={cn("inline", className)}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={String(v)} />
      ))}
      <SubmitButton variant={variant} className="btn-sm">
        {children}
      </SubmitButton>
    </AdminForm>
  );
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div
      className={cn(
        "mb-6 rounded-xl border px-4 py-3 text-sm font-semibold",
        error
          ? "border-red-500/30 bg-red-500/10 text-red-200"
          : "border-orange-500/30 bg-orange-500/10 text-orange-200",
      )}
    >
      {error ?? ok}
    </div>
  );
}

function AdminSessionBridgeInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlToken = searchParams.get("__at");

  useEffect(() => {
    try {
      if (urlToken) {
        sessionStorage.setItem(STORAGE_KEY, urlToken);
      }
    } catch {
      // Ignore storage restrictions
    }
    if (!urlToken) return;

    const patchLinks = () => {
      document.querySelectorAll<HTMLAnchorElement>('a[href^="/admin"]').forEach((anchor) => {
        const rawHref = anchor.getAttribute("href");
        if (!rawHref || rawHref.includes("__at=")) return;
        const sep = rawHref.includes("?") ? "&" : "?";
        anchor.setAttribute("href", `${rawHref}${sep}__at=${encodeURIComponent(urlToken)}`);
      });
    };

    patchLinks();
    const observer = new MutationObserver(patchLinks);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname, searchParams, urlToken]);

  return null;
}

export function AdminSessionBridge() {
  return (
    <Suspense fallback={null}>
      <AdminSessionBridgeInner />
    </Suspense>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    try {
      await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    } catch {
      // Ignore network errors
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleSignOut} disabled={busy} className="btn btn-sm ml-auto">
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

function LoginFormInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (searchParams.get("__at")) return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const target = pathname === "/admin/login" ? "/admin" : pathname;
        router.replace(`${target}?__at=${encodeURIComponent(saved)}`);
      }
    } catch {
      // Ignore storage errors
    }
  }, [pathname, router, searchParams]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        token?: string;
        error?: string;
      };

      if (!res.ok || !data.ok) {
        setError(data.error || "Incorrect password. Try again.");
        setPending(false);
        return;
      }

      if (data.token) {
        try {
          sessionStorage.setItem(STORAGE_KEY, data.token);
        } catch {
          // Ignore storage restrictions
        }
      }

      const check = await fetch("/api/admin/session", {
        credentials: "include",
        cache: "no-store",
      })
        .then((r) => r.json() as Promise<{ authed?: boolean }>)
        .catch(() => ({ authed: false }));

      const targetBase = pathname && pathname !== "/admin/login" ? pathname : "/admin";
      if (check.authed) {
        router.replace(targetBase);
        router.refresh();
      } else if (data.token) {
        router.replace(`${targetBase}?__at=${encodeURIComponent(data.token)}`);
        router.refresh();
      } else {
        router.replace(targetBase);
        router.refresh();
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-6">
      <p className="eyebrow mb-3">Restricted Access</p>
      <h1 className="page-title">
        Admin login<span className="text-orange-400">.</span>
      </h1>
      <p className="muted mt-3">
        Enter the league administrator password to manage teams, players, playersheets, matches, trophies and GFX.
      </p>

      <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
        <div>
          <label className="label" htmlFor="password">
            Admin Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="Enter admin password…"
          />
        </div>
        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in to Admin"}
        </button>
      </form>
    </div>
  );
}

export function LoginForm(_props?: { usingDefault?: boolean; defaultPassword?: string }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md py-6">
          <p className="eyebrow mb-3">Restricted Access</p>
          <h1 className="page-title">
            Admin login<span className="text-orange-400">.</span>
          </h1>
          <div className="panel mt-8 h-44 animate-pulse p-6" />
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
