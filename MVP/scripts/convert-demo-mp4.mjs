import { createReadStream } from "node:fs";
import { createServer } from "node:http";
import { chromium } from "@playwright/test";

const inputPath = "docs/demo.webm";
const outputPath = "docs/demo.mp4";

function startVideoServer() {
  const server = createServer((request, response) => {
    if (request.url !== "/demo.webm") {
      response.writeHead(404);
      response.end();
      return;
    }
    response.writeHead(200, { "Content-Type": "video/webm", "Access-Control-Allow-Origin": "*" });
    createReadStream(inputPath).pipe(response);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function convertDemo() {
  const server = await startVideoServer();
  const address = server.address();
  const sourceUrl = `http://127.0.0.1:${address.port}/demo.webm`;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    const downloadPromise = page.waitForEvent("download");
    await page.evaluate(async (source) => {
      const mimeType = "video/mp4;codecs=avc1.42E01E";
      if (!MediaRecorder.isTypeSupported(mimeType)) throw new Error("MP4 recording is unavailable in this Chromium build.");

      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.src = source;
      document.body.append(video);
      await new Promise((resolve, reject) => {
        video.addEventListener("loadedmetadata", resolve, { once: true });
        video.addEventListener("error", () => reject(new Error("Could not load the WebM source.")), { once: true });
      });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas is unavailable.");

      const chunks = [];
      const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType, videoBitsPerSecond: 5_000_000 });
      const finished = new Promise((resolve) => {
        recorder.addEventListener("dataavailable", (event) => { if (event.data.size) chunks.push(event.data); });
        recorder.addEventListener("stop", () => resolve(new Blob(chunks, { type: "video/mp4" })), { once: true });
      });
      const drawFrame = () => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (!video.ended) requestAnimationFrame(drawFrame);
      };

      recorder.start();
      await video.play();
      drawFrame();
      await new Promise((resolve) => video.addEventListener("ended", resolve, { once: true }));
      recorder.stop();
      const blob = await finished;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "demo.mp4";
      link.click();
    }, sourceUrl);
    const download = await downloadPromise;
    await download.saveAs(outputPath);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`MP4 demo saved to ${outputPath}`);
}

convertDemo().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
