import { afterEach, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildServer } from "./app.js";

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe("Recipe 0001 Cook Run vertical slice", () => {
  it("lists and loads the canonical recipe", async () => {
    app = buildServer({ dbPath: ":memory:" });

    const list = await app.inject({ method: "GET", url: "/api/recipes" });
    expect(list.statusCode).toBe(200);
    const recipes = list.json();
    expect(recipes).toHaveLength(1);
    expect(recipes[0].title).toBe("Oatmeal Sandwich Bread");

    const detail = await app.inject({
      method: "GET",
      url: "/api/recipes/oatmeal-sandwich-bread"
    });
    expect(detail.statusCode).toBe(200);
    const recipe = detail.json();
    expect(recipe.variant.equipmentSettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ settingKey: "Program", settingValue: "White" }),
        expect.objectContaining({ settingKey: "Crust", settingValue: "Light" }),
        expect.objectContaining({ settingKey: "Loaf size", settingValue: "1.5 lb" })
      ])
    );
    expect(recipe.resultMarkers.length).toBeGreaterThan(1);
  });

  it("persists a Cook Run event and independent result markers", async () => {
    app = buildServer({ dbPath: ":memory:" });

    const detailResponse = await app.inject({
      method: "GET",
      url: "/api/recipes/oatmeal-sandwich-bread"
    });
    const recipe = detailResponse.json();

    const started = await app.inject({
      method: "POST",
      url: "/api/cook-runs",
      payload: {
        recipeId: recipe.id,
        variantId: recipe.variant.id
      }
    });
    expect(started.statusCode).toBe(201);
    const run = started.json();

    const event = await app.inject({
      method: "POST",
      url: `/api/cook-runs/${run.id}/events`,
      payload: {
        stepId: recipe.variant.steps[0].id,
        eventType: "observation",
        text: "Batter is thicker than the previous run."
      }
    });
    expect(event.statusCode).toBe(201);

    const results = recipe.resultMarkers.map((marker: { id: string; markerKey: string }) => ({
      resultMarkerId: marker.id,
      outcome: marker.markerKey === "height-rise" ? "mixed" : "hit",
      note: marker.markerKey === "height-rise" ? "Delicious loaf, but shorter than desired." : ""
    }));

    const completed = await app.inject({
      method: "POST",
      url: `/api/cook-runs/${run.id}/complete`,
      payload: { results }
    });
    expect(completed.statusCode).toBe(200);

    const runDetail = await app.inject({
      method: "GET",
      url: `/api/cook-runs/${run.id}`
    });
    expect(runDetail.statusCode).toBe(200);
    expect(runDetail.json().events[0].text).toContain("thicker");

    const refreshed = await app.inject({
      method: "GET",
      url: "/api/recipes/oatmeal-sandwich-bread"
    });
    const history = refreshed.json().runs;
    expect(history[0].status).toBe("completed");
    expect(history[0].results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Height / rise", outcome: "mixed" }),
        expect.objectContaining({ label: "Flavor", outcome: "hit" })
      ])
    );
  });
});
