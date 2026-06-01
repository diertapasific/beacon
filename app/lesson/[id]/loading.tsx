import { Mascot } from "@/components/ui/Mascot";

export default function LessonLoading() {
  return (
    <div className="bg-paper min-h-[100dvh] flex flex-col items-center justify-center gap-5 px-6 text-center">
      <Mascot state="thinking" size={160} />
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-clay-deep">
          / Getting ready
        </p>
        <p className="mt-1 text-lg font-extrabold tracking-tight text-ink">
          Loading your lesson…
        </p>
      </div>
    </div>
  );
}
