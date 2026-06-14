import { createCanvas, loadImage } from "@napi-rs/canvas";
import { writeFileSync } from "fs";
import { join } from "path";

const brandRed = "#c1121f";
const brandCream = "#f4efe4";

async function renderIcon(size: number) {
  const logoPath = join(__dirname, "../public/brand/ticketr-logo.png");
  const logo = await loadImage(logoPath);

  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = brandCream;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = brandRed;
  ctx.lineWidth = Math.max(1, Math.round(size / 32));
  ctx.strokeRect(
    ctx.lineWidth / 2,
    ctx.lineWidth / 2,
    size - ctx.lineWidth,
    size - ctx.lineWidth
  );

  const padding = size * 0.14;
  const maxW = size - padding * 2;
  const maxH = size - padding * 2;
  const scale = Math.min(maxW / logo.width, maxH / logo.height);
  const w = logo.width * scale;
  const h = logo.height * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;

  ctx.drawImage(logo, x, y, w, h);

  return canvas.toBuffer("image/png");
}

async function main() {
  const appDir = join(__dirname, "../app");

  writeFileSync(join(appDir, "icon.png"), await renderIcon(32));
  writeFileSync(join(appDir, "apple-icon.png"), await renderIcon(180));

  console.log("Generated app/icon.png and app/apple-icon.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
