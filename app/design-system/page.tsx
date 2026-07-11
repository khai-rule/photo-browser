"use client";

import { useEffect, useState } from "react";
import { getCSSVarHex, contrastRatio, wcagLevel } from "@/lib/contrast";

// ─── Token definitions ────────────────────────────────────────────────────────
// DaisyUI 4.x stores theme colors as oklch channel triplets in these CSS vars.

const COLOR_TOKENS = [
  { label: "primary",         bg: "--p",  text: "--pc",  bgClass: "bg-primary",   group: "brand" },
  { label: "primary-content", bg: "--pc", text: "--p",   bgClass: "bg-primary",   group: "brand" },
  { label: "secondary",       bg: "--s",  text: "--sc",  bgClass: "bg-secondary",  group: "brand" },
  { label: "accent",          bg: "--a",  text: "--ac",  bgClass: "bg-accent",     group: "brand" },
  { label: "neutral",         bg: "--n",  text: "--nc",  bgClass: "bg-neutral",    group: "brand" },
  { label: "base-100",        bg: "--b1", text: "--bc",  bgClass: "bg-base-100",   group: "base" },
  { label: "base-200",        bg: "--b2", text: "--bc",  bgClass: "bg-base-200",   group: "base" },
  { label: "base-300",        bg: "--b3", text: "--bc",  bgClass: "bg-base-300",   group: "base" },
  { label: "info",            bg: "--in", text: "--inc", bgClass: "bg-info",       group: "state" },
  { label: "success",         bg: "--su", text: "--suc", bgClass: "bg-success",    group: "state" },
  { label: "warning",         bg: "--wa", text: "--wac", bgClass: "bg-warning",    group: "state" },
  { label: "error",           bg: "--er", text: "--erc", bgClass: "bg-error",      group: "state" },
] as const;

const SPACING_STEPS = [
  { tw: "1",  px: 4,   rem: "0.25" },
  { tw: "2",  px: 8,   rem: "0.5" },
  { tw: "3",  px: 12,  rem: "0.75" },
  { tw: "4",  px: 16,  rem: "1" },
  { tw: "6",  px: 24,  rem: "1.5" },
  { tw: "8",  px: 32,  rem: "2" },
  { tw: "10", px: 40,  rem: "2.5" },
  { tw: "12", px: 48,  rem: "3" },
  { tw: "16", px: 64,  rem: "4" },
  { tw: "20", px: 80,  rem: "5" },
  { tw: "24", px: 96,  rem: "6" },
];

