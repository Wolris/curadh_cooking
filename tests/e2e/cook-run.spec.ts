import { expect, test } from "@playwright/test";

test("Recipe 0001 can create a Cook Run, record reality, and save independent results", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "What are you trying to make?" })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Recipes and drafts" })).toBeVisible();

  await page.getByRole("button", { name: /Oatmeal Sandwich Bread/ }).click();

  await expect(
    page.getByRole("heading", { name: "Oatmeal Sandwich Bread" })
  ).toBeVisible();
  await expect(page.getByText("Loaf size")).toBeVisible();
  await expect(page.getByText("1.5 lb", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Start Cook Run" }).click();
  await expect(page.getByText("Cook Mode")).toBeVisible();

  await page.getByLabel("Change details").fill(
    "Batter is thicker than the last time, but still cohesive."
  );
  await page.getByRole("button", { name: "Record observation" }).click();

  await expect(
    page.getByText("Batter is thicker than the last time, but still cohesive.")
  ).toBeVisible();

  await page.getByRole("button", { name: "Finish Cook Run" }).click();

  await page.getByLabel("Moisture outcome").selectOption("hit");
  await page.getByLabel("Flexibility outcome").selectOption("hit");
  await page.getByLabel("Density / lightness outcome").selectOption("hit");
  await page.getByLabel("Flavor outcome").selectOption("hit");
  await page.getByLabel("Height / rise outcome").selectOption("mixed");
  await page.getByLabel("Height / rise note").fill(
    "Excellent bread; height is still the improvement target."
  );
  await page.getByLabel("Crust outcome").selectOption("hit");
  await page.getByLabel("Sandwich use outcome").selectOption("hit");

  await page.getByRole("button", { name: "Save results" }).click();

  await expect(page.getByRole("heading", { name: "Recent Cook Runs" })).toBeVisible();
  await expect(page.getByText("Height / rise: mixed").first()).toBeVisible();
  await expect(page.getByText("Flavor: hit").first()).toBeVisible();
});


