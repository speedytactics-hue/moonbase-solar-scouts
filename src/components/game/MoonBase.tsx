import { BUILDING_COOLDOWN, type BuildingId, type GameState } from "@/game/engine";
import { MAIN_BUILDINGS } from "@/game/content";
import { cn } from "@/lib/utils";
import { BuildingScene, type SceneAction } from "./BuildingScene";

export interface Pop {
  id: number;
  index: number;
  text: string;
}

interface Props {
  game: GameState;
  astronautAt: number;
  facing: 1 | -1;
  walking: boolean;
  pops: Pop[];
  inside: BuildingId | null;
  action: SceneAction | null;
  onBuilding: (id: BuildingId, index: number) => void;
  onInfo: (id: BuildingId) => void;
}

const centerOf = (index: number) => `${((index + 0.5) / MAIN_BUILDINGS.length) * 100}%`;

export function MoonBase({
  game,
  astronautAt,
  facing,
  walking,
  pops,
  inside,
  action,
  onBuilding,
  onInfo,
}: Props) {
  const storm = game.storm.active;

  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border-4 border-border shadow-panel"
      aria-label="Moon base"
    >
      {/* Scene: outside sky while walking, or the inside of the building you're in */}
      <div className="bg-space relative h-48 sm:h-64">
        {inside ? (
          <BuildingScene
            key={inside}
            id={inside}
            action={action}
            storm={storm}
            cooldown={game.cooldowns[inside === "habitat" ? "airlock" : "habitat"]}
            onGo={(id) => onBuilding(id, astronautAt)}
          />
        ) : (
          <>
            <div className="starfield absolute inset-0" aria-hidden />
            <span className="animate-float absolute top-4 right-6 text-5xl sm:text-7xl" aria-hidden>
              🌍
            </span>
            <span className="absolute top-6 left-6 text-3xl opacity-90 sm:text-4xl" aria-hidden>
              {storm ? "🌞" : "☀️"}
            </span>
            <span className="absolute bottom-3 left-[38%] text-2xl opacity-80" aria-hidden>
              🛰️
            </span>
          </>
        )}

        {storm && (
          <div
            role="alert"
            className="animate-pop-in absolute inset-x-3 top-3 z-20 rounded-3xl bg-danger px-4 py-2 text-center text-destructive-foreground shadow-panel sm:inset-x-10 sm:py-3"
          >
            <p className="font-display text-xl font-semibold sm:text-3xl">⚠️ SOLAR STORM! ⚠️</p>
            <p className="text-sm font-bold sm:text-base">
              Tap the Habitat 🏠 to hide the crew! ({Math.ceil(game.storm.timeLeft)}s)
            </p>
          </div>
        )}
      </div>

      {/* Moon surface */}
      <div className="bg-moon-surface relative px-2 pt-2 pb-4 sm:px-4">
        {/* Astronaut lane */}
        <div className="relative h-16 sm:h-20">
          <div
            className={cn(
              "absolute bottom-0 -translate-x-1/2 transition-[left,opacity] duration-700 ease-in-out",
              inside && "opacity-0",
            )}
            style={{ left: centerOf(astronautAt) }}
          >
            <span
              className={cn("block text-5xl drop-shadow-lg sm:text-6xl", walking && "animate-bob")}
              style={{ transform: `scaleX(${facing === 1 ? -1 : 1})` }}
              role="img"
              aria-label="Astronaut"
            >
              👨‍🚀
            </span>
          </div>
          {pops.map((p) => (
            <span
              key={p.id}
              className="animate-rise-fade pointer-events-none absolute bottom-10 z-20 rounded-full bg-card px-2 py-0.5 font-display text-xs font-semibold whitespace-nowrap text-card-foreground shadow-panel sm:text-sm"
              style={{ left: centerOf(p.index) }}
            >
              {p.text}
            </span>
          ))}
        </div>

        {/* Buildings */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {MAIN_BUILDINGS.map((b, index) => {
            const cooling = game.cooldowns[b.id] > 0;
            const shelterTarget = storm && b.id === "habitat";
            const here = inside === b.id;
            return (
              <div key={b.id} className="relative">
                <button
                  type="button"
                  onClick={() => onBuilding(b.id, index)}
                  className={cn(
                    "arcade flex w-full flex-col items-center gap-1 overflow-hidden rounded-3xl px-1 pt-3 pb-4 sm:pt-4 sm:pb-5",
                    b.tone,
                    shelterTarget && "ring-4 ring-danger",
                    here && !shelterTarget && "ring-4 ring-accent",
                    cooling && !shelterTarget && "opacity-75",
                  )}
                  aria-label={`${b.name}: ${b.effect}`}
                >
                  <span
                    className={cn("text-3xl sm:text-5xl", shelterTarget && "animate-wobble")}
                    aria-hidden
                  >
                    {b.emoji}
                  </span>
                  <span className="font-display text-[11px] leading-tight font-semibold sm:text-base">
                    {b.name}
                  </span>
                  {cooling && (
                    <span
                      className="absolute bottom-1.5 left-1/2 h-1.5 w-2/3 -translate-x-1/2 overflow-hidden rounded-full bg-track/40"
                      aria-hidden
                    >
                      <span
                        className="block h-full rounded-full bg-primary-foreground"
                        style={{ width: `${(1 - game.cooldowns[b.id] / BUILDING_COOLDOWN) * 100}%` }}
                      />
                    </span>
                  )}
                </button>
                {here && (
                  <span
                    className="animate-pop-in absolute -top-2 -left-1 z-10 grid h-7 w-7 place-items-center rounded-full border-2 border-accent bg-popover text-base shadow-panel sm:h-8 sm:w-8"
                    title="Your astronaut is here"
                    aria-hidden
                  >
                    👨‍🚀
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onInfo(b.id)}
                  className="absolute -top-2 -right-1 z-10 grid h-7 w-7 place-items-center rounded-full border-2 border-moon-crater bg-popover font-display text-sm font-bold text-popover-foreground shadow-panel transition-transform hover:scale-110 sm:h-8 sm:w-8"
                  aria-label={`Learn about the ${b.name}`}
                >
                  ?
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
