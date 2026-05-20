import type { Floor, NavNode } from "@smartstat/shared";
import { QRCodeImage } from "./QRCodeImage";
import { PrintButton } from "./PrintButton";

/**
 * Renders printable QR sheets for every QR anchor on a floor.
 * Server-rendered: QR SVGs are generated locally via the `qrcode` package,
 * no external service dependency.
 */
export function QRPrintList({
  floor,
  anchors,
  tenantName,
}: {
  floor: Floor;
  anchors: NavNode[];
  tenantName?: string;
}) {
  if (anchors.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          No QR anchors yet
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Go to the floor editor → Add mode → pick &quot;QR anchor&quot; and click on
          the map to place calibration points.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Print this page on A4 (one sheet per anchor) and stick each printout
          on a wall at the exact position. Each sticker is what allows the
          mobile app to know &quot;you are here&quot;.
        </p>
        <PrintButton />
      </div>

      <div className="space-y-6 print:space-y-0">
        {anchors.map(async (a) => (
          <article
            key={a.id}
            className="break-after-page rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 print:break-after-page print:rounded-none print:border-0 print:shadow-none"
          >
            <header className="mb-6 flex items-start justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400">
                  SmartStat AI · indoor navigation anchor
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                  {tenantName ?? "Hospital"} · {floor.name}
                </div>
              </div>
              <div className="text-right text-xs text-slate-500">
                Position
                <div className="mt-0.5 font-mono text-sm font-semibold text-slate-900 dark:text-white">
                  ({a.position.x.toFixed(1)} m, {a.position.y.toFixed(1)} m)
                </div>
              </div>
            </header>

            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeImage value={a.qrCode ?? ""} sizePx={360} />
              <code className="text-base font-mono text-slate-700 dark:text-slate-300">
                {a.qrCode}
              </code>
            </div>

            <footer className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
              <div>
                <div className="font-medium uppercase tracking-wider text-slate-400">
                  How to install
                </div>
                <p className="mt-1 leading-relaxed">
                  Print at <strong>A4 size</strong>. Stick at eye level on the
                  exact spot. Keep flat and well-lit.
                </p>
              </div>
              <div>
                <div className="font-medium uppercase tracking-wider text-slate-400">
                  How to scan
                </div>
                <p className="mt-1 leading-relaxed">
                  Open the SmartStat app, tap{" "}
                  <strong>&quot;Where am I&quot;</strong>, point camera at this
                  square.
                </p>
              </div>
              <div>
                <div className="font-medium uppercase tracking-wider text-slate-400">
                  Do not
                </div>
                <p className="mt-1 leading-relaxed">
                  Don&apos;t fold, cover or move. If the sticker is damaged,
                  regenerate from the admin and reprint.
                </p>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}
