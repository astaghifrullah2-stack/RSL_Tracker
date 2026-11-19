"use client";

import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg py-12">
      <div className="panel space-y-4 p-6">
        <p className="eyebrow">Admin Error</p>
        <h1 className="text-2xl font-black text-white">Something went wrong</h1>
        <p className="text-sm text-slate-400">
          {error?.message || "The requested admin action could not be completed."}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <Link href="/admin" className="btn">
            Back to Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
