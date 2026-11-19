import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <p className="eyebrow mb-3">404</p>
      <h1 className="page-title">Not on record</h1>
      <p className="muted mt-3">
        We couldn&apos;t find that page. It may have been deleted or never existed.
      </p>
      <Link href="/" className="btn btn-primary mt-8">
        Back to the tracker
      </Link>
    </div>
  );
}
