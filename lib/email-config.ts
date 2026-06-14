const PRODUCTION_APP_URL = "https://ticketr.ideahackathon.com";
const DEFAULT_SUPPORT_EMAIL = "ticketr@ideahackathon.com";

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalUrl(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

/** Public ticketr URL for links in outbound email (never localhost). */
export function emailAppUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.AUTH_URL,
    PRODUCTION_APP_URL,
  ].filter(Boolean) as string[];

  for (const url of candidates) {
    if (!isLocalUrl(url)) {
      return normalizeUrl(url);
    }
  }

  return PRODUCTION_APP_URL;
}

/** Support address shown in email footers and used as Zepto from address. */
export function supportEmailAddress(): string {
  return process.env.ZEPTO_FROM_ADDRESS ?? DEFAULT_SUPPORT_EMAIL;
}
