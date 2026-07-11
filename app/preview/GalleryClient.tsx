"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, LayoutGroup } from "framer-motion";
import LazyLoad from "react-lazy-load";
import InfiniteScroll from "react-infinite-scroll-component";

// ─── Types ────────────────────────────────────────────────────────────────────

type LayoutMode = "grid" | "masonry" | "justified";

interface GalleryClientProps {
  /** Full shuffled list of image URLs, pre-fetched by the server component */
  initialImages: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LAYOUT_KEY = "gallery-layout";
const PAGE_SIZE = 20;
const JUSTIFIED_ROW_HEIGHT = 280; // px target row height for justified mode

const SPRING = {
  type: "spring" as const,
  stiffness: 350,
  damping: 35,
  mass: 0.8,
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="6" height="6" rx="0.75" />
      <rect x="9" y="1" width="6" height="6" rx="0.75" />
      <rect x="1" y="9" width="6" height="6" rx="0.75" />
      <rect x="9" y="9" width="6" height="6" rx="0.75" />
    </svg>
  );
}

function IconMasonry() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1" width="3" height="9" rx="0.75" />
      <rect x="6" y="1" width="3" height="5" rx="0.75" />
      <rect x="11" y="1" width="3" height="13" rx="0.75" />
      <rect x="6" y="8" width="3" height="6" rx="0.75" />
      <rect x="1" y="12" width="3" height="3" rx="0.75" />
    </svg>
  );
}

function IconJustified() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="1" y="1"  width="4" height="4" rx="0.75" />
      <rect x="7" y="1"  width="8" height="4" rx="0.75" />
      <rect x="1" y="7"  width="7" height="4" rx="0.75" />
      <rect x="10" y="7" width="5" height="4" rx="0.75" />
      <rect x="1" y="13" width="13" height="3" rx="0.75" />
    </svg>
  );
}

// ─── Layout Switcher ──────────────────────────────────────────────────────────

function LayoutSwitcher({
  current,
  onChange,
}: {
  current: LayoutMode;
  onChange: (m: LayoutMode) => void;
}) {
  const modes: { mode: LayoutMode; icon: React.ReactNode; label: string }[] = [
    { mode: "grid",      icon: <IconGrid />,      label: "Grid" },
    { mode: "masonry",   icon: <IconMasonry />,   label: "Masonry" },
    { mode: "justified", icon: <IconJustified />, label: "Justified" },
  ];

  return (
    <div className="mb-5 flex items-center justify-end gap-1">
      {modes.map(({ mode, icon, label }) => (
        <button
          key={mode}
          id={`layout-${mode}`}
          aria-label={`${label} layout`}
          title={label}
          onClick={() => onChange(mode)}
          className={`btn btn-sm gap-1.5 ${
            current === mode
              ? "btn-primary"
              : "btn-ghost opacity-50 hover:opacity-100"
          }`}
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GalleryClient({ initialImages }: GalleryClientProps) {
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [layout, setLayout] = useState<LayoutMode>("grid");
  // Map of image URL → natural aspect ratio (width/height), populated on load
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

  // Hydrate layout preference from localStorage after mount
  useEffect(() => {
    const saved = localStorage.getItem(LAYOUT_KEY) as LayoutMode | null;
    if (saved && ["grid", "masonry", "justified"].includes(saved)) {
      setLayout(saved);
    }
  }, []);

  function changeLayout(mode: LayoutMode) {
    setLayout(mode);
    localStorage.setItem(LAYOUT_KEY, mode);
  }

  function fetchMore() {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, initialImages.length));
  }

  function handleLoad(
    url: string,
    e: React.SyntheticEvent<HTMLImageElement>,
  ) {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      const ratio = img.naturalWidth / img.naturalHeight;
      setAspectRatios((prev) =>
        prev[url] === ratio ? prev : { ...prev, [url]: ratio },
      );
    }
  }

  // ── Derived values ──────────────────────────────────────────────────────────

  const images = initialImages.slice(0, visibleCount);
  const hasMore = visibleCount < initialImages.length;

  // ── Wrapper className per layout mode ───────────────────────────────────────
  // InfiniteScroll passes this className to its root div.
  const wrapperClass: Record<LayoutMode, string> = {
    grid:      "grid grid-cols-4 gap-4",
    masonry:   "columns-4 gap-4",
    justified: "flex flex-wrap gap-1",
  };

  // ── Early-exit for empty state ──────────────────────────────────────────────

  if (initialImages.length === 0) {
    return (
      <p className="mt-32 text-center opacity-50">
        No images yet. Upload some from the home page.
      </p>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      <LayoutSwitcher current={layout} onChange={changeLayout} />

      {/*
       * LayoutGroup coordinates shared-element layout animations across
       * the three layout modes. Each motion.div uses layoutId so Framer
       * Motion can smoothly morph elements between Grid / Masonry / Justified.
       */}
      <LayoutGroup id="gallery">
        <InfiniteScroll
          dataLength={images.length}
          next={fetchMore}
          hasMore={hasMore}
          loader={
            <p className="w-full py-8 text-center text-sm opacity-40">
              Loading more…
            </p>
          }
          className={wrapperClass[layout]}
        >
          {images.map((image, index) => {
            const ratio = aspectRatios[image] ?? 1.5; // default 3:2 until loaded

            // ── Per-layout card styles ──────────────────────────────────────

            const cardClass = {
              grid:      "overflow-hidden aspect-[2/3]",
              masonry:   "overflow-hidden break-inside-avoid mb-4",
              justified: "overflow-hidden",
            }[layout];

            // Justified: fixed row height, width grows proportional to aspect ratio
            const cardStyle =
              layout === "justified"
                ? ({
                    height: JUSTIFIED_ROW_HEIGHT,
                    flexBasis: JUSTIFIED_ROW_HEIGHT * ratio,
                    flexGrow: ratio,
                    // Prevent excessively wide single-image rows
                    maxWidth: JUSTIFIED_ROW_HEIGHT * ratio * 2,
                  } as React.CSSProperties)
                : undefined;

            return (
              <motion.div
                key={image}
                layoutId={`img-${index}`}
                layout
                className={cardClass}
                style={cardStyle}
                transition={SPRING}
              >
                {layout === "grid" && (
                  <LazyLoad>
                    <Image
                      src={image}
                      alt={`Gallery image ${index + 1}`}
                      width={500}
                      height={750}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </LazyLoad>
                )}

                {layout === "masonry" && (
                  <LazyLoad>
                    {/* plain <img> for height: auto to preserve aspect ratio */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`Gallery image ${index + 1}`}
                      className="block h-auto w-full"
                      loading="lazy"
                    />
                  </LazyLoad>
                )}

                {layout === "justified" && (
                  // No LazyLoad: we need onLoad to fire for aspect ratio measurement
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={`Gallery image ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onLoad={(e) => handleLoad(image, e)}
                  />
                )}
              </motion.div>
            );
          })}
        </InfiniteScroll>
      </LayoutGroup>
    </div>
  );
}
