import { createFileRoute } from "@tanstack/react-router";

import { MoonBaseGame } from "@/components/game/MoonBaseGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Next Generation Astronauts – Moon Base Survival Game" },
      {
        name: "description",
        content:
          "A friendly space game for kids 7–12: run a Moon base for 30 days, survive solar storms and learn real NASA science.",
      },
      { property: "og:title", content: "Project Next Generation Astronauts" },
      {
        property: "og:description",
        content: "Run a Moon base for 30 days, survive solar storms and learn real NASA science.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MoonBaseGame,
});
