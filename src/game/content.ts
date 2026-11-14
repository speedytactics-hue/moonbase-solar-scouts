import type { BuildingId, ResourceKey } from "./engine";

export interface ResourceInfo {
  key: ResourceKey;
  label: string;
  emoji: string;
  tone: string; // tone-* utility from styles.css
  bar: string; // bg-* utility for the meter fill
}

export const RESOURCES: ResourceInfo[] = [
  { key: "power", label: "Power", emoji: "⚡", tone: "tone-power", bar: "bg-power" },
  { key: "oxygen", label: "Oxygen", emoji: "🫧", tone: "tone-oxygen", bar: "bg-oxygen" },
  { key: "water", label: "Water", emoji: "💧", tone: "tone-water", bar: "bg-water" },
  { key: "food", label: "Food", emoji: "🍎", tone: "tone-food", bar: "bg-food" },
  { key: "safety", label: "Safety", emoji: "🛡️", tone: "tone-safety", bar: "bg-safety" },
];

export const RESOURCE_BY_KEY = Object.fromEntries(RESOURCES.map((r) => [r.key, r])) as Record<
  ResourceKey,
  ResourceInfo
>;

export interface BuildingInfo {
  id: BuildingId;
  name: string;
  emoji: string;
  tone: string;
  effect: string;
  scienceTitle: string;
  science: string[];
}

export const BUILDINGS: BuildingInfo[] = [
  {
    id: "airlock",
    name: "Airlock",
    emoji: "🚪",
    tone: "tone-safety",
    effect: "Cleans moon dust: +12 Safety, uses 3 Power",
    scienceTitle: "Moon dust is sharp like glass!",
    science: [
      "Moon dust (scientists call it regolith) is not soft like beach sand. The Moon has no wind or water to smooth it, so every tiny grain stays sharp and jagged, like little bits of broken glass.",
      "Apollo astronauts found it stuck to everything. It scratched helmet visors and jammed suit parts. Apollo 17 astronaut Harrison Schmitt even sneezed from 'lunar hay fever' after breathing it in.",
      "That's why a Moon base needs an airlock: a small room where dust is blown and brushed off spacesuits before the crew steps inside.",
    ],
  },
  {
    id: "solar",
    name: "Solar",
    emoji: "☀️",
    tone: "tone-power",
    effect: "+22 Power, but going outside: −5 Safety",
    scienceTitle: "Power from the Sun",
    science: [
      "Solar panels turn sunlight into electricity for lights, heaters, computers and air machines.",
      "NASA's Artemis missions are heading to the Moon's south pole, where some mountain tops get sunlight almost all the time. Perfect for solar panels!",
      "But going outside is risky. The Moon has no thick air or magnetic field, so space radiation and tiny speeding space rocks (micrometeoroids) can reach the surface.",
    ],
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    emoji: "🌱",
    tone: "tone-food",
    effect: "+15 Food, +10 Oxygen, grow lights use 8 Power",
    scienceTitle: "Space gardens make food AND air",
    science: [
      "Plants are a crew's best friends. They grow food, and through photosynthesis they breathe out fresh oxygen.",
      "On the International Space Station, NASA's 'Veggie' garden grows plants under red and blue LED grow lights. In 2015, astronauts ate lettuce grown in space for the first time!",
      "Scientists have even grown small plants in real Moon soil brought back by Apollo astronauts. Grow lights need lots of electricity, so the greenhouse uses power.",
    ],
  },
  {
    id: "recycler",
    name: "Water Recycler",
    emoji: "💧",
    tone: "tone-water",
    effect: "+18 Water, uses 6 Power",
    scienceTitle: "98% of water gets recycled",
    science: [
      "Water is very heavy, so launching it from Earth is expensive. Space crews recycle every drop they can.",
      "On the International Space Station, NASA's life support system recycles about 98% of the water, including sweat, breath and even pee, and cleans it into fresh drinking water.",
      "Astronauts like to joke: 'Yesterday's coffee becomes tomorrow's coffee!'",
    ],
  },
  {
    id: "habitat",
    name: "Habitat",
    emoji: "🏠",
    tone: "tone-primary",
    effect: "+18 Oxygen. In a solar storm: hide the crew, +30 Safety",
    scienceTitle: "Home sweet Moon home",
    science: [
      "The habitat is the crew's home: a sealed building filled with air to breathe, kept at a comfy temperature.",
      "On the Space Station, oxygen is made by using electricity to split water into hydrogen and oxygen. This is called electrolysis.",
      "Its walls and supplies also help shield astronauts from space radiation, which is why it's the safest place to hide during a solar storm.",
    ],
  },
];

export const BUILDING_BY_ID = Object.fromEntries(BUILDINGS.map((b) => [b.id, b])) as Record<
  BuildingId,
  BuildingInfo
>;

export const STORM_SCIENCE = {
  emoji: "🌞",
  title: "You survived a solar storm!",
  science: [
    "Sometimes the Sun blasts out huge clouds of super-fast particles. This is called a solar storm, or a solar particle event.",
    "On Earth, our thick atmosphere and magnetic field protect us. The Moon has no such shield, so astronauts must hide in the most protected part of their base.",
    "NASA scientists watch the Sun day and night so they can warn astronauts in time to take shelter.",
  ],
};

export const FAILURE_FACTS: Record<ResourceKey, { title: string; fact: string }> = {
  power: {
    title: "The power ran out",
    fact: "A night on the Moon lasts about 14 Earth days, and it can get as cold as −173 °C (−280 °F). Without electricity, heaters, air machines and radios all stop. That's why NASA wants to build near spots that get sunlight almost all the time.",
  },
  oxygen: {
    title: "The oxygen ran out",
    fact: "The Moon has almost no air to breathe. Fun fact: Moon rocks and soil are about 40% oxygen, but it's locked inside minerals. NASA scientists are testing ways to pull oxygen out of moon soil for future crews.",
  },
  water: {
    title: "The water ran out",
    fact: "Astronauts need water every day to drink, cook and stay clean. That's why NASA is so excited about frozen water ice hiding in dark craters at the Moon's south pole, and why recycling water is so important.",
  },
  food: {
    title: "The food ran out",
    fact: "Packing food for long trips is hard: it has to last for years and still be healthy. NASA's Deep Space Food Challenge asked inventors to create new ways to grow and make food far away from Earth.",
  },
  safety: {
    title: "The crew wasn't safe",
    fact: "Space radiation, sharp dust and speeding micrometeoroids make the Moon risky. Astronauts stay safe by limiting time outside, keeping dust out with airlocks, and sheltering during solar storms.",
  },
};

export const WIN_FACT =
  "NASA's Artemis program plans to land astronauts near the Moon's south pole and learn how to live there for longer and longer. The skills you just used (power, air, water, food and safety) are exactly what real Moon crews must manage. Maybe the next astronaut will be you!";
