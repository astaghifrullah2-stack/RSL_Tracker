import Link from "next/link";
import { LoginForm } from "@/components/admin/ui";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin login" };

export default async function AdminLoginPage() {
  const authed = await isAdmin();
  if (authed) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <p className="eyebrow mb-3">Authenticated</p>
        <h1 className="page-title">
          You&apos;re signed in<span className="text-orange-400">.</span>
        </h1>
        <p className="muted mt-3">Your admin session is active.</p>
        <Link href="/admin" className="btn btn-primary mt-6">
          Open Admin Dashboard →
        </Link>
      </div>
    );
  }
  return <LoginForm />;
}
