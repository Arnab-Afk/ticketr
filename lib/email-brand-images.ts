import { readFileSync } from "fs";
import { join } from "path";
import {
  generateTicketBarcodePng,
  TICKET_BARCODE_CID,
} from "@/lib/email-barcode";

const assetsDir = join(process.cwd(), "emails", "assets");

export const emailBrandImageCids = {
  logo: "ticketr-logo",
  thanks: "ticketr-thanks",
  barcode: TICKET_BARCODE_CID,
} as const;

export async function zeptoInlineImages(ticketNumber: string) {
  const barcodePng = await generateTicketBarcodePng(ticketNumber);

  return [
    {
      mime_type: "image/png",
      content: readFileSync(join(assetsDir, "ticketr-logo.png")).toString("base64"),
      cid: emailBrandImageCids.logo,
    },
    {
      mime_type: "image/png",
      content: readFileSync(join(assetsDir, "thank-you.png")).toString("base64"),
      cid: emailBrandImageCids.thanks,
    },
    {
      mime_type: "image/png",
      content: barcodePng.toString("base64"),
      cid: emailBrandImageCids.barcode,
    },
  ];
}
