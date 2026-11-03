import Link from "next/link";

/** The mark: a fluted wooden dowel, the one fitting every flat pack has, lying across an ink circle. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={"mark " + (className ?? "")} aria-hidden="true">
      <circle cx="16" cy="16" r="15.5" fill="var(--ink)" />
      <path d="M6.2 11.4 A11 11 0 0 1 13 5.6" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.6" strokeLinecap="round" />
      <g className="mark-socket" transform="rotate(-38 16 16)">
        <rect x="5.6" y="12.4" width="20.8" height="7.2" rx="2.6" fill="var(--accent)" />
        <path d="M8.6 14.7 H23.4 M8.6 17.3 H23.4" stroke="var(--ink)" strokeWidth="1.05" strokeLinecap="round" opacity="0.42" />
        <path d="M8.2 12.4 V19.6 M23.8 12.4 V19.6" stroke="var(--ink)" strokeWidth="0.9" opacity="0.28" />
      </g>
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={"wordmark " + (className ?? "")}>dowel</span>;
}

export default function Logo({ href = "/", compact, size = 26 }: { href?: string; compact?: boolean; size?: number }) {
  return (
    <Link href={href} className="logo" aria-label="Dowel home">
      <LogoMark size={size} />
      {!compact && <Wordmark />}
    </Link>
  );
}
