export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`beacon-shimmer rounded-xl bg-zinc-200/70 ${className}`} />;
}
