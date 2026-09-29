import { expect, test } from "@playwright/test";

test("Recipe 0001 can create a Cook Run, record reality, and save independent results", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "What are you trying to make?" })
  ).toBeVisible();

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
