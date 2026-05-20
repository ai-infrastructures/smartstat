"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="shrink-0 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      🖨 Print all
    </button>
  );
}
