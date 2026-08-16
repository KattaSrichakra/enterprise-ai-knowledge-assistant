"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
  },
  {
    label: "Chat",
    href: "/chat",
    icon: "chat",
  },
  {
    label: "Documents",
    href: "/documents",
    icon: "document",
  },
  {
    label: "Workspaces",
    href: "/workspaces",
    icon: "workspace",
  },
];

function NavigationIcon({
  type,
}: {
  type: string;
}) {
  if (type === "dashboard") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10.5V20h13v-9.5" />
        <path d="M9.5 20v-5.5h5V20" />
      </svg>
    );
  }

  if (type === "chat") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-4 2v-4.5A7.5 7.5 0 1 1 20 11.5Z" />
        <path d="M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
      </svg>
    );
  }

  if (type === "document") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-4 w-4"
      >
        <path d="M7 3.5h7l4 4V20.5H7z" />
        <path d="M14 3.5v4h4" />
        <path d="M9.5 12h5M9.5 15.5h5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path d="m12 3 8 9-8 9-8-9 8-9Z" />
      <path d="m12 8 3.5 4-3.5 4-3.5-4L12 8Z" />
    </svg>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white">
      {/* Brand */}

      <div className="flex h-[72px] items-center border-b border-slate-100 px-5">
        <Link
          href="/dashboard"
          className="group flex items-center gap-3"
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-600 text-white shadow-sm transition group-hover:shadow-md">
            <span className="text-sm font-bold">
              AI
            </span>

            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-indigo-400 ring-2 ring-white" />
          </div>

          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-slate-950">
              Enterprise AI
            </p>

            <p className="text-sm font-semibold tracking-tight text-indigo-600">
              Knowledge Assistant
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}

      <nav className="flex-1 px-3 py-6">
        <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Workspace
        </p>

        <div className="space-y-1.5">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-slate-950 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-600 hover:bg-indigo-50 hover:text-slate-950",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition",
                    isActive
                      ? "bg-white/10 text-indigo-200"
                      : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-indigo-600",
                  ].join(" ")}
                >
                  <NavigationIcon type={item.icon} />
                </span>

                <span>{item.label}</span>

                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-300" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sign out */}

      <div className="border-t border-slate-100 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4"
            >
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M19 4h2v16h-2" />
            </svg>
          </span>

          Sign out
        </button>
      </div>
    </aside>
  );
}