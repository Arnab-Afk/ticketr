import { readFileSync } from "fs";
import { join } from "path";
import { receiptBarcodeImgHtml } from "@/lib/email-barcode";
import { EMAIL_HEAD_SNIPPET } from "@/lib/email-head-snippet";

const templateCache = new Map<string, string>();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function loadTemplate(name: string): string {
  const cached = templateCache.get(name);
  if (cached) return cached;

  const filePath = join(process.cwd(), "emails", `${name}.html`);
  const html = readFileSync(filePath, "utf-8");
  templateCache.set(name, html);
  return html;
}

export function renderEmailTemplate(
  name: string,
  variables: Record<string, string>,
  rawKeys: string[] = []
): string {
  let html = loadTemplate(name);
  const raw = new Set([...rawKeys, "barcodeHtml", "emailHeadStyles"]);
  const merged = {
    emailHeadStyles: EMAIL_HEAD_SNIPPET,
    barcodeHtml: receiptBarcodeImgHtml(),
    ...variables,
  };

  for (const [key, rawValue] of Object.entries(merged)) {
    const value = raw.has(key) ? rawValue : escapeHtml(rawValue);
    html = html.replaceAll(`{{${key}}}`, value);
  }

  return html;
}

export function renderReceiptEmail(
  content: Record<string, string>
): string {
  return renderEmailTemplate(
    "receipt-layout",
    {
      extraBlockHtml: "",
      summaryRightSize: "18px",
      summaryRightColor: "#111",
      buttonColor: "#111",
      ...content,
    },
    ["lineItemsHtml", "extraBlockHtml"]
  );
}

export function truncatePreview(text: string, max = 500): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
