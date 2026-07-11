"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import LazyLoad from "react-lazy-load";
import InfiniteScroll from "react-infinite-scroll-component";

// ─── Types ────────────────────────────────────────────────────────────────────

type LayoutMode = "grid" | "masonry" | "justified";

interface ImageItem {
  url: string;
  source: "upload" | "gdrive";
  original_filename?: string | null;
  created_at?: string | null;
}

interface GalleryClientProps {
  /** Full shuffled list of image objects, pre-fetched by the server component */
  initialImages: ImageItem[];
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
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  
  // Map of image URL → natural aspect ratio (width/height), populated on load
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

  const modalRef = useRef<HTMLDivElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

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

  const navigateLeft = useCallback(() => {
    setSelectedImageIndex((prev) => {
      if (prev === null) return null;
      return prev === 0 ? images.length - 1 : prev - 1;
    });
  }, [images.length]);

  const navigateRight = useCallback(() => {
    setSelectedImageIndex((prev) => {
      if (prev === null) return null;
      return prev === images.length - 1 ? 0 : prev + 1;
    });
  }, [images.length]);

  // Lock scroll and track focus when lightbox is open
  useEffect(() => {
    if (selectedImageIndex !== null) {
      lastActiveElementRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      document.body.style.overflow = "";
      if (lastActiveElementRef.current) {
        lastActiveElementRef.current.focus();
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedImageIndex]);

  // Handle arrow keys, Escape key, and Tab focus trap inside lightbox
  useEffect(() => {
    if (selectedImageIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedImageIndex(null);
      } else if (e.key === "ArrowLeft") {
        navigateLeft();
      } else if (e.key === "ArrowRight") {
        navigateRight();
      } else if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImageIndex, navigateLeft, navigateRight]);

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
            const ratio = aspectRatios[image.url] ?? 1.5; // default 3:2 until loaded

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
                key={image.url}
                layoutId={`img-${index}`}
                layout
                className={`${cardClass} focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100 rounded-lg cursor-pointer`}
                style={cardStyle}
                transition={SPRING}
                tabIndex={0}
                role="button"
                aria-label={`View image ${index + 1}`}
                onClick={() => setSelectedImageIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedImageIndex(index);
                  }
                }}
              >
                {layout === "grid" && (
                  <LazyLoad>
                    <Image
                      src={image.url}
                      alt={image.original_filename ?? `Gallery image ${index + 1}`}
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
                      src={image.url}
                      alt={image.original_filename ?? `Gallery image ${index + 1}`}
                      className="block h-auto w-full"
                      loading="lazy"
                    />
                  </LazyLoad>
                )}

                {layout === "justified" && (
                  // No LazyLoad: we need onLoad to fire for aspect ratio measurement
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image.url}
                    alt={image.original_filename ?? `Gallery image ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onLoad={(e) => handleLoad(image.url, e)}
                  />
                )}
              </motion.div>
            );
          })}
        </InfiniteScroll>
      </LayoutGroup>

      {/* Lightbox / Detail View Overlay */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            ref={modalRef}
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-8 outline-none"
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedImageIndex(null);
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 btn btn-circle btn-ghost text-white hover:bg-white/20 z-50"
              aria-label="Close lightbox"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Left Nav Button */}
            <button
              onClick={navigateLeft}
              className="absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost text-white hover:bg-white/20 z-50"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Right Nav Button */}
            <button
              onClick={navigateRight}
              className="absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost text-white hover:bg-white/20 z-50"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Image viewport */}
            <div className="relative flex flex-col items-center justify-center max-w-5xl w-full h-[70vh] md:h-[80vh]">
              <motion.img
                key={images[selectedImageIndex].url}
                src={images[selectedImageIndex].url}
                alt={images[selectedImageIndex].original_filename ?? "Lightbox image"}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.25 }}
              />
            </div>

            {/* Metadata display */}
            <div className="mt-4 text-center text-white max-w-xl px-4">
              <h2 className="text-lg font-semibold truncate">
                {images[selectedImageIndex].original_filename ?? "Untitled Image"}
              </h2>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-1 text-xs opacity-75">
                <span className="capitalize badge badge-neutral text-xs">
                  {images[selectedImageIndex].source === "gdrive" ? "Google Drive" : "Upload"}
                </span>
                {images[selectedImageIndex].created_at && (
                  <span>
                    Uploaded: {new Date(images[selectedImageIndex].created_at!).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
