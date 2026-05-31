import { Lighthouse } from "@phosphor-icons/react";
import Link from "next/link";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <span className="grid place-items-center w-9 h-9 rounded-xl bg-clay text-cream shadow-hard-clay
        transition-transform group-hover:-translate-y-0.5 group-hover:rotate-[-6deg]">
        <Lighthouse size={19} weight="fill" />
      </span>
      {!compact && (
        <span className="text-2xl font-extrabold tracking-tight text-clay">Beacon</span>
      )}
    </Link>
  );
}