// Typography labels match the actual sizes in globals.css
const TYPE_SCALE = [
  { tag: "h1" as const, size: "8rem",   note: "128px · Display" },
  { tag: "h2" as const, size: "6rem",   note: "96px · Title" },
  { tag: "h3" as const, size: "4.5rem", note: "72px · Heading 1" },
  { tag: "h4" as const, size: "3.5rem", note: "56px · Heading 2" },
  { tag: "h5" as const, size: "2.5rem", note: "40px · Heading 3" },
  { tag: "h6" as const, size: "1.5rem", note: "24px · Subheading" },
  { tag: "p"  as const, size: "1rem",   note: "16px · Body" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function WCAGBadge({ level }: { level: "AAA" | "AA" | "fail" }) {
  const cls = {
    AAA: "bg-success text-success-content",
    AA: "bg-warning text-warning-content",
    fail: "bg-error text-error-content",
  }[level];
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${cls}`}>
      {level === "fail" ? "FAIL" : level}
    </span>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] opacity-40">
        {title}
      </span>
      <div className="h-px flex-1 bg-base-300" />
    </div>
  );
}

// ─── Color swatch card ────────────────────────────────────────────────────────

interface ColorData {
  bgHex: string;
  textHex: string;
  ratio: number;
  level: "AAA" | "AA" | "fail";
}

function SwatchCard({
  token,
  data,
}: {
  token: (typeof COLOR_TOKENS)[number];
  data: ColorData | undefined;
}) {
  return (
    <div className="card overflow-hidden shadow-sm ring-1 ring-base-300 transition-shadow hover:shadow-md">
      {/* Color block */}
      <div className={`${token.bgClass} flex h-20 items-end p-2`}>
        <span
          className="font-mono text-[10px] font-semibold opacity-70"
          style={{ color: data?.textHex ?? "inherit" }}
        >
          Aa
        </span>
      </div>
      {/* Meta */}
      <div className="bg-base-100 px-3 py-2">
        <p className="font-mono text-xs font-semibold leading-tight">{token.label}</p>
        <p className="mt-0.5 font-mono text-[10px] opacity-50">
          {data?.bgHex ?? "—"}
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          {data ? (
            <>
              <WCAGBadge level={data.level} />
              <span className="font-mono text-[10px] opacity-40">
                {data.ratio.toFixed(2)}:1
              </span>
            </>
          ) : (
            <span className="animate-pulse font-mono text-[10px] opacity-30">computing…</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DesignSystemPage() {
  const [colorMap, setColorMap] = useState<Record<string, ColorData>>({});
  const [theme, setTheme] = useState<string>("—");

  function recompute() {
    const result: Record<string, ColorData> = {};
    for (const t of COLOR_TOKENS) {
      const bgHex = getCSSVarHex(t.bg);
      const textHex = getCSSVarHex(t.text);
      const ratio = contrastRatio(bgHex, textHex);
      result[t.label] = { bgHex, textHex, ratio, level: wcagLevel(ratio) };
    }
    setColorMap(result);
    setTheme(
      document.documentElement.getAttribute("data-theme") ?? "default",
    );
  }

  useEffect(() => {
    recompute();

    // Re-run whenever DaisyUI/theme-change updates data-theme
    const observer = new MutationObserver(recompute);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brandTokens  = COLOR_TOKENS.filter((t) => t.group === "brand");
  const baseTokens   = COLOR_TOKENS.filter((t) => t.group === "base");
  const stateTokens  = COLOR_TOKENS.filter((t) => t.group === "state");

  return (
    <main className="min-h-screen px-8 pb-40 pt-20">

      {/* ── Hero ── */}
      <header className="mb-16">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className="text-xl font-bold tracking-tight">Design System</h1>
          <span className="badge badge-outline badge-primary font-mono text-xs capitalize">
            {theme}
          </span>
          <span className="text-xs opacity-40">
            · updates live when you switch themes
          </span>
        </div>
        <p className="mt-1 max-w-xl text-sm opacity-50">
          A living reference for all DaisyUI design tokens, typography, spacing,
          and core component states. Change the theme with the switcher in the
          bottom bar.
        </p>
      </header>

      {/* ── Color Palette ── */}
      <section className="mb-16">
        <SectionHeading title="Color Palette" />

        <div className="mb-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest opacity-30">Brand</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {brandTokens.map((t) => (
              <SwatchCard key={t.label} token={t} data={colorMap[t.label]} />
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest opacity-30">Base</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {baseTokens.map((t) => (
              <SwatchCard key={t.label} token={t} data={colorMap[t.label]} />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest opacity-30">State</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stateTokens.map((t) => (
              <SwatchCard key={t.label} token={t} data={colorMap[t.label]} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Typography Scale ── */}
      <section className="mb-16">
        <SectionHeading title="Typography Scale" />
        <div className="divide-y divide-base-300">
          {TYPE_SCALE.map(({ tag: Tag, size, note }) => (
            <div
              key={Tag}
              className="flex items-center gap-6 overflow-hidden py-3"
            >
              {/* Tag label */}
              <span className="w-8 shrink-0 font-mono text-xs opacity-30">
                {Tag}
              </span>
              {/* Specimen — clipped to one line */}
              <div className="min-w-0 flex-1 overflow-hidden">
                <Tag
                  className="block truncate leading-none"
                  aria-label={`${Tag} specimen`}
                >
                  Aa
                </Tag>
              </div>
              {/* Meta */}
              <span className="shrink-0 font-mono text-xs opacity-40">
                {note}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Spacing Scale ── */}
      <section className="mb-16">
        <SectionHeading title="Spacing Scale" />
        <div className="flex flex-wrap items-end gap-x-6 gap-y-8">
          {SPACING_STEPS.map(({ tw, px, rem }) => (
            <div key={tw} className="flex flex-col items-start gap-1.5">
              {/* Block whose WIDTH represents the spacing value */}
              <div
                className="h-8 rounded-sm bg-primary"
                style={{ width: px }}
              />
              <span className="font-mono text-[10px] font-semibold opacity-60">
                {tw}
              </span>
              <span className="font-mono text-[10px] opacity-30">
                {px}px · {rem}rem
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Component States ── */}
      <section className="mb-16">
        <SectionHeading title="Component States" />

        {/* Buttons */}
        <div className="mb-10">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest opacity-30">
            Button
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-primary">Primary</button>
            <button className="btn btn-secondary">Secondary</button>
            <button className="btn btn-accent">Accent</button>
            <button className="btn btn-neutral">Neutral</button>
            <button className="btn btn-outline btn-primary">Outline</button>
            <button className="btn btn-ghost">Ghost</button>
            <button className="btn btn-primary btn-sm">Small</button>
            <button className="btn btn-primary btn-lg">Large</button>
            <button className="btn btn-primary" disabled>
              Disabled
            </button>
          </div>

          {/* State variants row */}
          <div className="mt-3 flex flex-wrap gap-3">
            <button className="btn btn-info btn-sm">Info</button>
            <button className="btn btn-success btn-sm">Success</button>
            <button className="btn btn-warning btn-sm">Warning</button>
            <button className="btn btn-error btn-sm">Error</button>
          </div>
        </div>

        {/* Inputs */}
        <div className="mb-10">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest opacity-30">
            Input
          </p>
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex flex-col gap-1">
              <input
                className="input input-bordered"
                placeholder="Default"
                readOnly
              />
              <span className="font-mono text-[10px] opacity-30">default</span>
            </div>
            <div className="flex flex-col gap-1">
              <input
                className="input input-bordered input-primary"
                placeholder="Primary focus"
                readOnly
              />
              <span className="font-mono text-[10px] opacity-30">input-primary</span>
            </div>
            <div className="flex flex-col gap-1">
              <input
                className="input input-bordered input-success"
                placeholder="Success"
                readOnly
              />
              <span className="font-mono text-[10px] opacity-30">input-success</span>
            </div>
            <div className="flex flex-col gap-1">
              <input
                className="input input-bordered input-error"
                placeholder="Error"
                readOnly
              />
              <span className="font-mono text-[10px] opacity-30">input-error</span>
            </div>
            <div className="flex flex-col gap-1">
              <input
                className="input input-bordered"
                placeholder="Disabled"
                disabled
              />
              <span className="font-mono text-[10px] opacity-30">disabled</span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="mb-10">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest opacity-30">
            Card
          </p>
          <div className="flex flex-wrap gap-4">
            {/* Default */}
            <div className="card w-60 bg-base-200 shadow-md">
              <div className="card-body p-4">
                <h2 className="card-title text-sm">Default Card</h2>
                <p className="text-xs opacity-60">
                  Supporting body text goes here.
                </p>
                <div className="card-actions mt-3 justify-end">
                  <button className="btn btn-primary btn-xs">Action</button>
                </div>
              </div>
            </div>

            {/* With image placeholder */}
            <div className="card w-60 bg-base-200 shadow-md">
              <div className="bg-base-300 h-24 rounded-t-2xl" />
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <h2 className="card-title text-sm">Image Card</h2>
                  <span className="badge badge-primary badge-sm">NEW</span>
                </div>
                <p className="text-xs opacity-60">With a top image area.</p>
              </div>
            </div>

            {/* Bordered */}
            <div className="card w-60 border border-base-300 bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h2 className="card-title text-sm">Bordered</h2>
                <p className="text-xs opacity-60">
                  Uses ring/border instead of shadow.
                </p>
                <div className="card-actions mt-3">
                  <button className="btn btn-ghost btn-xs">Cancel</button>
                  <button className="btn btn-primary btn-xs">Confirm</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest opacity-30">
            Badge
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge">Default</span>
            <span className="badge badge-primary">Primary</span>
            <span className="badge badge-secondary">Secondary</span>
            <span className="badge badge-accent">Accent</span>
            <span className="badge badge-outline">Outline</span>
            <span className="badge badge-info">Info</span>
            <span className="badge badge-success">Success</span>
            <span className="badge badge-warning">Warning</span>
            <span className="badge badge-error">Error</span>
          </div>
        </div>
      </section>
    </main>
  );
}
