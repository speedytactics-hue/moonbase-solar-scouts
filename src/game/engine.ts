// Pure game rules for the Moon base survival game. No React, no DOM.

export const RESOURCE_KEYS = ["power", "oxygen", "water", "food", "safety"] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

export const BUILDING_IDS = ["airlock", "solar", "greenhouse", "recycler", "habitat"] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];

export type Resources = Record<ResourceKey, number>;

// ---- Tuning ---------------------------------------------------------------
export const TOTAL_DAYS = 30;
export const DAY_SECONDS = 8;
export const MISSION_SECONDS = TOTAL_DAYS * DAY_SECONDS;
export const START_LEVEL = 75;
export const MAX_LEVEL = 100;

export const DRAIN_PER_SECOND: Resources = {
  power: 0.8,
  oxygen: 0.9,
  water: 0.7,
  food: 0.6,
  safety: 0.4,
};

export const BUILDING_EFFECTS: Record<BuildingId, Partial<Resources>> = {
  airlock: { safety: 12, power: -3 },
  solar: { power: 22, safety: -5 },
  greenhouse: { food: 15, oxygen: 10, power: -8 },
  recycler: { water: 18, power: -6 },
  habitat: { oxygen: 18 },
};

export const BUILDING_COOLDOWN = 2;
export const STORM_DURATION = 12;
export const STORM_SAFETY_DRAIN = 4;
export const STORM_SHELTER_BONUS = 30;
export const FIRST_STORM_AT = 45;
export const STORM_INTERVAL_MIN = 55;
export const STORM_INTERVAL_MAX = 75;

// ---- State ----------------------------------------------------------------
export type Phase = "playing" | "won" | "lost";

export interface GameState {
  phase: Phase;
  elapsed: number;
  resources: Resources;
  cooldowns: Record<BuildingId, number>;
  storm: { active: boolean; timeLeft: number };
  nextStormIn: number;
  stormsSurvived: number;
  failedResource: ResourceKey | null;
}

export type GameEvent =
  | { type: "storm-start" }
  | { type: "storm-passed" }
  | { type: "won" }
  | { type: "lost"; resource: ResourceKey };

export type ActionResult =
  | { type: "used"; building: BuildingId; changes: Partial<Resources> }
  | { type: "sheltered"; changes: Partial<Resources> }
  | { type: "cooldown"; building: BuildingId; secondsLeft: number }
  | { type: "blocked"; building: BuildingId; resource: ResourceKey }
  | { type: "ignored" };

type Rng = () => number;

const clamp = (v: number) => Math.max(0, Math.min(MAX_LEVEL, v));

const stormInterval = (rng: Rng) =>
  STORM_INTERVAL_MIN + rng() * (STORM_INTERVAL_MAX - STORM_INTERVAL_MIN);

export function createGame(): GameState {
  return {
    phase: "playing",
    elapsed: 0,
    resources: {
      power: START_LEVEL,
      oxygen: START_LEVEL,
      water: START_LEVEL,
      food: START_LEVEL,
      safety: START_LEVEL,
    },
    cooldowns: { airlock: 0, solar: 0, greenhouse: 0, recycler: 0, habitat: 0 },
    storm: { active: false, timeLeft: 0 },
    nextStormIn: FIRST_STORM_AT,
    stormsSurvived: 0,
    failedResource: null,
  };
}

export function getDay(state: GameState): number {
  return Math.min(TOTAL_DAYS, Math.floor(state.elapsed / DAY_SECONDS) + 1);
}

function findEmpty(resources: Resources): ResourceKey | null {
  let worst: ResourceKey | null = null;
  for (const key of RESOURCE_KEYS) {
    if (resources[key] <= 0 && (worst === null || resources[key] < resources[worst])) worst = key;
  }
  return worst;
}

export function tick(
  state: GameState,
  dtRaw: number,
  rng: Rng = Math.random,
): { state: GameState; events: GameEvent[] } {
  if (state.phase !== "playing") return { state, events: [] };
  const dt = Math.max(0, Math.min(dtRaw, 0.5));
  const events: GameEvent[] = [];

  const resources = { ...state.resources };
  for (const key of RESOURCE_KEYS) resources[key] -= DRAIN_PER_SECOND[key] * dt;

  let storm = { ...state.storm };
  let nextStormIn = state.nextStormIn;
  if (storm.active) {
    resources.safety -= STORM_SAFETY_DRAIN * dt;
    storm.timeLeft -= dt;
    if (storm.timeLeft <= 0) {
      storm = { active: false, timeLeft: 0 };
      nextStormIn = stormInterval(rng);
      events.push({ type: "storm-passed" });
    }
  } else {
    nextStormIn -= dt;
    if (nextStormIn <= 0) {
      storm = { active: true, timeLeft: STORM_DURATION };
      events.push({ type: "storm-start" });
    }
  }

  const cooldowns = { ...state.cooldowns };
  for (const id of BUILDING_IDS) cooldowns[id] = Math.max(0, cooldowns[id] - dt);

  const elapsed = state.elapsed + dt;
  for (const key of RESOURCE_KEYS) resources[key] = Math.min(MAX_LEVEL, resources[key]);

  let phase: Phase = "playing";
  let failedResource: ResourceKey | null = null;
  const empty = findEmpty(resources);
  if (empty) {
    phase = "lost";
    failedResource = empty;
    for (const key of RESOURCE_KEYS) resources[key] = Math.max(0, resources[key]);
    events.push({ type: "lost", resource: empty });
  } else if (elapsed >= MISSION_SECONDS) {
    phase = "won";
    events.push({ type: "won" });
  }

  return {
    state: {
      ...state,
      phase,
      elapsed: Math.min(elapsed, MISSION_SECONDS),
      resources,
      cooldowns,
      storm,
      nextStormIn,
      failedResource,
    },
    events,
  };
}

/** Player clicks a building. Costs that would empty a resource are refused. */
export function operateBuilding(
  state: GameState,
  id: BuildingId,
  rng: Rng = Math.random,
): { state: GameState; result: ActionResult } {
  if (state.phase !== "playing") return { state, result: { type: "ignored" } };

  const sheltering = id === "habitat" && state.storm.active;

  if (!sheltering && state.cooldowns[id] > 0) {
    return { state, result: { type: "cooldown", building: id, secondsLeft: state.cooldowns[id] } };
  }

  const changes: Partial<Resources> = { ...BUILDING_EFFECTS[id] };
  if (sheltering) changes.safety = (changes.safety ?? 0) + STORM_SHELTER_BONUS;

  for (const key of RESOURCE_KEYS) {
    const delta = changes[key] ?? 0;
    if (delta < 0 && state.resources[key] + delta <= 0) {
      return { state, result: { type: "blocked", building: id, resource: key } };
    }
  }

  const resources = { ...state.resources };
  for (const key of RESOURCE_KEYS) resources[key] = clamp(resources[key] + (changes[key] ?? 0));

  const next: GameState = {
    ...state,
    resources,
    cooldowns: { ...state.cooldowns, [id]: BUILDING_COOLDOWN },
  };

  if (sheltering) {
    next.storm = { active: false, timeLeft: 0 };
    next.nextStormIn = stormInterval(rng);
    next.stormsSurvived = state.stormsSurvived + 1;
    return { state: next, result: { type: "sheltered", changes } };
  }

  return { state: next, result: { type: "used", building: id, changes } };
}
