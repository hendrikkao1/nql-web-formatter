import { test, expect, type Page } from "@playwright/test";
import { queries } from "./queries/queries";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:5173");
});

test.describe("Editor formatting and highlighting", () => {
  queries.forEach((query) => {
    test("should format and highlight the query", async ({ page }) => {
      const editor = page.getByRole("code");
      const formatButton = page.getByTitle(/Format document/);
      const singleLineQuery = query.content.replaceAll("\n", " ");

      await editor.click();
      await page.keyboard.type(singleLineQuery);
      await formatButton.click();

      await expect(page.getByTestId("editor")).toHaveScreenshot(
        query.file.replace(".nql", ".png")
      );
    });
  });
});
