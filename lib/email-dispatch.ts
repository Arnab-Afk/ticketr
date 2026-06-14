/** Run email sends without failing the caller (ticket APIs must succeed even if Zepto is down). */
export async function dispatchEmail(
  label: string,
  fn: () => Promise<void>
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    console.error(`[email] ${label} failed:`, error);
  }
}

export async function dispatchEmails(
  tasks: Array<{ label: string; fn: () => Promise<void> }>
): Promise<void> {
  await Promise.all(tasks.map(({ label, fn }) => dispatchEmail(label, fn)));
}

export function formatMessagePreview(
  body: string,
  attachmentCount = 0
): string {
  const trimmed = body.trim();
  if (trimmed && trimmed !== "(attachment)") return trimmed;
  if (attachmentCount > 0) {
    return attachmentCount === 1
      ? "[1 attachment included]"
      : `[${attachmentCount} attachments included]`;
  }
  return trimmed || "(empty message)";
}
