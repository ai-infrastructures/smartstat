/**
 * Tiny form primitives shared across admin pages.
 * Server-component friendly — no client hooks here.
 */

export function FormField({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ring-blue-500 focus:border-blue-500 focus:ring-1 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder-slate-500";

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return <input type="text" className={inputCls} {...props} />;
}

export function NumberInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return <input type="number" className={inputCls} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={inputCls} {...props} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return <textarea className={inputCls + " min-h-[80px]"} {...props} />;
}

export function ColorInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        name={name}
        defaultValue={defaultValue}
        className="h-10 w-16 cursor-pointer rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
      />
      <code className="text-xs text-slate-500">{defaultValue}</code>
    </div>
  );
}
