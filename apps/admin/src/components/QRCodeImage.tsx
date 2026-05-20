import QRCode from "qrcode";

/**
 * Server-rendered QR code as inline SVG.
 * High error-correction (H) so the code survives partial damage / shadows.
 */
export async function QRCodeImage({
  value,
  sizePx = 320,
}: {
  value: string;
  sizePx?: number;
}) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    width: sizePx,
    color: { dark: "#000000", light: "#FFFFFF" },
  });

  // Strip the outer <?xml> declaration to keep the SVG inline-friendly
  const cleaned = svg.replace(/<\?xml[^?]*\?>/, "").trim();

  return (
    <div
      className="rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700"
      style={{ width: sizePx, height: sizePx }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: cleaned }}
    />
  );
}
