"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";

function BrandLogo() {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 backdrop-blur">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path
          d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72M18.36 5.64L5.64 18.36"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="12"
          r="4.2"
          stroke="currentColor"
          strokeWidth="1.7"
        />
      </svg>
    </div>
  );
}

function FeatureIcon({
  type,
}: {
  type: "sources" | "chat" | "answers";
}) {
  if (type === "sources") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path
          d="M12 16V4M12 4L7.5 8.5M12 4l4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5 13.5v3A2.5 2.5 0 007.5 19h9a2.5 2.5 0 002.5-2.5v-3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "chat") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-7 w-7"
        aria-hidden="true"
      >
        <path
          d="M5 5.5h14a2 2 0 012 2v8a2 2 0 01-2 2H11l-4.5 3v-3H5a2 2 0 01-2-2v-8a2 2 0 012-2Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M8 11.5h.01M12 11.5h.01M16 11.5h.01"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path
        d="M12 3l7 3v5c0 4.7-2.9 8.5-7 10-4.1-1.5-7-5.3-7-10V6l7-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m8.5 12 2.2 2.2 4.8-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SourceIcon({ label }: { label: string }) {
  return (
    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-center transition hover:border-indigo-400/40 hover:bg-white/[0.07]">
      <div className="text-xs font-semibold text-slate-200">
        {label}
      </div>
    </div>
  );
}

