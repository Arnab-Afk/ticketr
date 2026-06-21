import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

/** Magic-link session token lifetime (30 days). */
export const ACCESS_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function generateAccessTokenValue() {
  return randomBytes(32).toString("base64url");
}

export async function ensureUserAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accessToken: true, accessTokenExpiresAt: true },
  });

  const now = Date.now();
  const stillValid =
    user?.accessToken &&
    user.accessTokenExpiresAt &&
    user.accessTokenExpiresAt.getTime() > now;

  if (stillValid) {
    const expiresAt = new Date(now + ACCESS_TOKEN_TTL_MS);
    await prisma.user.update({
      where: { id: userId },
      data: { accessTokenExpiresAt: expiresAt },
    });
    return user.accessToken!;
  }

  const accessToken = generateAccessTokenValue();
  const expiresAt = new Date(now + ACCESS_TOKEN_TTL_MS);

  await prisma.user.update({
    where: { id: userId },
    data: { accessToken, accessTokenExpiresAt: expiresAt },
  });

  return accessToken;
}

export async function getUserByAccessToken(token: string) {
  const user = await prisma.user.findUnique({
    where: { accessToken: token },
  });

  if (!user?.accessTokenExpiresAt || user.accessTokenExpiresAt.getTime() <= Date.now()) {
    return null;
  }

  return user;
}

export async function buildGuestTicketUrl(publicToken: string, userId: string) {
  const accessToken = await ensureUserAccessToken(userId);
  return `/support/tickets/${publicToken}?access=${accessToken}`;
}
