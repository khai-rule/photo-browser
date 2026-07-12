"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const COLUMNS = 4;
const GAP = 8; // px gap between cells and rows
const SCROLL_SPEED = 0.4; // px per animation frame ≈ 24 px/s at 60 fps
const BUFFER_ROWS_ABOVE = 1; // minimal — we only scroll downward
const BUFFER_ROWS_BELOW = 3; // directional preload ahead in the scroll direction

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImageItem {
  url: string;
  original_filename?: string | null;
}

interface ScreensaverGalleryProps {
  images: ImageItem[];
}

// ── Thumbnail URL helper ──────────────────────────────────────────────────────
// Appends Supabase Image Transformation params to request a smaller thumbnail
// for ambient browsing. Falls back to the original URL if the project does not
// have the Transform feature enabled (graceful degradation, no errors).

function getThumbUrl(url: string): string {
  if (url.includes("/storage/v1/")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}width=480&quality=60`;
  }
  return url;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScreensaverGallery({ images }: ScreensaverGalleryProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const rafIdRef = useRef<number>(0);

  // Container dimensions — populated by ResizeObserver after mount
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  // First rendered row — updated only when the visible row window shifts (~every 10 s)
  const [firstRow, setFirstRow] = useState(0);

  const totalImages = images.length;

  // ── Derived layout values ───────────────────────────────────────────────────
  // Distribute (COLUMNS - 1) gaps across the full container width.
  const cellWidth =
    containerSize.width > 0
      ? (containerSize.width - GAP * (COLUMNS - 1)) / COLUMNS
      : 0;
  const cellHeight = cellWidth * 1.5; // portrait 2:3 aspect ratio
  const rowHeight = cellHeight + GAP;

  // Loop length: totalImages rows guarantees modulo seamlessness for any image count.
  const loopHeight = rowHeight > 0 ? totalImages * rowHeight : 0;

  // ── ResizeObserver — measure container ─────────────────────────────────────
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── RAF auto-scroll loop ────────────────────────────────────────────────────
  const startRAF = useCallback(() => {
    if (rowHeight <= 0 || loopHeight <= 0) return () => {};

    function tick() {
      // Advance the virtual scroll offset
      offsetRef.current += SCROLL_SPEED;

      // Seamless modulo reset — content at offset 0 and offset loopHeight are
      // visually identical, so the reset is imperceptible.
      if (offsetRef.current >= loopHeight) {
        offsetRef.current -= loopHeight;
      }

      // Apply GPU-accelerated transform — no layout, no paint, compositor-only
      if (trackRef.current) {
        trackRef.current.style.transform = `translateY(${-offsetRef.current}px)`;
      }

      // Update visible row window.
      // Only triggers a React re-render when the integer row index changes —
      // approximately every (rowHeight / SCROLL_SPEED) frames ≈ every 10 s.
      const newFirstRow = Math.max(
        0,
        Math.floor(
          (offsetRef.current - BUFFER_ROWS_ABOVE * rowHeight) / rowHeight,
        ),
      );
      setFirstRow((prev) => (prev === newFirstRow ? prev : newFirstRow));

      rafIdRef.current = requestAnimationFrame(tick);
    }

    rafIdRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [rowHeight, loopHeight]);

  // Start RAF on mount / restart after resize
  useEffect(() => startRAF(), [startRAF]);

  // ── Compute visible items ───────────────────────────────────────────────────
  const visibleItems: Array<{
    key: string;
    realIdx: number;
    top: number;
    left: number;
    width: number;
    height: number;
  }> = [];

  if (rowHeight > 0 && containerSize.width > 0 && totalImages > 0) {
    const visibleRowCount = Math.ceil(containerSize.height / rowHeight) + 1;
    const lastRow = firstRow + visibleRowCount + BUFFER_ROWS_BELOW;

    for (let row = firstRow; row <= lastRow; row++) {
      for (let col = 0; col < COLUMNS; col++) {
        const virtualIdx = row * COLUMNS + col;
        const realIdx = virtualIdx % totalImages;
        visibleItems.push({
          key: `${row}-${col}`,
          realIdx,
          top: row * rowHeight,
          left: col * (cellWidth + GAP),
          width: cellWidth,
          height: cellHeight,
        });
      }
    }
  }

  if (totalImages === 0) return null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={outerRef}
      className="absolute inset-0 overflow-hidden bg-base-100"
      aria-hidden="true"
    >
      {/* Top vignette */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-base-100/80 to-transparent" />
      {/* Bottom vignette */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-gradient-to-t from-base-100/80 to-transparent" />

      {/* GPU scroll track — will-change-transform promotes to compositor layer */}
      <div
        ref={trackRef}
        className="absolute inset-x-0 top-0 will-change-transform"
        style={{ transform: "translateY(0)" }}
      >
        {/* Absolute positioning root — height:1 avoids creating document scroll area */}
        <div
          className="relative"
          style={{ width: containerSize.width, height: 1 }}
        >
          {visibleItems.map((item) => (
            <div
              key={item.key}
              className="absolute overflow-hidden"
              style={{
                top: item.top,
                left: item.left,
                width: item.width,
                height: item.height,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getThumbUrl(images[item.realIdx].url)}
                alt={
                  images[item.realIdx].original_filename ??
                  `Screensaver image ${item.realIdx + 1}`
                }
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                style={{ opacity: 0, transition: "opacity 0.5s ease" }}
                onLoad={(e) => {
                  (e.currentTarget as HTMLImageElement).style.opacity = "1";
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Ambient interaction hint */}
      <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 -translate-x-1/2">
        <p className="animate-pulse text-[10px] uppercase tracking-[0.35em] text-white/30">
          move or click to browse
        </p>
      </div>
    </div>
  );
}
