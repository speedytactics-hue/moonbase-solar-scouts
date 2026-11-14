import airlockImg from "@/assets/inside-airlock.jpg";
import greenhouseImg from "@/assets/inside-greenhouse.jpg";
import habitatImg from "@/assets/inside-habitat.jpg";
import recyclerImg from "@/assets/inside-recycler.jpg";
import solarImg from "@/assets/inside-solar.jpg";
import { BUILDING_BY_ID, SHELTER_ACTIVITY } from "@/game/content";
import type { BuildingId } from "@/game/engine";
import { cn } from "@/lib/utils";

export interface SceneAction {
  key: number;
  id: BuildingId;
  kind: "used" | "sheltered";
}

const BACKDROPS: Record<BuildingId, string> = {
  airlock: airlockImg,
  solar: solarImg,
  greenhouse: greenhouseImg,
  recycler: recyclerImg,
  habitat: habitatImg,
};

/** Little emoji props that animate around the astronaut while they work. */
interface Prop {
  emoji: string;
  at: string; // position relative to the astronaut
  anim: string;
  delay?: number;
  flip?: boolean;
  size?: string;
}

const ACTIVITY_PROPS: Record<BuildingId, Prop[]> = {
  airlock: [
    { emoji: "💨", at: "-right-14 top-1", anim: "animate-act-blow" },
    { emoji: "💨", at: "-left-14 top-5", anim: "animate-act-blow", delay: 0.2, flip: true },
    { emoji: "💨", at: "-right-14 top-9", anim: "animate-act-blow", delay: 0.5 },
    { emoji: "💨", at: "-left-14 top-1", anim: "animate-act-blow", delay: 0.7, flip: true },
    { emoji: "✨", at: "-top-4 left-1/2", anim: "animate-act-rise", delay: 1 },
  ],
  solar: [
    { emoji: "🧽", at: "-right-12 top-2", anim: "animate-act-wipe" },
    { emoji: "⚡", at: "-left-10 top-0", anim: "animate-act-rise", delay: 0.4 },
    { emoji: "⚡", at: "-right-8 -top-2", anim: "animate-act-rise", delay: 1 },
    { emoji: "✨", at: "-left-6 -top-4", anim: "animate-act-rise", delay: 1.4 },
  ],
  greenhouse: [
    { emoji: "💦", at: "-left-14 -top-1", anim: "animate-act-fall" },
    { emoji: "💦", at: "-right-14 -top-1", anim: "animate-act-fall", delay: 0.3 },
    { emoji: "🌱", at: "-left-16 bottom-0", anim: "animate-act-grow", delay: 0.4, size: "text-3xl sm:text-4xl" },
    { emoji: "🥬", at: "-right-16 bottom-0", anim: "animate-act-grow", delay: 0.7, size: "text-3xl sm:text-4xl" },
    { emoji: "🍅", at: "-left-24 bottom-1", anim: "animate-act-grow", delay: 1 },
    { emoji: "🫧", at: "-right-10 top-0", anim: "animate-act-rise", delay: 1.1 },
  ],
  recycler: [
    { emoji: "🫙", at: "-right-16 bottom-0", anim: "animate-act-grow", size: "text-3xl sm:text-4xl" },
    { emoji: "💧", at: "-right-14 -top-2", anim: "animate-act-fall", delay: 0.3 },
    { emoji: "💧", at: "-right-14 -top-2", anim: "animate-act-fall", delay: 0.8 },
    { emoji: "💧", at: "-right-14 -top-2", anim: "animate-act-fall", delay: 1.3 },
    { emoji: "✨", at: "-left-10 top-0", anim: "animate-act-rise", delay: 1.5 },
  ],
  habitat: [
    { emoji: "🫧", at: "-left-10 top-4", anim: "animate-act-rise" },
    { emoji: "🫧", at: "-right-10 top-2", anim: "animate-act-rise", delay: 0.4 },
    { emoji: "🫧", at: "-left-6 -top-2", anim: "animate-act-rise", delay: 0.8 },
    { emoji: "🍵", at: "-right-14 bottom-1", anim: "animate-act-grow", delay: 0.2 },
  ],
};

