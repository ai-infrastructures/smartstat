import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { createTenantAction } from "@/lib/actions/tenants";
import { FormField, TextInput, ColorInput } from "@/components/forms";

export default function NewTenantPage() {
  return (
    <>
      <PageHeader
        title="New tenant"
        description="Create a hospital that will use SmartStat AI."
        breadcrumbs={[
          { label: "Tenants", href: "/tenants" },
          { label: "New" },
        ]}
      />

      <div className="px-4 py-5 md:px-8 md:py-6">
        <form
          action={createTenantAction}
          className="max-w-2xl space-y-5 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <FormField label="Hospital name" required>
            <TextInput name="name" placeholder="Memorial Hospital" required />
          </FormField>

          <FormField
            label="Slug (URL-safe identifier)"
            hint="Lowercase, hyphens, no spaces. Auto-cleaned."
            required
          >
            <TextInput
              name="slug"
              placeholder="memorial-hospital"
              pattern="[a-z0-9-]+"
              required
            />
          </FormField>

          <FormField
            label="App display name"
            hint="What end users see at the top of the mobile app."
          >
            <TextInput name="appDisplayName" placeholder="Memorial Wayfinder" />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Primary color">
              <ColorInput name="primaryColor" defaultValue="#0066CC" />
            </FormField>
            <FormField label="Secondary color">
              <ColorInput name="secondaryColor" defaultValue="#10B981" />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Link
              href="/tenants"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create tenant
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
