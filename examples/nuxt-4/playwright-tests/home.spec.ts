import { test, expect } from "@playwright/test";
import { createClient, Client } from "@mocky-balboa/playwright";

const trainingRegimeEndpoint = "https://mickeylovesyou.com/training-regime";

let client: Client;
test.beforeEach(async ({ context }) => {
  client = await createClient(context);
});

test("when there's a network error loading the next fight data", async ({
  page,
}) => {
  client.route(trainingRegimeEndpoint, (route) => {
    return route.fulfill({
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "hello world" }),
    });
  });

  await page.goto("http://localhost:3000");
  await expect(page.getByText("hello world")).toBeVisible();
});
