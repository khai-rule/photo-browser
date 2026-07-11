/**
 * WCAG 2.1 contrast-ratio utilities.
 *
 * getCSSVarHex — reads a DaisyUI CSS custom property (e.g. '--p') and
 * converts it to a #rrggbb hex string. DaisyUI 4.x stores colors as raw
 * oklch channel triplets ("L% C H"), so we wrap the value in oklch() and
 * let the browser's Canvas 2D engine do the color-space conversion.
 */

/** Read a DaisyUI CSS var and return the sRGB hex color. */
export function getCSSVarHex(cssVar: string): string {
  if (typeof document === "undefined") return "#808080";

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();

  if (!raw) return "#808080";

  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#808080";

    // DaisyUI 4.x: raw = "47.5% 0.19 151.76" → wrap in oklch()
    ctx.fillStyle = `oklch(${raw})`;
    ctx.fillRect(0, 0, 1, 1);

    const pixels = ctx.getImageData(0, 0, 1, 1).data;
    const r = pixels[0], g = pixels[1], b = pixels[2], a = pixels[3];

    // If alpha is 0 the color wasn't parsed — try raw value as-is (HSL fallback)
    if (a === 0) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = raw;
      ctx.fillRect(0, 0, 1, 1);
      const p2 = ctx.getImageData(0, 0, 1, 1).data;
      return `#${p2[0].toString(16).padStart(2, "0")}${p2[1].toString(16).padStart(2, "0")}${p2[2].toString(16).padStart(2, "0")}`;
    }

    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch {
    return "#808080";
  }
}

/** Linearise a single 0–255 sRGB channel for luminance calculation. */
function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG 2.1 relative luminance of a #rrggbb hex color. */
export function relativeLuminance(hex: string): number {
  if (hex.length < 7) return 0;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/** WCAG 2.1 contrast ratio between two hex colors (result always ≥ 1). */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG 2.1 compliance level for normal text. */
export function wcagLevel(ratio: number): "AAA" | "AA" | "fail" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "fail";
}
