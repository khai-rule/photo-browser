"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────

const N_TRACKS = 4;
// Per-track speed multipliers. Columns scroll vertically; rows scroll horizontally.
// Alternating fast/slow creates the parallax depth illusion.
const SPEED_MULTS = [0.85, 1.15, 0.95, 1.25] as const;
const MAX_SPEED_MULT = 1.25; // fastest track — used for preload buffer sizing
const BASE_SPEED = 0.4;      // px per animation frame ≈ 24 px/s at 60 fps
const GAP = 6;               // px gap between cells

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImageItem {
  id: string;
  url: string;
  original_filename?: string | null;
  width?: number | null;
  height?: number | null;
}

interface ScreensaverGalleryProps {
  images: ImageItem[];
  /** Masonry: N vertical columns scrolling at different speeds.
   *  Justified: N horizontal rows scrolling sideways at different speeds. */
  layout: "masonry" | "justified";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a Supabase Image Transform thumbnail URL for supported buckets,
 * or the original URL as a graceful fallback for Drive / external images.
 *
 * mode "w"  → request by width (masonry columns)
 * mode "h"  → request by height (justified rows)
 */
function getThumbUrl(url: string, mode: "w" | "h"): string {
  if (url.includes("/storage/v1/")) {
    const sep = url.includes("?") ? "&" : "?";
    const params = mode === "w" ? "width=480&quality=60" : "height=260&quality=60";
    return `${url}${sep}${params}`;
  }
  return url;
}

/** Image aspect ratio (width / height). Falls back to `fallback` if unknown. */
function aspectRatio(img: ImageItem, fallback: number): number {
  return img.width && img.height && img.width > 0 && img.height > 0
    ? img.width / img.height
    : fallback;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ScreensaverGallery({ images, layout }: ScreensaverGalleryProps) {
  // ── DOM refs ────────────────────────────────────────────────────────────────
  const outerRef   = useRef<HTMLDivElement>(null);
  const trackRefs  = useRef<(HTMLDivElement | null)[]>(new Array(N_TRACKS).fill(null));

  // ── Scroll state (mutable, updated every RAF frame — never triggers re-renders)
  const offsetsRef = useRef<number[]>(new Array(N_TRACKS).fill(0));
  const rafIdRef   = useRef<number>(0);

  // ── Image decode preloading ─────────────────────────────────────────────────
  // Mutated imperatively inside preloadImage() — no React state involved.
  const decodedSet = useRef(new Set<string>());
  const imgElMap   = useRef(new Map<string, HTMLImageElement>());

  // ── Re-render trigger ───────────────────────────────────────────────────────
  // React re-renders happen only when a track's first-visible-item changes,
  // i.e. roughly every 10 s at default speed. The RAF runs continuously between
  // re-renders, applying transforms imperatively to the DOM.
  const prevFirstsRef = useRef<number[]>(new Array(N_TRACKS).fill(0));
  const [_renderTick, setRenderTick] = useState(0);

  // ── Container dimensions ────────────────────────────────────────────────────
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // ── ResizeObserver ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        setContainerSize({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Image decode preloader ──────────────────────────────────────────────────
  // Idempotent: the decodedSet guard prevents duplicate decode() calls.
  // Safe to call during render because it never triggers re-renders.
  function preloadImage(thumbUrl: string): void {
    if (decodedSet.current.has(thumbUrl)) return;
    const img = new window.Image();
    img.src = thumbUrl;
    img.decode()
      .catch(() => {})   // malformed / SVG — just show it anyway
      .finally(() => {
        decodedSet.current.add(thumbUrl);
        // Set opacity imperatively — avoids a React re-render for every image pop-in
        const el = imgElMap.current.get(thumbUrl);
        if (el) el.style.opacity = "1";
      });
  }

  // ── Masonry track data (N vertical columns) ─────────────────────────────────
  // Recomputed only when layout, container width, or images change.

  const masonryData = useMemo(() => {
    if (layout !== "masonry" || containerSize.width === 0 || images.length === 0) return null;
    const cellW = (containerSize.width - GAP * (N_TRACKS - 1)) / N_TRACKS;

    return Array.from({ length: N_TRACKS }, (_, t) => {
      // Round-robin distribution: track t gets images[t], images[t+4], images[t+8], …
      const imgs = images.filter((_, i) => i % N_TRACKS === t);
      const heights = imgs.map(img =>
        Math.max(60, Math.round(cellW / aspectRatio(img, 2 / 3))),
      );
      // Cumulative top positions for each item within this column
      const tops: number[] = [];
      let cum = 0;
      for (const h of heights) { tops.push(cum); cum += h + GAP; }
      return {
        imgs,
        heights,
        tops,
        loopH: cum,              // total height of one full cycle for this track
        cellW,
        left: t * (cellW + GAP),
      };
    });
  }, [layout, containerSize.width, images]);

  // ── Justified track data (N horizontal rows scrolling sideways) ─────────────
  // Each track is a full-width horizontal strip. Images are laid out side-by-side
  // at the same height, with widths proportional to each image's aspect ratio.
  // Different tracks scroll LEFT at different speeds, creating horizontal parallax.

  const justifiedData = useMemo(() => {
    if (
      layout !== "justified" ||
      containerSize.width === 0 ||
      containerSize.height === 0 ||
      images.length === 0
    ) return null;

    // Fill the viewport height with N rows, each separated by GAP
    const rowH = Math.floor((containerSize.height - GAP * (N_TRACKS - 1)) / N_TRACKS);

    return Array.from({ length: N_TRACKS }, (_, t) => {
      const imgs = images.filter((_, i) => i % N_TRACKS === t);
      const widths = imgs.map(img =>
        Math.max(40, Math.round(rowH * aspectRatio(img, 1.5))),
      );
      const lefts: number[] = [];
      let cum = 0;
      for (const w of widths) { lefts.push(cum); cum += w + GAP; }
      const loopW = cum;
      // Stagger start so each row shows different images immediately on mount
      const initOffset = Math.floor((t / N_TRACKS) * loopW);
      return {
        imgs,
        widths,
        lefts,
        loopW,
        rowH,
        rowTop: t * (rowH + GAP),
        initOffset,
      };
    });
  }, [layout, containerSize.width, containerSize.height, images]);

  // ── Reset offsets when track layout changes (resize or layout mode switch) ──
  useEffect(() => {
    if (justifiedData) {
      offsetsRef.current = justifiedData.map(jd => jd.initOffset);
    } else {
      offsetsRef.current = new Array(N_TRACKS).fill(0);
    }
    prevFirstsRef.current = new Array(N_TRACKS).fill(0);
  }, [masonryData, justifiedData]);

  // ── RAF auto-scroll loop ────────────────────────────────────────────────────
  // Each track's transform is updated every frame (GPU compositor, no layout/paint).
  // React state is only updated when a track's visible window shifts (~every 10 s).

  const startRAF = useCallback(() => {
    const isMasonry = layout === "masonry";
    const data = isMasonry ? masonryData : justifiedData;
    if (!data || containerSize.width === 0) return () => {};

    function tick() {
      let needsRerender = false;

      for (let t = 0; t < N_TRACKS; t++) {
        const speed = SPEED_MULTS[t] * BASE_SPEED;

        if (isMasonry) {
          const md = (data as NonNullable<typeof masonryData>)[t];
          offsetsRef.current[t] = (offsetsRef.current[t] + speed) % md.loopH;
          const el = trackRefs.current[t];
          if (el) el.style.transform = `translateY(${-offsetsRef.current[t]}px)`;

          // Compute first item in [offset - buffer, …] for re-render throttling
          const off = offsetsRef.current[t];
          const bufH = containerSize.height * MAX_SPEED_MULT;
          let newFirst = 0;
          for (let i = 0; i < md.tops.length - 1; i++) {
            if (md.tops[i + 1] >= off - bufH) { newFirst = i; break; }
          }
          if (newFirst !== prevFirstsRef.current[t]) {
            prevFirstsRef.current[t] = newFirst;
            needsRerender = true;
          }

        } else {
          const jd = (data as NonNullable<typeof justifiedData>)[t];
          offsetsRef.current[t] = (offsetsRef.current[t] + speed) % jd.loopW;
          const el = trackRefs.current[t];
          if (el) el.style.transform = `translateX(${-offsetsRef.current[t]}px)`;

          const off = offsetsRef.current[t];
          const bufW = containerSize.width * MAX_SPEED_MULT;
          let newFirst = 0;
          for (let i = 0; i < jd.lefts.length - 1; i++) {
            if (jd.lefts[i + 1] >= off - bufW) { newFirst = i; break; }
          }
          if (newFirst !== prevFirstsRef.current[t]) {
            prevFirstsRef.current[t] = newFirst;
            needsRerender = true;
          }
        }
      }

      if (needsRerender) setRenderTick(n => n + 1);
      rafIdRef.current = requestAnimationFrame(tick);
    }

    rafIdRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [layout, masonryData, justifiedData, containerSize]);

  useEffect(() => startRAF(), [startRAF]);

  // ── Visible items computation ───────────────────────────────────────────────
  // Called during render — reads offsetsRef (always current).
  // k ∈ {-1, 0, +1}: handles seamless loop transitions near the wrap point.
  //   k=0 → natural position
  //   k=+1 → one loopHeight ahead  (items entering from bottom/right)
  //   k=-1 → one loopHeight behind (items in buffer above/left near reset)

  function getMasonryVisible(t: number) {
    if (!masonryData) return [];
    const md = masonryData[t];
    const off    = offsetsRef.current[t];
    // Preload buffer = viewport × fastest speed multiplier
    const bufH   = containerSize.height * MAX_SPEED_MULT;
    const topEdge = off - bufH;
    const botEdge = off + containerSize.height + bufH;

    const out: { key: string; top: number; height: number; thumbUrl: string; alt: string }[] = [];

    for (let i = 0; i < md.imgs.length; i++) {
      const thumbUrl = getThumbUrl(md.imgs[i].url, "w");
      const alt      = md.imgs[i].original_filename ?? "Photo";
      preloadImage(thumbUrl); // idempotent — starts decode() if not yet done

      for (let k = -1; k <= 1; k++) {
        const top = md.tops[i] + k * md.loopH;
        if (top + md.heights[i] > topEdge && top < botEdge) {
          out.push({ key: `${k}_${i}`, top, height: md.heights[i], thumbUrl, alt });
        }
      }
    }
    return out;
  }

  function getJustifiedVisible(t: number) {
    if (!justifiedData) return [];
    const jd = justifiedData[t];
    const off      = offsetsRef.current[t];
    const bufW     = containerSize.width * MAX_SPEED_MULT;
    const leftEdge  = off - bufW;
    const rightEdge = off + containerSize.width + bufW;

    const out: { key: string; left: number; width: number; thumbUrl: string; alt: string }[] = [];

    for (let i = 0; i < jd.imgs.length; i++) {
      const thumbUrl = getThumbUrl(jd.imgs[i].url, "h");
      const alt      = jd.imgs[i].original_filename ?? "Photo";
      preloadImage(thumbUrl);

      for (let k = -1; k <= 1; k++) {
        const left = jd.lefts[i] + k * jd.loopW;
        if (left + jd.widths[i] > leftEdge && left < rightEdge) {
          out.push({ key: `${k}_${i}`, left, width: jd.widths[i], thumbUrl, alt });
        }
      }
    }
    return out;
  }

  // ── Image element render helper ─────────────────────────────────────────────
  // Starts decode() as a side effect (idempotent, no re-render).
  // Sets initial opacity based on whether the image is already decoded.

  function renderImg(thumbUrl: string, alt: string) {
    const decoded = decodedSet.current.has(thumbUrl);
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={el => {
          if (el) imgElMap.current.set(thumbUrl, el);
          else imgElMap.current.delete(thumbUrl);
        }}
        src={thumbUrl}
        alt={alt}
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
        style={{ opacity: decoded ? 1 : 0, transition: "opacity 0.15s ease" }}
      />
    );
  }

  if (images.length === 0) return null;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={outerRef}
      className="absolute inset-0 overflow-hidden bg-base-100"
      aria-hidden="true"
    >
      {/* Vignette overlays — direction matches the scroll axis */}
      {layout === "masonry" ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-32 bg-gradient-to-b from-base-100/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-base-100/70 to-transparent" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0  z-10 w-24 bg-gradient-to-r from-base-100/70 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-base-100/70 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0    z-10 h-12 bg-gradient-to-b from-base-100/50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-base-100/50 to-transparent" />
        </>
      )}

      {/* ── Masonry: N_TRACKS vertical columns, each scrolling DOWN at its own speed */}
      {layout === "masonry" && masonryData?.map((md, t) => (
        <div
          key={t}
          className="absolute top-0 bottom-0 overflow-hidden"
          style={{ left: md.left, width: md.cellW }}
        >
          {/* GPU scroll track: will-change-transform promotes to compositor layer */}
          <div
            ref={el => { trackRefs.current[t] = el; }}
            className="absolute top-0 left-0 right-0 will-change-transform"
            style={{ transform: "translateY(0)" }}
          >
            {/* height:1 prevents creating a document scroll area;
                items are positioned absolutely relative to this node */}
            <div className="relative" style={{ width: md.cellW, height: 1 }}>
              {getMasonryVisible(t).map(item => (
                <div
                  key={item.key}
                  className="absolute inset-x-0 overflow-hidden"
                  style={{ top: item.top, height: item.height }}
                >
                  {renderImg(item.thumbUrl, item.alt)}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* ── Justified: N_TRACKS horizontal rows, each scrolling LEFT at its own speed */}
      {layout === "justified" && justifiedData?.map((jd, t) => (
        <div
          key={t}
          className="absolute left-0 right-0 overflow-hidden"
          style={{ top: jd.rowTop, height: jd.rowH }}
        >
          <div
            ref={el => { trackRefs.current[t] = el; }}
            className="absolute top-0 left-0 will-change-transform"
            style={{ height: jd.rowH, transform: "translateX(0)" }}
          >
            {/* width:1 to avoid influencing layout; items are absolute */}
            <div className="relative" style={{ height: jd.rowH, width: 1 }}>
              {getJustifiedVisible(t).map(item => (
                <div
                  key={item.key}
                  className="absolute top-0 overflow-hidden"
                  style={{ left: item.left, width: item.width, height: "100%" }}
                >
                  {renderImg(item.thumbUrl, item.alt)}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Ambient interaction hint */}
      <div className="pointer-events-none absolute bottom-28 left-1/2 z-20 -translate-x-1/2">
        <p className="animate-pulse text-[10px] uppercase tracking-[0.35em] text-white/30">
          move or click to browse
        </p>
      </div>
    </div>
  );
}
