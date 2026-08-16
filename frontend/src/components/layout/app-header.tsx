"use client";

import { useAuth } from "@/providers/auth-provider";

export function AppHeader() {
  const { user } = useAuth();

  const initials =
    user?.full_name
      ?.split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  const displayName =
    user?.full_name?.split(" ")[0] ?? "there";

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200/70 bg-white px-6 sm:px-8">
      {/* Header greeting */}

      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-indigo-600">
          Enterprise AI Assistant
        </p>

        <h1 className="mt-1 truncate text-xl font-bold tracking-tight text-slate-950">
          Welcome back, {displayName}{" "}
          <span aria-hidden="true">👋</span>
        </h1>
      </div>

      {/* Single user identity */}

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">
            {user?.full_name ?? "User"}
          </p>

          <p className="mt-0.5 text-xs text-slate-500">
            {user?.email ?? ""}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-sm">
          {initials}
        </div>
      </div>
    </header>
  );
}