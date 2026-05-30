import { Lighthouse } from "@phosphor-icons/react";
import Link from "next/link";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 group">
      <span className="grid place-items-center w-8 h-8 rounded-xl bg-ink text-accent-400 transition-transform group-hover:-translate-y-[1px]">
        <Lighthouse size={18} weight="fill" />
      </span>
      {!compact && (
        <span className="text-lg font-semibold tracking-tight text-ink">Beacon</span>
      )}
    </Link>
  );
}
