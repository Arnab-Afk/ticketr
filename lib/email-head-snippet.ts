/** Shared <head> meta + styles for all ticketr receipt emails (iOS/Gmail dark mode safe). */
export const EMAIL_HEAD_SNIPPET = `  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    :root { color-scheme: light only; supported-color-schemes: light; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #c1121f !important; }
    .receipt-bg { background-color: #f4efe4 !important; background-image: linear-gradient(#f4efe4, #f4efe4) !important; }
    @media (prefers-color-scheme: dark) {
      body, .outer-bg { background-color: #c1121f !important; }
      .receipt, .receipt td, .receipt p { background-color: #f4efe4 !important; color: #111111 !important; }
      .receipt .muted { color: #666666 !important; }
      .receipt .btn-wrap { background-color: #111111 !important; }
      .receipt .btn-link { color: #f4efe4 !important; background-color: #111111 !important; }
      .dot-leader { color: #999999 !important; background-color: #f4efe4 !important; }
    }
    @media only screen and (max-width: 420px) {
      .receipt { width: 100% !important; max-width: 100% !important; }
      .receipt-pad { padding-left: 16px !important; padding-right: 16px !important; }
      .brand-logo { width: 120px !important; height: auto !important; }
      .brand-thanks { width: 140px !important; height: auto !important; }
      .barcode-img { width: 100% !important; max-width: 280px !important; height: auto !important; }
      .dot-leader { display: none !important; width: 0 !important; padding: 0 !important; font-size: 0 !important; line-height: 0 !important; }
      .receipt-header-left { width: 42% !important; }
      .receipt-header-right { width: 58% !important; white-space: nowrap !important; font-size: 12px !important; }
      .receipt-value { white-space: normal !important; word-break: break-word !important; max-width: 52% !important; }
    }
  </style>`;