function FieldIcon({
  type,
}: {
  type: "user" | "email" | "lock";
}) {
  if (type === "user") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="8"
          r="3.2"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="M5.5 19c.8-3.1 3.1-4.8 6.5-4.8s5.7 1.7 6.5 4.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "email") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect
          x="3.5"
          y="5"
          width="17"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path
          d="m5 7 7 5.5L19 7"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 10V7.5a4 4 0 018 0V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      setError(
        "Full name must contain at least 2 characters.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        full_name: trimmedName,
        email: trimmedEmail,
        password,
      });

      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(
          "Unable to create your account. Please try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-white" />
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-slate-950 text-white">
      <div className="grid h-full lg:grid-cols-[56%_44%]">

        {/* =====================================================
            LEFT PRODUCT PANEL
        ====================================================== */}

        <section className="relative hidden h-full overflow-hidden lg:flex">
          {/* Background glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(99,102,241,0.22),transparent_28%),radial-gradient(circle_at_82%_70%,rgba(79,70,229,0.22),transparent_32%)]" />

          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-700/20 blur-3xl" />

          <div className="relative z-10 flex h-full w-full flex-col px-10 py-5 xl:px-12">

            {/* Brand */}
            <div className="flex items-center gap-4">
              <BrandLogo />

              <div>
                <p className="text-lg font-semibold leading-tight tracking-tight text-white">
                  Enterprise AI
                </p>
                <p className="text-lg font-semibold leading-tight tracking-tight text-white">
                  Knowledge Assistant
                </p>
              </div>
            </div>

            {/* Gradient divider */}
            <div className="mt-7 h-px w-full bg-gradient-to-r from-indigo-500 via-purple-500/70 to-transparent" />

            {/* Hero */}
            <div className="mt-6">
              <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight xl:text-5xl">
                Make your information
                <span className="block bg-gradient-to-r from-cyan-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                  instantly searchable.
                </span>
              </h1>
            </div>

            {/* Knowledge visual */}
            <div className="relative mt-2 flex h-32 items-center justify-center xl:h-32">
              <div className="absolute h-28 w-28 rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-cyan-500/20 via-indigo-500/20 to-purple-600/30 shadow-[0_0_70px_rgba(99,102,241,0.35)] rotate-12" />

              <div className="absolute h-24 w-24 rounded-2xl border border-purple-400/30 bg-slate-950/70 backdrop-blur rotate-12" />

              <div className="relative z-10 flex w-64 items-center rounded-full border border-white/15 bg-slate-900/80 px-5 py-3 shadow-[0_0_35px_rgba(99,102,241,0.25)] backdrop-blur">
                <span className="flex-1 text-sm text-slate-300">
                  Ask your knowledge...
                </span>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-500">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    <circle
                      cx="10.8"
                      cy="10.8"
                      r="6"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <path
                      d="m16 16 4 4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-3 gap-4">

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-indigo-400/30">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/30 to-cyan-500/20 text-cyan-300 ring-1 ring-white/10">
                  <FeatureIcon type="sources" />
                </div>

                <h2 className="text-base font-semibold">
                  Bring your sources
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Upload documents, connect web links,
                  images, spreadsheets and more.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-indigo-400/30">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/20 text-purple-300 ring-1 ring-white/10">
                  <FeatureIcon type="chat" />
                </div>

                <h2 className="text-base font-semibold">
                  Ask naturally
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  No complex searches. Ask questions
                  in plain language.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur transition hover:-translate-y-1 hover:border-indigo-400/30">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/20 text-blue-300 ring-1 ring-white/10">
                  <FeatureIcon type="answers" />
                </div>

                <h2 className="text-base font-semibold">
                  Get grounded answers
                </h2>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Get AI answers generated from your
                  indexed information.
                </p>
              </div>

            </div>

            {/* Supported sources */}
            <div className="mt-3">
              <div className="mb-3 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-sm font-medium text-slate-300">
                  Supported sources
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "PDF",
                  "DOCX",
                  "PPTX",
                  "XLSX",
                  "XLS",
                  "CSV",
                  "TXT",
                  "MD",
                  "Images",
                  "Web",
                  "YouTube",
                ].map((source) => (
                  <SourceIcon
                    key={source}
                    label={source}
                  />
                ))}
              </div>
            </div>

            {/* Privacy / workspace strip */}
            <div className="mt-3 flex items-center gap-4 rounded-2xl border border-indigo-400/20 bg-slate-900/70 px-5 py-4 backdrop-blur">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/10 text-indigo-300">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <rect
                    x="5"
                    y="10"
                    width="14"
                    height="10"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 10V7.5a4 4 0 018 0V10"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold">
                  Your information. Your workspace.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Keep your sources organized and accessible
                  from one intelligent workspace.
                </p>
              </div>

              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 xl:flex">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    d="m5 12 4 4L19 6"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

          </div>
        </section>

        {/* =====================================================
            RIGHT REGISTRATION PANEL
        ====================================================== */}

        <section className="flex h-full items-center justify-center overflow-hidden bg-slate-50 px-5 py-2 text-slate-900 sm:px-8">

          <div className="w-full max-w-xl">

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-6">

              {/* Heading */}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Create your account
                  </h2>

                  <span className="text-lg text-indigo-500">
                    ✦
                  </span>
                </div>

                <p className="mt-2 text-sm text-slate-500">
                  Start your journey to smarter knowledge
                  discovery.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-2.5"
              >

                {/* Full name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-1.5 block text-sm font-semibold text-slate-800"
                  >
                    Full name
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FieldIcon type="user" />
                    </span>

                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(event.target.value)
                      }
                      placeholder="Your full name"
                      required
                      disabled={isSubmitting}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-semibold text-slate-800"
                  >
                    Email address
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FieldIcon type="email" />
                    </span>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="you@example.com"
                      required
                      disabled={isSubmitting}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-sm font-semibold text-slate-800"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FieldIcon type="lock" />
                    </span>

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      disabled={isSubmitting}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value,
                        )
                      }
                      disabled={isSubmitting}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showPassword ? "◉" : "○"}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-sm font-semibold text-slate-800"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <FieldIcon type="lock" />
                    </span>

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value,
                        )
                      }
                      placeholder="Re-enter your password"
                      required
                      minLength={8}
                      disabled={isSubmitting}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value,
                        )
                      }
                      disabled={isSubmitting}
                      aria-label={
                        showConfirmPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      {showConfirmPassword
                        ? "◉"
                        : "○"}
                    </button>
                  </div>
                </div>

                {/* Password guidance */}
                <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-3.5 py-2.5">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-indigo-600 shadow-sm">
                      <FieldIcon type="lock" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-indigo-700">
                        Strong password tips
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Use at least 8 characters with a
                        combination of letters, numbers,
                        and symbols.
                      </p>

                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-indigo-600">
                          8+ characters
                        </span>

                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-indigo-600">
                          A–Z
                        </span>

                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-indigo-600">
                          0–9
                        </span>

                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-medium text-indigo-600">
                          !@#
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !fullName.trim() ||
                    !email.trim() ||
                    !password ||
                    !confirmPassword
                  }
                  className="mt-1 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/25 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <span className="text-lg">
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Login link */}
              <div className="mt-4">
                <div className="mb-3 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-400">
                    or
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <p className="text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="font-semibold text-indigo-600 transition hover:text-indigo-700"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </div>

            <p className="mt-2 text-center text-xs text-slate-400">
              © 2026 Enterprise AI Knowledge Assistant.
              All rights reserved.
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}