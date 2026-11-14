import { describe, expect, it } from "vitest";
import {
  BUILDING_COOLDOWN,
  DAY_SECONDS,
  MISSION_SECONDS,
  TOTAL_DAYS,
  createGame,
  getDay,
  operateBuilding,
  tick,
  type GameState,
} from "./engine";

const fixedRng = () => 0.5;

function refill(s: GameState): GameState {
  return { ...s, resources: { power: 100, oxygen: 100, water: 100, food: 100, safety: 100 } };
}

describe("Moon base rules", () => {
  it("the mission lasts 30 days and is won when time runs out", () => {
    let s = createGame();
    expect(getDay(s)).toBe(1);
    expect(TOTAL_DAYS).toBe(30);
    while (s.phase === "playing") {
      s = refill(s);
      s = { ...s, storm: { active: false, timeLeft: 0 }, nextStormIn: 999 };
      s = tick(s, 0.5, fixedRng).state;
    }
    expect(s.phase).toBe("won");
    expect(s.elapsed).toBe(MISSION_SECONDS);
    expect(getDay(s)).toBe(30);
  });

  it("days advance as time passes", () => {
    const s = { ...createGame(), elapsed: DAY_SECONDS * 4 + 1 };
    expect(getDay(s)).toBe(5);
  });

  it("resources slowly drain over time", () => {
    const s = tick(createGame(), 0.5, fixedRng).state;
    for (const v of Object.values(s.resources)) expect(v).toBeLessThan(75);
  });

  it("any resource hitting 0 ends the game", () => {
    const s = { ...createGame(), resources: { ...createGame().resources, water: 0.1 } };
    const { state, events } = tick(s, 0.5, fixedRng);
    expect(state.phase).toBe("lost");
    expect(state.failedResource).toBe("water");
    expect(events).toContainEqual({ type: "lost", resource: "water" });
  });

  it("solar adds power but lowers safety", () => {
    const s = createGame();
    const next = operateBuilding(s, "solar", fixedRng).state;
    expect(next.resources.power).toBeGreaterThan(s.resources.power);
    expect(next.resources.safety).toBeLessThan(s.resources.safety);
  });

  it("greenhouse adds food and oxygen but costs power", () => {
    const s = createGame();
    const next = operateBuilding(s, "greenhouse", fixedRng).state;
    expect(next.resources.food).toBeGreaterThan(s.resources.food);
    expect(next.resources.oxygen).toBeGreaterThan(s.resources.oxygen);
    expect(next.resources.power).toBeLessThan(s.resources.power);
  });

  it("water recycler adds water but costs power", () => {
    const s = createGame();
    const next = operateBuilding(s, "recycler", fixedRng).state;
    expect(next.resources.water).toBeGreaterThan(s.resources.water);
    expect(next.resources.power).toBeLessThan(s.resources.power);
  });

  it("habitat restores oxygen", () => {
    const s = createGame();
    const next = operateBuilding(s, "habitat", fixedRng).state;
    expect(next.resources.oxygen).toBeGreaterThan(s.resources.oxygen);
  });

  it("a solar storm starts on schedule and hiding in the habitat ends it and restores safety", () => {
    let s = { ...createGame(), nextStormIn: 0.1 };
    const t = tick(s, 0.2, fixedRng);
    expect(t.events).toContainEqual({ type: "storm-start" });
    s = t.state;
    expect(s.storm.active).toBe(true);
    const { state, result } = operateBuilding(s, "habitat", fixedRng);
    expect(result.type).toBe("sheltered");
    expect(state.storm.active).toBe(false);
    expect(state.resources.safety).toBeGreaterThan(s.resources.safety);
    expect(state.stormsSurvived).toBe(1);
  });

  it("buildings need a short recharge between uses", () => {
    const s = operateBuilding(createGame(), "solar", fixedRng).state;
    expect(s.cooldowns.solar).toBe(BUILDING_COOLDOWN);
    expect(operateBuilding(s, "solar", fixedRng).result.type).toBe("cooldown");
  });

  it("refuses actions that would drain power to zero", () => {
    const s = { ...createGame(), resources: { ...createGame().resources, power: 5 } };
    const { state, result } = operateBuilding(s, "greenhouse", fixedRng);
    expect(result).toEqual({ type: "blocked", building: "greenhouse", resource: "power" });
    expect(state).toBe(s);
  });
});
