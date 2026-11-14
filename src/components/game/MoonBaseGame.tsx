import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import rocket from "@/assets/rocket.png";
import { Button } from "@/components/ui/button";
import { MoonBase, type Pop } from "./MoonBase";
import type { SceneAction } from "./BuildingScene";
import { ResourceHud } from "./ResourceHud";
import { SciencePopup } from "./SciencePopup";
import {
  TOTAL_DAYS,
  createGame,
  getDay,
  operateBuilding,
  tick,
  type BuildingId,
  type GameEvent,
  type GameState,
  type Resources,
} from "@/game/engine";
import {
  MAIN_BUILDINGS,
  BUILDING_BY_ID,
  FAILURE_FACTS,
  RESOURCE_BY_KEY,
  STORM_SCIENCE,
  WIN_FACT,
} from "@/game/content";
import { sfx } from "@/game/audio";
import { cn } from "@/lib/utils";

type Screen = "start" | "launching" | "playing" | "won" | "lost";
type Popup = { kind: "building"; id: BuildingId } | { kind: "storm" };

const HABITAT_INDEX = MAIN_BUILDINGS.findIndex((b) => b.id === "habitat");
const TICK_MS = 100;

function describeChanges(changes: Partial<Resources>) {
  return Object.entries(changes)
    .filter(([, v]) => v)
    .map(([k, v]) => `${v! > 0 ? "+" : "−"}${Math.abs(v!)} ${RESOURCE_BY_KEY[k as keyof Resources].emoji}`)
    .join("  ");
}

