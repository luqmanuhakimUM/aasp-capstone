import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-(--border-subtle) px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-[12px] text-(--muted) sm:flex-row sm:items-center sm:justify-between">
        <p>
          AI Academic Success Platform (AASP) — research, citation, and
          integrity support for students without access to a library or
          writing tutor.
        </p>
        <div className="flex gap-5">
          <Link href="/features" className="hover:text-(--foreground)">
            Features
          </Link>
          <Link href="/universities" className="hover:text-(--foreground)">
            For Universities
          </Link>
          <Link href="/about" className="hover:text-(--foreground)">
            About
          </Link>
          <Link href="/contact" className="hover:text-(--foreground)">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
