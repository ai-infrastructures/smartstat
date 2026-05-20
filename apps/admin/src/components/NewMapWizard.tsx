"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Hospital,
  Layers,
  MapPin,
  Sparkles,
  Upload,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import type { Building, Floor, Tenant } from "@smartstat/shared";

type StepId = 1 | 2 | 3 | 4 | 5;

interface Props {
  initialTenants: Tenant[];
  initialBuildings: Building[];
  initialFloors: Floor[];
}

interface Step {
  id: StepId;
  title: string;
  description: string;
  Icon: typeof Hospital;
}

const STEPS: Step[] = [
  {
    id: 1,
    title: "Choose hospital",
    description: "Pick or create the tenant this map belongs to.",
    Icon: Hospital,
  },
  {
    id: 2,
    title: "Choose building",
    description: "Pick or add a physical building of the hospital.",
    Icon: Building2,
  },
  {
    id: 3,
    title: "Create floor",
    description: "Add the floor level you are mapping (ground, +1, -1…).",
    Icon: Layers,
  },
  {
    id: 4,
    title: "Upload scan",
    description: "Send the operator a link, or use the mobile scanner app.",
    Icon: Upload,
  },
  {
    id: 5,
    title: "Label & publish",
    description: "Generate the plan, label rooms as POIs, publish.",
    Icon: MapPin,
  },
];

