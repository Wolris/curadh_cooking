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

  await page.getByLabel("Observation or change").fill(
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
  await expect(page.getByText(/commercial prepared product/)).toBeVisible();

  await page.getByLabel("Celery include").uncheck();

  await page.getByRole("button", { name: "Start Cook Run" }).click();
  await expect(page.getByText("Cook Mode")).toBeVisible();
  await expect(page.getByText(/^Prep 1 of/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Peel the carrots, then chop them into large pieces with a knife/ })
  ).toBeVisible();

  await page.getByRole("button", { name: "View Recipe" }).click();
  await expect(page.getByText("Cook Run is still active")).toBeVisible();
  await expect(page.getByRole("button", { name: "Return to Cooking Run" })).toBeVisible();
  await expect(page.getByText("2 tsp", { exact: true })).toBeVisible();
  await expect(page.getByText("Celery", { exact: true })).toHaveCount(0);

  await page.getByRole("button", { name: "Return to Cooking Run" }).click();
  await expect(page.getByText("Cook Mode")).toBeVisible();
});