export function MoonBaseGame() {
  const [screen, setScreen] = useState<Screen>("start");
  const [game, setGame] = useState<GameState>(() => createGame());
  const gameRef = useRef(game);
  const [astronautAt, setAstronautAt] = useState(HABITAT_INDEX);
  const [facing, setFacing] = useState<1 | -1>(1);
  const [walking, setWalking] = useState(false);
  const [inside, setInside] = useState<BuildingId | null>("habitat");
  const [action, setAction] = useState<SceneAction | null>(null);
  const actionId = useRef(0);
  const [popup, setPopup] = useState<Popup | null>(null);
  const seenRef = useRef(new Set<string>());
  const [pops, setPops] = useState<Pop[]>([]);
  const popId = useRef(0);
  const [log, setLog] = useState("Tap a building to send your astronaut to work!");
  const [muted, setMuted] = useState(false);

  const paused = screen !== "playing" || popup !== null;

  const commit = useCallback((next: GameState) => {
    gameRef.current = next;
    setGame(next);
  }, []);

  const addPop = useCallback((index: number, text: string) => {
    const id = ++popId.current;
    setPops((p) => [...p, { id, index, text }]);
    window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 1300);
  }, []);

  const handleEvents = useCallback((events: GameEvent[]) => {
    for (const e of events) {
      if (e.type === "storm-start") {
        sfx.storm();
        setLog("🚨 Solar storm! Get everyone into the Habitat, fast!");
      } else if (e.type === "storm-passed") {
        setLog("The storm passed… next time, hide in the Habitat 🏠 to stay safe!");
      } else if (e.type === "lost") {
        sfx.lose();
        setScreen("lost");
      } else if (e.type === "won") {
        sfx.win();
        setScreen("won");
      }
    }
  }, []);

  // Game clock
  useEffect(() => {
    if (paused) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      if (document.hidden) return;
      const { state, events } = tick(gameRef.current, dt);
      commit(state);
      handleEvents(events);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [paused, commit, handleEvents]);

  useEffect(() => {
    if (!walking) return;
    // When the walk finishes, the astronaut steps inside the building.
    const t = window.setTimeout(() => {
      setWalking(false);
      setInside(MAIN_BUILDINGS[astronautAt]?.id ?? null);
    }, 700);
    return () => window.clearTimeout(t);
  }, [walking, astronautAt]);

  const toggleMute = () => {
    setMuted((m) => {
      sfx.setMuted(!m);
      return !m;
    });
  };

  const launch = () => {
    sfx.launch();
    setScreen("launching");
    window.setTimeout(() => {
      commit(createGame());
      setAstronautAt(HABITAT_INDEX);
      setInside("habitat");
      setAction(null);
      setPops([]);
      setPopup(null);
      setLog("Welcome to the Moon! Tap a building to send your astronaut to work.");
      setScreen("playing");
    }, 1800);
  };

  const onBuilding = (id: BuildingId, index: number) => {
    if (paused) return;
    if (index !== astronautAt) {
      setFacing(index > astronautAt ? 1 : -1);
      setInside(null); // step outside and walk over
      setAstronautAt(index);
      setWalking(true);
    } else {
      setInside(id); // e.g. stepping between the Habitat and its Airlock
    }

    const { state, result } = operateBuilding(gameRef.current, id);
    const info = BUILDING_BY_ID[id];

    switch (result.type) {
      case "used":
        sfx.gain();
        commit(state);
        setAction({ key: ++actionId.current, id, kind: "used" });
        addPop(index, describeChanges(result.changes));
        setLog(`${info.emoji} ${info.name}: ${info.effect}`);
        if (!seenRef.current.has(id)) {
          seenRef.current.add(id);
          setPopup({ kind: "building", id });
        }
        break;
      case "sheltered":
        sfx.shelter();
        commit(state);
        setAction({ key: ++actionId.current, id, kind: "sheltered" });
        addPop(index, describeChanges(result.changes));
        setLog("🏠 Crew is safe inside the Habitat! The storm is over.");
        if (!seenRef.current.has("storm")) {
          seenRef.current.add("storm");
          setPopup({ kind: "storm" });
        }
        break;
      case "cooldown":
        sfx.tap();
        setLog(`${info.emoji} The ${info.name} is recharging… try another building!`);
        break;
      case "blocked": {
        sfx.blocked();
        const r = RESOURCE_BY_KEY[result.resource];
        setLog(
          `Not enough ${r.label} ${r.emoji} for the ${info.name}!` +
            (result.resource === "power" ? " Visit Solar ☀️ first." : ""),
        );
        break;
      }
      default:
        break;
    }
  };

  const onInfo = (id: BuildingId) => {
    if (screen !== "playing") return;
    sfx.tap();
    seenRef.current.add(id);
    setPopup({ kind: "building", id });
  };

  const day = getDay(game);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-sm font-semibold tracking-wide text-muted-foreground sm:text-base">
          🧑‍🚀 Project Next Generation Astronauts
        </p>
        <Button
          variant="arcade"
          size="round"
          className="tone-secondary"
          onClick={toggleMute}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
        >
          {muted ? <VolumeX /> : <Volume2 />}
        </Button>
      </div>

      {(screen === "start" || screen === "launching") && (
        <StartScreen launching={screen === "launching"} onLaunch={launch} />
      )}

      {screen === "playing" && (
        <>
          <ResourceHud game={game} />
          <MoonBase
            game={game}
            astronautAt={astronautAt}
            facing={facing}
            walking={walking}
            pops={pops}
            inside={inside}
            action={action}
            onBuilding={onBuilding}
            onInfo={onInfo}
          />
          <p
            className="panel px-4 py-3 text-center text-sm font-bold sm:text-base"
            aria-live="polite"
          >
            {log}
          </p>
          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            Keep all 5 bars above zero for {TOTAL_DAYS} days. Tap <b>?</b> on any building to learn
            the science.
          </p>
        </>
      )}

      {screen === "won" && (
        <EndScreen
          emoji="🏆"
          title="Mission complete!"
          subtitle={`You kept your crew alive for all ${TOTAL_DAYS} days and survived ${game.stormsSurvived} solar storm${game.stormsSurvived === 1 ? "" : "s"}.`}
          factTitle="🔭 Real NASA science"
          fact={WIN_FACT}
          onRestart={launch}
        />
      )}

      {screen === "lost" && game.failedResource && (
        <EndScreen
          emoji={RESOURCE_BY_KEY[game.failedResource].emoji}
          title={`Game over: ${FAILURE_FACTS[game.failedResource].title}`}
          subtitle={`Your crew made it to day ${day} of ${TOTAL_DAYS}.`}
          factTitle="🔭 Why this matters, says NASA"
          fact={FAILURE_FACTS[game.failedResource].fact}
          onRestart={launch}
        />
      )}

      {/* Storm flash */}
      {screen === "playing" && game.storm.active && !popup && (
        <div className="animate-storm-flash pointer-events-none fixed inset-0 z-40" aria-hidden />
      )}

      {popup?.kind === "building" && (
        <SciencePopup
          emoji={BUILDING_BY_ID[popup.id].emoji}
          subtitle={BUILDING_BY_ID[popup.id].name}
          title={BUILDING_BY_ID[popup.id].scienceTitle}
          effect={BUILDING_BY_ID[popup.id].effect}
          paragraphs={BUILDING_BY_ID[popup.id].science}
          onClose={() => setPopup(null)}
        />
      )}
      {popup?.kind === "storm" && (
        <SciencePopup
          emoji={STORM_SCIENCE.emoji}
          subtitle="Solar storm"
          title={STORM_SCIENCE.title}
          paragraphs={STORM_SCIENCE.science}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}

function StartScreen({ launching, onLaunch }: { launching: boolean; onLaunch: () => void }) {
  return (
    <main className="panel relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-6 py-10 text-center">
      <div className="starfield absolute inset-0 opacity-70" aria-hidden />
      <img
        src={rocket}
        alt="A friendly rocket with a waving astronaut"
        width={768}
        height={1024}
        className={cn(
          "relative z-10 h-56 w-auto drop-shadow-2xl sm:h-72",
          launching ? "animate-launch" : "animate-float",
        )}
      />
      <div className="relative z-10 max-w-xl space-y-3">
        <p className="font-display text-sm font-semibold tracking-[0.3em] text-accent uppercase">
          Project Next Generation Astronauts
        </p>
        <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">
          You are selected to fly to the Moon to study it!
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Run your Moon base for 30 days. Keep Power ⚡, Oxygen 🫧, Water 💧, Food 🍎 and Safety 🛡️
          from running out, and hide in the Habitat 🏠 when a solar storm hits!
        </p>
      </div>
      <Button
        variant="arcade"
        size="xl"
        className="tone-primary relative z-10"
        onClick={onLaunch}
        disabled={launching}
      >
        🚀 Launch Rocket
      </Button>
      {launching && (
        <p className="relative z-10 font-display text-xl font-semibold text-power" aria-live="polite">
          3… 2… 1… Liftoff!
        </p>
      )}
    </main>
  );
}

function EndScreen({
  emoji,
  title,
  subtitle,
  factTitle,
  fact,
  onRestart,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  factTitle: string;
  fact: string;
  onRestart: () => void;
}) {
  return (
    <main className="panel animate-pop-in flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <span className="animate-float text-8xl" aria-hidden>
        {emoji}
      </span>
      <div className="max-w-xl space-y-2">
        <h1 className="text-4xl leading-tight font-semibold sm:text-5xl">{title}</h1>
        <p className="text-lg text-muted-foreground">{subtitle}</p>
      </div>
      <div className="moon-card max-w-xl p-6 text-left">
        <p className="mb-2 text-xs font-extrabold tracking-widest uppercase opacity-70">{factTitle}</p>
        <p className="text-base leading-relaxed sm:text-lg">{fact}</p>
      </div>
      <Button variant="arcade" size="xl" className="tone-primary" onClick={onRestart}>
        🚀 Fly again
      </Button>
    </main>
  );
}
