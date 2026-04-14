import Link from "next/link";

export default function NotFound() {
  return (
    <section className="glass-surface rounded-[var(--radius-lg)] p-6">
      <h1 className="text-5xl text-[var(--text)]">404</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">找不到這個頁面。</p>
      <Link className="mt-4 inline-block text-[var(--primary)] underline" href="/">
        回到搜尋頁
      </Link>
    </section>
  );
}
