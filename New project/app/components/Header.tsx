import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-slate/10 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <Link href="/" className="text-lg font-semibold text-ink">
            Newark Civic Circuit
          </Link>
          <p className="text-sm text-slate/70">Civic input + prioritization for Newark.</p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/issue/new" className="rounded-full bg-ink px-4 py-2 text-white">
            Post Issue
          </Link>
          <Link href="/brief" className="text-ink">
            Monthly Brief
          </Link>
        </nav>
      </div>
    </header>
  );
}
