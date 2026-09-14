import { mkdir, rename, rm } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = process.env.TIMELENS_URL ?? "http://127.0.0.1:3000";
const outputDirectory = "docs";
const recordingDirectory = "docs/.recording";
const outputPath = "docs/demo.webm";

function todayAt(hour, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  const datePart = [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
  return `${datePart}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

async function recordDemo() {
  await mkdir(outputDirectory, { recursive: true });
  await mkdir(recordingDirectory, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: { dir: recordingDirectory, size: { width: 1440, height: 1000 } },
  });
  const page = await context.newPage();
  const video = page.video();

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(1_000);

    await page.getByPlaceholder("e.g. Write results section").fill("Technical Report: Literature Review");
    await page.locator('input[type="number"]').first().fill("60");
    await page.locator('input[type="datetime-local"]').fill(todayAt(15));
    await page.locator('input[type="time"]').fill("14:00");
    await page.getByRole("button", { name: "Add & predict" }).click();

    await page.getByText("Technical Report: Literature Review", { exact: true }).first().waitFor();
    await page.getByText("95m", { exact: true }).first().waitFor();
    await page.waitForTimeout(2_500);

    const reportRow = page.locator("li").filter({ hasText: "Technical Report: Literature Review" });
    await reportRow.getByRole("button", { name: "+35m delay" }).click();
    await page.getByText("130m", { exact: true }).first().waitFor();
    await page.waitForTimeout(2_500);

    await reportRow.getByLabel("Actual minutes for Technical Report: Literature Review").fill("112");
    await reportRow.getByRole("button", { name: "Complete" }).click();
    await page.getByText("Completed", { exact: true }).waitFor();
    await page.waitForTimeout(2_000);
  } finally {
    await context.close();
    await browser.close();
  }

  if (!video) throw new Error("Playwright did not create a video handle.");
  await rename(await video.path(), outputPath);
  await rm(recordingDirectory, { recursive: true, force: true });
  console.log(`Demo video recorded to ${outputPath}`);
}

recordDemo().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
