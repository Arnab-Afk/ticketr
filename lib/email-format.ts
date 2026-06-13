function formatReceiptDate(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getMonth() + 1)}/${pad(date.getDate())} ${date.getFullYear()} ${pad(date.getHours())}.${pad(date.getMinutes())}`;
}

function formatTicketNumber(ticketId: string): string {
  return ticketId.slice(-6).toUpperCase();
}

export { formatReceiptDate, formatTicketNumber };
