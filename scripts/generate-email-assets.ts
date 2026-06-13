import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync } from "fs";
import { join } from "path";

const assetsDir = join(__dirname, "../emails/assets");
const fontPath = join(assetsDir, "MottinghamScript.woff2");
const brandColor = "#c1121f";

GlobalFonts.registerFromPath(fontPath, "Mottingham Script");

function renderTextPng(text: string, fontSize: number, padding = 12) {
  const measureCanvas = createCanvas(1, 1);
  const measureCtx = measureCanvas.getContext("2d");
  measureCtx.font = `${fontSize}px "Mottingham Script"`;
  const metrics = measureCtx.measureText(text);
  const width = Math.ceil(metrics.width + padding * 2);
  const height = Math.ceil(fontSize * 1.25 + padding * 2);

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.font = `${fontSize}px "Mottingham Script"`;
  ctx.fillStyle = brandColor;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, padding, padding + fontSize * 0.85);

  return canvas.toBuffer("image/png");
}

writeFileSync(join(assetsDir, "ticketr-logo.png"), renderTextPng("ticketr", 76));
writeFileSync(join(assetsDir, "thank-you.png"), renderTextPng("Thank You!", 36));

console.log("Generated emails/assets/ticketr-logo.png and thank-you.png");
