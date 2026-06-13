import bwipjs from "bwip-js";

export const TICKET_BARCODE_CID = "ticket-barcode";

export function formatBarcodeValue(ticketNumber: string): string {
  const value = ticketNumber.trim();
  return value.startsWith("#") ? value.slice(1) : value;
}

export async function generateTicketBarcodePng(
  ticketNumber: string
): Promise<Buffer> {
  return bwipjs.toBuffer({
    bcid: "code128",
    text: formatBarcodeValue(ticketNumber),
    scale: 3,
    height: 6,
    includetext: false,
    paddingwidth: 12,
    paddingheight: 2,
    backgroundcolor: "F4EFE4",
  });
}

export function receiptBarcodeImgHtml(): string {
  return `<img src="cid:${TICKET_BARCODE_CID}" alt="Ticket barcode" width="320" class="barcode-img" style="display:block;margin:0 auto;border:0;outline:none;max-width:100%;height:auto;" />`;
}

export async function receiptBarcodePreviewImgHtml(
  ticketNumber: string
): Promise<string> {
  const png = await generateTicketBarcodePng(ticketNumber);
  const dataUri = `data:image/png;base64,${png.toString("base64")}`;
  return `<img src="${dataUri}" alt="Ticket barcode" width="320" class="barcode-img" style="display:block;margin:0 auto;border:0;outline:none;max-width:100%;height:auto;" />`;
}