export function NewMapWizard({
  initialTenants,
  initialBuildings,
  initialFloors,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<StepId>(1);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string | null>(null);

  const selectedTenant = initialTenants.find((t) => t.id === tenantId) ?? null;
  const buildingsOfTenant = initialBuildings.filter(
    (b) => b.tenantId === tenantId
  );
  const selectedBuilding =
    buildingsOfTenant.find((b) => b.id === buildingId) ?? null;
  const floorsOfBuilding = initialFloors.filter(
    (f) => f.buildingId === buildingId
  );
  const selectedFloor = floorsOfBuilding.find((f) => f.id === floorId) ?? null;

  function next() {
    if (step === 1 && !tenantId) return;
    if (step === 2 && !buildingId) return;
    if (step === 3 && !floorId) return;
    setStep((s) => (Math.min(s + 1, 5) as StepId));
  }
  function back() {
    setStep((s) => (Math.max(s - 1, 1) as StepId));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Sidebar steps */}
      <aside className="space-y-1">
        {STEPS.map((s) => {
          const done =
            (s.id === 1 && !!tenantId) ||
            (s.id === 2 && !!buildingId) ||
            (s.id === 3 && !!floorId) ||
            (s.id === 4 && !!floorId && step > 4) ||
            (s.id === 5 && false);
          const current = s.id === step;
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => {
                // Allow going back to any completed step
                if (s.id < step) setStep(s.id);
              }}
              className={
                current
                  ? "flex w-full items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-left dark:border-blue-900 dark:bg-blue-950/40"
                  : "flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              }
            >
              <span
                className={
                  done
                    ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
                    : current
                    ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
                    : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800"
                }
              >
                {done ? (
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  <s.Icon className="h-4 w-4" strokeWidth={2.5} />
                )}
              </span>
              <span>
                <span
                  className={
                    current
                      ? "block text-sm font-semibold text-blue-900 dark:text-blue-200"
                      : "block text-sm font-medium text-slate-900 dark:text-white"
                  }
                >
                  {s.id}. {s.title}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {s.description}
                </span>
              </span>
            </button>
          );
        })}
      </aside>

      {/* Body */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {step === 1 && (
          <Step1
            tenants={initialTenants}
            tenantId={tenantId}
            onChange={setTenantId}
          />
        )}
        {step === 2 && selectedTenant && (
          <Step2
            tenant={selectedTenant}
            buildings={buildingsOfTenant}
            buildingId={buildingId}
            onChange={setBuildingId}
          />
        )}
        {step === 3 && selectedBuilding && (
          <Step3
            building={selectedBuilding}
            floors={floorsOfBuilding}
            floorId={floorId}
            onChange={setFloorId}
          />
        )}
        {step === 4 && selectedFloor && <Step4 floor={selectedFloor} />}
        {step === 5 && selectedFloor && (
          <Step5
            floor={selectedFloor}
            onJump={() => router.push(`/floors/${selectedFloor.id}`)}
          />
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-800">
          <button
            type="button"
            onClick={back}
            disabled={step === 1}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Back
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={next}
              disabled={
                (step === 1 && !tenantId) ||
                (step === 2 && !buildingId) ||
                (step === 3 && !floorId)
              }
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Continue
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => router.push(`/floors/${floorId}`)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
              Open floor editor
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Steps ---------------- */

function Step1({
  tenants,
  tenantId,
  onChange,
}: {
  tenants: Tenant[];
  tenantId: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <StepHeading
        Icon={Hospital}
        title="Step 1 — Pick or create a hospital"
        body="A 'hospital' (or any facility) is a tenant. Each tenant has its own branding, maps, and users."
      />

      {tenants.length === 0 ? (
        <EmptyState
          ctaHref="/tenants/new"
          title="No hospitals yet"
          body="Create your first tenant to get started."
          cta="Create first hospital"
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {tenants.map((t) => (
            <PickCard
              key={t.id}
              active={tenantId === t.id}
              onClick={() => onChange(t.id)}
              title={t.name}
              subtitle={t.slug}
              dot={t.branding.primaryColor}
            />
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        Or{" "}
        <Link
          href="/tenants/new"
          className="font-medium text-blue-600 hover:underline"
        >
          create a new hospital
        </Link>{" "}
        — you can return here after.
      </div>
    </>
  );
}

function Step2({
  tenant,
  buildings,
  buildingId,
  onChange,
}: {
  tenant: Tenant;
  buildings: Building[];
  buildingId: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <StepHeading
        Icon={Building2}
        title="Step 2 — Pick a building"
        body={`Buildings under "${tenant.name}". A tenant can have many.`}
      />

      {buildings.length === 0 ? (
        <EmptyState
          ctaHref={`/buildings/new?tenant=${tenant.id}`}
          title="No buildings yet for this hospital"
          body="Add the building you want to map first."
          cta="Add a building"
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {buildings.map((b) => (
            <PickCard
              key={b.id}
              active={buildingId === b.id}
              onClick={() => onChange(b.id)}
              title={b.name}
              subtitle={`${b.address.city}${
                b.address.state ? `, ${b.address.state}` : ""
              }`}
              dot={tenant.branding.primaryColor}
            />
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        Or{" "}
        <Link
          href={`/buildings/new?tenant=${tenant.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          add a new building
        </Link>
        .
      </div>
    </>
  );
}

function Step3({
  building,
  floors,
  floorId,
  onChange,
}: {
  building: Building;
  floors: Floor[];
  floorId: string | null;
  onChange: (id: string) => void;
}) {
  return (
    <>
      <StepHeading
        Icon={Layers}
        title="Step 3 — Pick the floor"
        body={`Floors of "${building.name}". Each floor is mapped independently.`}
      />

      {floors.length === 0 ? (
        <EmptyState
          ctaHref={`/floors/new?building=${building.id}`}
          title="No floors yet for this building"
          body="Create the floor level (0 = ground, -1 = basement, +1 = first upper, …)."
          cta="Add a floor"
        />
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {floors.map((f) => (
            <PickCard
              key={f.id}
              active={floorId === f.id}
              onClick={() => onChange(f.id)}
              title={f.name}
              subtitle={`Level ${f.level}${
                f.bbox
                  ? ` · ${(f.bbox[2] - f.bbox[0]).toFixed(0)} × ${(
                      f.bbox[3] - f.bbox[1]
                    ).toFixed(0)} m`
                  : ""
              }`}
              status={f.scanStatus}
            />
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        Or{" "}
        <Link
          href={`/floors/new?building=${building.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          add a new floor
        </Link>
        .
      </div>
    </>
  );
}

function Step4({ floor }: { floor: Floor }) {
  const hasMesh = Boolean(floor.meshUrl);
  const hasPlan = Boolean(floor.floorplan2dUrl);
  return (
    <>
      <StepHeading
        Icon={Upload}
        title="Step 4 — Upload the scan files"
        body="Use the SmartStat mobile app (Scanner workspace) to upload the LiDAR mesh and the 2D floor plan."
      />

      <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
          How to capture
        </h4>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
          <li>Open Polycam on an iPhone with LiDAR (12 Pro or newer)</li>
          <li>Capture the floor walking each corridor and room</li>
          <li>Export the result as <code className="rounded bg-slate-200 px-1 dark:bg-slate-800">.glb</code> (mesh) and, with Polycam Pro, as a PDF/PNG floor plan</li>
          <li>Open the SmartStat mobile app → Profile → Sign in → Scanner workspace</li>
          <li>Pick this floor and upload both files</li>
        </ol>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <UploadStatus
          ok={hasMesh}
          label="3D Mesh (.glb)"
          done={hasMesh ? "Uploaded" : "Waiting on operator"}
        />
        <UploadStatus
          ok={hasPlan}
          label="2D Floor plan"
          done={
            hasPlan
              ? "Uploaded"
              : "Optional — can auto-generate from mesh in step 5"
          }
        />
      </div>

      {!hasMesh && !hasPlan && (
        <p className="mt-4 text-xs text-slate-500">
          This page refreshes when files arrive. You can also just click
          Continue and come back later.
        </p>
      )}
    </>
  );
}

function Step5({ floor, onJump }: { floor: Floor; onJump: () => void }) {
  return (
    <>
      <StepHeading
        Icon={MapPin}
        title="Step 5 — Generate plan, label rooms, publish"
        body="Final stretch: auto-generate the 2D plan if needed, drop POIs on the rooms, and publish the floor to make it visible to end users."
      />

      <ol className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
        <li className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <span>
            Click <strong>Auto-generate plan</strong> on the floor editor —
            SmartStat reads the .glb mesh and draws the wall outline.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <span>
            Switch to <strong>Add</strong> mode and click on each room. Give it
            a name like &quot;Cardiology&quot; or &quot;Living room&quot; and a
            category.
          </span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
          <span>
            When you&apos;re happy, click <strong>Publish floor</strong> at the
            top — the floor becomes visible to mobile users.
          </span>
        </li>
      </ol>

      <button
        type="button"
        onClick={onJump}
        className="mt-6 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
      >
        Open the floor editor for {floor.name}
        <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </>
  );
}

/* ---------------- Tiny components ---------------- */

function StepHeading({
  Icon,
  title,
  body,
}: {
  Icon: typeof Hospital;
  title: string;
  body: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
          {body}
        </p>
      </div>
    </div>
  );
}

function PickCard({
  active,
  onClick,
  title,
  subtitle,
  dot,
  status,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
  dot?: string;
  status?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex items-center justify-between rounded-xl border-2 border-blue-500 bg-blue-50 p-3.5 text-left transition dark:bg-blue-950/30"
          : "flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
      }
    >
      <div className="flex items-center gap-3">
        {dot && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: dot }}
          />
        )}
        <div>
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            {title}
          </div>
          <div className="text-xs text-slate-500">{subtitle}</div>
        </div>
      </div>
      {active && (
        <CheckCircle2
          className="h-5 w-5 text-blue-600 dark:text-blue-400"
          strokeWidth={2.5}
        />
      )}
      {status && !active && (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {status.replace("_", " ")}
        </span>
      )}
    </button>
  );
}

function UploadStatus({
  ok,
  label,
  done,
}: {
  ok: boolean;
  label: string;
  done: string;
}) {
  return (
    <div
      className={
        ok
          ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30"
          : "rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
      }
    >
      <div className="flex items-center gap-1.5">
        {ok ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />
        ) : (
          <Upload className="h-3.5 w-3.5 text-slate-500" strokeWidth={2} />
        )}
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </span>
      </div>
      <div className="mt-1 text-[11px] text-slate-500">{done}</div>
    </div>
  );
}

function EmptyState({
  ctaHref,
  title,
  body,
  cta,
}: {
  ctaHref: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-950">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </h4>
      <p className="mt-1 text-xs text-slate-500">{body}</p>
      <Link
        href={ctaHref}
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
      >
        {cta}
      </Link>
    </div>
  );
}
