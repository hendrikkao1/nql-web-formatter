import { test, expect, type Page } from "@playwright/test";
import { queries } from "./queries/queries";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
});

test.afterEach(async ({ page }) => {
  // Monaco editor is not properly cleaned up between tests, so we need to reload the page
  await page.reload();
});

test.describe("Editor formatting and highlighting", () => {
  queries.forEach((query) => {
    test(`should format and highlight the query: ${query.file}`, async ({
      page,
    }) => {
      // Wait for all the resources to be loaded
      await page.waitForLoadState("networkidle");

      const editor = page.getByRole("code");
      const formatButton = page.getByTitle(/Format document/);
      const singleLineQuery = query.content.replaceAll("\n", " ");

      await editor.click();
      await page.keyboard.type(singleLineQuery);
      await formatButton.click();

      // Wait for the editor to be update, all the following is done async off the main thread:
      // * Apply formatting
      // * Apply semantic highlighting
      // * Apply diagnostics (errors)
      await page.waitForTimeout(3000);

      await expect(page.getByTestId("editor")).toHaveScreenshot(
        query.file.replace(".nql", ".png")
      );
    });
  });
});
