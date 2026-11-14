import { DAY_SECONDS, TOTAL_DAYS, getDay, type GameState } from "@/game/engine";
import { RESOURCES } from "@/game/content";
import { cn } from "@/lib/utils";

const LOW = 25;

export function ResourceHud({ game }: { game: GameState }) {
  const day = getDay(game);
  const missionPct = (game.elapsed / (TOTAL_DAYS * DAY_SECONDS)) * 100;

  return (
    <header className="panel flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <div className="font-display text-xl font-semibold whitespace-nowrap sm:text-2xl">
          📅 Day <span className="text-power">{day}</span>
          <span className="text-muted-foreground"> / {TOTAL_DAYS}</span>
        </div>
        <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-track">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
            style={{ width: `${missionPct}%` }}
          />
          <span
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm transition-[left] duration-200"
            style={{ left: `${Math.min(97, Math.max(3, missionPct))}%` }}
            aria-hidden
          >
            🚀
          </span>
        </div>
        <span className="text-xl" aria-hidden>
          🌕
        </span>
      </div>

      <ul className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {RESOURCES.map((r) => {
          const value = Math.max(0, Math.round(game.resources[r.key]));
          const low = value < LOW;
          return (
            <li
              key={r.key}
              className={cn(
                "flex flex-col gap-1 rounded-2xl bg-muted px-1.5 py-2 sm:px-3",
                low && "animate-wobble ring-2 ring-danger",
              )}
              aria-label={`${r.label} ${value} percent`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-lg sm:text-2xl" aria-hidden>
                  {r.emoji}
                </span>
                <span
                  className={cn(
                    "font-display text-sm font-semibold sm:text-lg",
                    low && "text-danger",
                  )}
                >
                  {value}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-track sm:h-3">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-200", low ? "bg-danger" : r.bar)}
                  style={{ width: `${value}%` }}
                />
              </div>
              <span className="truncate text-center text-[10px] font-bold tracking-wide text-muted-foreground uppercase sm:text-xs">
                {r.label}
              </span>
            </li>
          );
        })}
      </ul>
    </header>
  );
}