const SHELTER_PROPS: Prop[] = [
  { emoji: "👩‍🚀", at: "-left-16 bottom-0", anim: "animate-act-grow", size: "text-5xl sm:text-6xl" },
  { emoji: "🧑‍🚀", at: "-right-16 bottom-0", anim: "animate-act-grow", delay: 0.2, size: "text-5xl sm:text-6xl" },
  { emoji: "🛡️", at: "-top-10 left-1/2 -translate-x-1/2", anim: "animate-act-grow", delay: 0.5, size: "text-4xl" },
];

interface Props {
  id: BuildingId;
  action: SceneAction | null;
  storm: boolean;
  /** Cooldown (seconds) of the room the door leads to. */
  cooldown: number;
  onGo: (id: BuildingId) => void;
}

// Rooms connected by a door inside the scene.
const DOORS: Partial<Record<BuildingId, BuildingId>> = { habitat: "airlock", airlock: "habitat" };

export function BuildingScene({ id, action, storm, cooldown, onGo }: Props) {
  const door = DOORS[id];
  const info = BUILDING_BY_ID[id];
  const active = action && action.id === id ? action : null;
  const props = active
    ? active.kind === "sheltered"
      ? SHELTER_PROPS
      : ACTIVITY_PROPS[id]
    : [];
  const caption = active ? (active.kind === "sheltered" ? SHELTER_ACTIVITY : info.activity) : null;

  return (
    <div className="animate-scene-in absolute inset-0 overflow-hidden" data-scene={id}>
      <img
        src={BACKDROPS[id]}
        alt={info.insideTitle}
        width={1536}
        height={640}
        className="absolute inset-0 h-full w-full object-cover object-[center_65%]"
      />
      {storm && id !== "habitat" && (
        <div className="animate-storm-flash pointer-events-none absolute inset-0" aria-hidden />
      )}

      <p className="absolute top-3 left-3 z-10 max-w-[45%] rounded-2xl bg-card/85 px-3 py-1 font-display text-xs font-semibold text-card-foreground shadow-panel sm:text-base">
        {info.emoji} {info.insideTitle}
      </p>

      {/* Astronaut and their activity */}
      <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2">
        <div className="relative">
          <span
            key={active ? `work-${active.key}` : "idle"}
            className={cn(
              "block text-6xl drop-shadow-lg sm:text-7xl",
              active ? "animate-act-work" : "animate-idle",
            )}
            role="img"
            aria-label="Your astronaut"
          >
            👨‍🚀
          </span>
          {active &&
            props.map((p, i) => (
              <span
                key={`${active.key}-${i}`}
                className={cn("pointer-events-none absolute", p.at, p.flip && "-scale-x-100")}
                aria-hidden
              >
                <span
                  className={cn("block", p.size ?? "text-2xl sm:text-3xl", p.anim)}
                  style={{ animationDelay: `${p.delay ?? 0}s` }}
                >
                  {p.emoji}
                </span>
              </span>
            ))}
        </div>
      </div>

      {door && (
        <button
          type="button"
          onClick={() => onGo(door)}
          className={cn(
            "arcade absolute bottom-4 left-3 z-10 rounded-2xl px-3 py-2 font-display text-sm font-semibold sm:text-lg",
            BUILDING_BY_ID[door].tone,
            cooldown > 0 && "opacity-75",
          )}
          aria-label={`${door === "airlock" ? "Go to the" : "Back to the"} ${BUILDING_BY_ID[door].name}: ${BUILDING_BY_ID[door].effect}`}
        >
          {BUILDING_BY_ID[door].emoji} {door === "airlock" ? "Go to Airlock" : "Back to Habitat"}
        </button>
      )}

      {caption && (
        <p
          key={`caption-${active!.key}`}
          className="animate-pop-in absolute top-3 right-3 z-10 max-w-[50%] rounded-2xl bg-popover px-3 py-1.5 text-right font-display text-xs font-semibold text-popover-foreground shadow-panel sm:text-base"
        >
          {caption}
        </p>
      )}
    </div>
  );
}
