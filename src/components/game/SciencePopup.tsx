import { Button } from "@/components/ui/button";

interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
  effect?: string;
  paragraphs: string[];
  onClose: () => void;
}

export function SciencePopup({ emoji, title, subtitle, effect, paragraphs, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-space/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="science-title"
    >
      <div className="moon-card animate-pop-in relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8">
        <div className="mb-3 flex items-center gap-4">
          <span className="animate-float inline-block text-6xl" aria-hidden>
            {emoji}
          </span>
          <div>
            {subtitle && (
              <p className="text-xs font-extrabold tracking-widest uppercase opacity-70">{subtitle}</p>
            )}
            <h2 id="science-title" className="text-2xl leading-tight font-semibold sm:text-3xl">
              {title}
            </h2>
          </div>
        </div>

        {effect && (
          <p className="mb-4 rounded-2xl bg-moon-ink/10 px-4 py-2 text-sm font-bold">🎮 {effect}</p>
        )}

        <p className="mb-2 text-xs font-extrabold tracking-widest uppercase opacity-70">
          🔭 Real NASA science
        </p>
        <ul className="space-y-3 text-base leading-relaxed">
          {paragraphs.map((p) => (
            <li key={p} className="flex gap-2">
              <span aria-hidden>⭐</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col items-center gap-2">
          <Button variant="arcade" size="lg" className="tone-secondary h-14 px-8 text-xl" onClick={onClose} autoFocus>
            Got it! Back to base 🚀
          </Button>
          <p className="text-xs font-bold opacity-60">The game is paused while you read.</p>
        </div>
      </div>
    </div>
  );
}
