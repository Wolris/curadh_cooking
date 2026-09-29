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
    expect(recipes).toHaveLength(2);
    expect(recipes.map((recipe: { title: string }) => recipe.title)).toEqual(
      expect.arrayContaining(["Oatmeal Sandwich Bread", "Homemade Chicken Soup"])
    );

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


  it("loads the draft Instant Pot + Cuisinart chicken soup adaptation", async () => {
    app = buildServer({ dbPath: ":memory:" });

    const detail = await app.inject({
      method: "GET",
      url: "/api/recipes/homemade-chicken-soup"
    });
    expect(detail.statusCode).toBe(200);

    const recipe = detail.json();
    expect(recipe.status).toBe("draft");
    expect(recipe.variant.ingredients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Bone-in chicken thighs and/or drumsticks" }),
        expect.objectContaining({ name: "Carrots" }),
        expect.objectContaining({ name: "Fine salt" })
      ])
    );
    expect(recipe.variant.equipmentSettings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          equipment: "Instant Pot pressure cooker",
          settingKey: "Cook time",
          settingValue: "20 minutes"
        }),
        expect.objectContaining({
          equipment: "Cuisinart blender / food processor",
          settingKey: "Carrot puree"
        }),
        expect.objectContaining({
          equipment: "Instant-read food thermometer",
          settingValue: "165°F / 74°C"
        })
      ])
    );
    expect(recipe.resultMarkers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Broth flavor" }),
        expect.objectContaining({ label: "Carrot body / texture" }),
        expect.objectContaining({ label: "Salt balance" })
      ])
    );
    expect(recipe.variant.configuration.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "parsley.form", kind: "select" }),
        expect.objectContaining({ key: "carrots.peel", kind: "toggle" }),
        expect.objectContaining({ key: "carrots.prep", kind: "select" })
      ])
    );
  });

  it("freezes configured soup choices into a prep-first Cook Run snapshot", async () => {
    app = buildServer({ dbPath: ":memory:" });

    const detail = await app.inject({
      method: "GET",
      url: "/api/recipes/homemade-chicken-soup"
    });
    const recipe = detail.json();

    const started = await app.inject({
      method: "POST",
      url: "/api/cook-runs",
      payload: {
        recipeId: recipe.id,
        variantId: recipe.variant.id,
        selections: {
          "yellow-onion.include": false,
          "celery.include": false,
          "parsley.include": true,
          "parsley.form": "prepared",
          "carrots.peel": false,
          "carrots.prep": "knife"
        }
      }
    });

    expect(started.statusCode).toBe(201);
    const run = started.json();
    expect(run.snapshot.estimatedPrepMinutes).toBe(5);
    expect(run.snapshot.selections["yellow-onion.include"]).toBe(false);
    expect(run.snapshot.configuredIngredients).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "yellow-onion" })])
    );
    expect(run.snapshot.configuredIngredients).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "celery" })])
    );
    expect(run.snapshot.configuredIngredients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "parsley",
          quantity: "2 tsp",
          form: "prepared or pre-chopped"
        })
      ])
    );
    expect(run.snapshot.steps[0]).toEqual(
      expect.objectContaining({
        stage: "prep",
        instruction: expect.stringContaining("Scrub the carrots")
      })
    );

    const firstCookStep = run.snapshot.steps.find(
      (step: { key: string }) => step.key === "cook-1"
    );
    expect(firstCookStep.instruction).not.toContain("onion");
    expect(firstCookStep.instruction).not.toContain("celery");
    expect(firstCookStep.instruction).toContain("parsley");

    const fetched = await app.inject({
      method: "GET",
      url: `/api/cook-runs/${run.id}`
    });
    expect(fetched.statusCode).toBe(200);
    expect(fetched.json().snapshot).toEqual(run.snapshot);

    const firstStepKey = run.snapshot.steps[0].key;
    const secondStepKey = run.snapshot.steps[1].key;
    const progressed = await app.inject({
      method: "PATCH",
      url: `/api/cook-runs/${run.id}`,
      payload: {
        currentStepKey: secondStepKey,
        completedStepKeys: [firstStepKey]
      }
    });
    expect(progressed.statusCode).toBe(200);

    const recovered = await app.inject({
      method: "GET",
      url: `/api/cook-runs/${run.id}`
    });
    expect(recovered.json()).toEqual(
      expect.objectContaining({
        currentStepKey: secondStepKey,
        completedStepKeys: [firstStepKey]
      })
    );

    const latestActive = await app.inject({
      method: "GET",
      url: "/api/cook-runs/active/latest"
    });
    expect(latestActive.statusCode).toBe(200);
    expect(latestActive.json()).toEqual(
      expect.objectContaining({
        id: run.id,
        recipeSlug: "homemade-chicken-soup",
        currentStepKey: secondStepKey
      })
    );
  });

  it("persists newly structured ingredient-add Cook Run events", async () => {
    app = buildServer({ dbPath: ":memory:" });

    const detailResponse = await app.inject({
      method: "GET",
      url: "/api/recipes/homemade-chicken-soup"
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
        runStepKey: run.currentStepKey,
        eventType: "ingredient-add",
        text: "Added 1 tsp garlic powder.",
        structuredData: {
          action: "ingredient-add",
          runStepKey: run.currentStepKey
        }
      }
    });
    expect(event.statusCode).toBe(201);

    const runDetail = await app.inject({
      method: "GET",
      url: `/api/cook-runs/${run.id}`
    });
    expect(runDetail.statusCode).toBe(200);
    expect(runDetail.json().events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventType: "ingredient-add",
          text: "Added 1 tsp garlic powder."
        })
      ])
    );
  });

  it("rejects a Cook Run note that is not tied to a step in that run", async () => {
    app = buildServer({ dbPath: ":memory:" });

    const detailResponse = await app.inject({
      method: "GET",
      url: "/api/recipes/homemade-chicken-soup"
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
    const run = started.json();

    const event = await app.inject({
      method: "POST",
      url: `/api/cook-runs/${run.id}/events`,
      payload: {
        runStepKey: "prep-not-in-this-run",
        eventType: "observation",
        text: "This should not save."
      }
    });

    expect(event.statusCode).toBe(400);
    expect(event.json().error).toContain("does not belong");
  });

  it("edits type/text in place and deletes a step-bound Cook Run note", async () => {
    app = buildServer({ dbPath: ":memory:" });

    const detailResponse = await app.inject({
      method: "GET",
      url: "/api/recipes/homemade-chicken-soup"
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
    const run = started.json();

    const created = await app.inject({
      method: "POST",
      url: `/api/cook-runs/${run.id}/events`,
      payload: {
        runStepKey: run.currentStepKey,
        eventType: "setting-change",
        text: "I added 1 tsp Garlic Powder",
        structuredData: {
          action: "setting-change",
          runStepKey: run.currentStepKey
        }
      }
    });
    expect(created.statusCode).toBe(201);
    const eventId = created.json().id;

    const updated = await app.inject({
      method: "PATCH",
      url: `/api/cook-runs/${run.id}/events/${eventId}`,
      payload: {
        eventType: "ingredient-add",
        text: "I added 1 tsp Garlic Powder",
        runStepKey: run.currentStepKey
      }
    });
    expect(updated.statusCode).toBe(200);

    const afterUpdate = await app.inject({
      method: "GET",
      url: `/api/cook-runs/${run.id}`
    });
    expect(afterUpdate.json().events).toEqual([
      expect.objectContaining({
        id: eventId,
        eventType: "ingredient-add",
        runStepKey: run.currentStepKey,
        text: "I added 1 tsp Garlic Powder"
      })
    ]);

    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/cook-runs/${run.id}/events/${eventId}`
    });
    expect(deleted.statusCode).toBe(200);

    const afterDelete = await app.inject({
      method: "GET",
      url: `/api/cook-runs/${run.id}`
    });
    expect(afterDelete.json().events).toHaveLength(0);
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
        runStepKey: recipe.variant.steps[0].id,
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