test("Recipe 0002 renders the Instant Pot + Cuisinart draft", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Homemade Chicken Soup/ }).click();

  await expect(
    page.getByRole("heading", { name: "Homemade Chicken Soup" })
  ).toBeVisible();
  await expect(page.getByText("Draft recipe", { exact: true })).toBeVisible();
  await expect(page.getByText("What we know so far", { exact: true })).toBeVisible();
  await expect(
    page.getByText("What this Cook Run needs to test", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("Planned setup", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/This recipe stays Draft until the planned test is cooked/)
  ).toBeVisible();
  await expect(page.getByText("20 minutes", { exact: true })).toBeVisible();
  await expect(page.getByText(/15 minutes natural/)).toBeVisible();
  await expect(page.getByText("Carrot puree", { exact: true })).toBeVisible();
  await expect(page.getByText("165°F / 74°C", { exact: true })).toBeVisible();
  await expect(page.getByText(/POTS: soup can be a useful fluid\/sodium vehicle/)).toBeVisible();
  await expect(page.getByText(/MCAS: do not apply a universal avoid list/)).toBeVisible();

  await expect(page.getByLabel("Carrot prep method")).toHaveValue("cuisinart");
  await page.getByLabel("Carrot prep method").selectOption("knife");
  await expect(page.getByText(/Planned prep: about 5 minutes/)).toBeVisible();

  await page.getByLabel("Parsley form").selectOption("prepared");
  await expect(page.getByText("2 tsp", { exact: true })).toBeVisible();
  await expect(page.getByText(/Estimate: Unverified recipe estimate/)).toBeVisible();
  await expect(page.getByText(/Be aware of tolerance: if using a commercial prepared product/)).toBeVisible();

  await page.getByLabel("Celery include").uncheck();

  await page.getByRole("button", { name: "Start Cook Run" }).click();
  await expect(page.getByText("Cook Mode")).toBeVisible();
  await expect(page.getByText(/^Prep 1 of/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Peel the carrots, then chop them into large pieces with a knife/ })
  ).toBeVisible();

  const recipeContext = page.getByLabel("Recipe context");
  await expect(recipeContext.getByRole("heading", { name: "Prep ingredients" })).toBeVisible();
  await expect(recipeContext.getByRole("button", { name: /Carrots/ })).toHaveClass(/current/);

  await page.getByRole("button", { name: "View Recipe" }).click();
  await expect(page.getByText("Cook Run is still active")).toBeVisible();
  await expect(page.getByRole("button", { name: "Return to Cooking Run" })).toBeVisible();
  await expect(page.getByText("2 tsp", { exact: true })).toBeVisible();
  await expect(page.getByText("Celery", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Return to Cooking Run" }).click();
  await expect(page.getByText("Cook Mode")).toBeVisible();
  await expect(page.getByRole("button", { name: "Next step" })).toHaveCount(2);

  await page.getByRole("button", { name: "Setting / prep", exact: true }).click();
  await page.getByLabel("Change details").fill("I added 1 tsp Garlic Powder");
  await page.getByRole("button", { name: "Record setting / prep" }).click();

  const runNotes = page.getByLabel("Cook Run observations");
  await expect(runNotes.getByText("I added 1 tsp Garlic Powder")).toBeVisible();
  await expect(runNotes.getByText("Prep 1", { exact: true })).toBeVisible();

  await runNotes.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByLabel("Change details")).toHaveValue("I added 1 tsp Garlic Powder");
  await page.getByRole("button", { name: "Save note changes" }).click();

  await expect(runNotes.getByText("Add", { exact: true })).toBeVisible();
  await expect(runNotes.getByText("Prep 1", { exact: true })).toBeVisible();

  await runNotes.getByRole("button", { name: "Delete" }).click();
  await expect(runNotes.getByText("I added 1 tsp Garlic Powder")).toHaveCount(0);

  await page.getByRole("button", { name: "Substitute", exact: true }).click();
  await expect(page.getByLabel("Change details")).toHaveAttribute(
    "placeholder",
    /white onion.*red onion/i
  );
  await page.getByLabel("Change details").fill(
    "Used 1/2 white onion + 1/2 red onion instead of 1 yellow onion."
  );
  await page.getByRole("button", { name: "Record substitute" }).click();
  await expect(page.getByText("Substitute", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Used 1/2 white onion + 1/2 red onion instead of 1 yellow onion.")
  ).toBeVisible();

  await page.getByRole("button", { name: "Next step" }).first().click();
  await expect(page.getByText(/^Prep 2 of/)).toBeVisible();
  await expect(recipeContext.getByRole("button", { name: /Carrots/ })).toHaveClass(/completed/);
  await expect(recipeContext.getByRole("button", { name: /Yellow onion/ })).toHaveClass(/current/);

  await page.reload();
  await expect(page.getByText("Cook Mode")).toBeVisible();
  await expect(page.getByText(/^Prep 2 of/)).toBeVisible();
  await expect(
    page.getByText("Used 1/2 white onion + 1/2 red onion instead of 1 yellow onion.")
  ).toBeVisible();
  await expect(page.getByLabel("Recipe context").getByRole("button", { name: /Carrots/ }))
    .toHaveClass(/completed/);

  await page.getByRole("button", { name: "Next step" }).first().click();
  await expect(page.getByText(/^Prep 3 of/)).toBeVisible();
  await page.getByRole("button", { name: "Next step" }).first().click();
  await expect(page.getByText(/^Cook 1 of/)).toBeVisible();

  const cookContext = page.getByLabel("Recipe context");
  await expect(cookContext.getByRole("heading", { name: "Cooking steps" })).toBeVisible();
  await cookContext.getByRole("button", { name: /Step 2/ }).click();
  await expect(page.getByText(/^Cook 2 of/)).toBeVisible();
});
