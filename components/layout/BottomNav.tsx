"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, BookOpen } from "@phosphor-icons/react";

export function BottomNav({
  nextLessonId,
  pathId,
}: {
  nextLessonId: string | null;
  pathId?: string;
}) {
  const pathname = usePathname();
  const homeHref = pathId ? `/dashboard/${pathId}` : "/dashboard";
  const learnHref = nextLessonId ? `/lesson/${nextLessonId}` : homeHref;

  const items = [
    { href: homeHref, label: "Home", icon: House, active: pathname.startsWith("/dashboard") },
    {
      href: learnHref,
      label: "Learn",
      icon: BookOpen,
      active: pathname.startsWith("/lesson"),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 border-t border-zinc-200 bg-canvas/90 backdrop-blur-md">
      <div className="grid grid-cols-2">
        {items.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors active:scale-95 ${
              active ? "text-accent-600" : "text-zinc-400"
            }`}
          >
            <Icon size={22} weight={active ? "fill" : "regular"} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
