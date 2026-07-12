"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { JetBrains_Mono, Playfair_Display } from "next/font/google";

// ─── Placeholder images from Picsum Photos ────────────────────────────────────

const SAMPLE_IMAGES = [
  "https://picsum.photos/300/400?random=1",
  "https://picsum.photos/400/300?random=2",
  "https://picsum.photos/350/350?random=3",
  "https://picsum.photos/300/500?random=4",
  "https://picsum.photos/500/300?random=5",
  "https://picsum.photos/320/480?random=6",
  "https://picsum.photos/400/400?random=7",
  "https://picsum.photos/280/420?random=8",
];

const serifFont = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
});

const darkroomTheme = {
  "--darkroom-bg": "#14110E",
  "--darkroom-accent": "#C6472A",
  "--darkroom-text": "#F2EDE4",
  "--darkroom-struct": "#8C877D",
} as const;

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const featureFrames = [
  {
    number: "01",
    title: "Upload from your computer",
    description:
      "Drag files in from your desktop or browse locally when you want a fast, direct import.",
    image: SAMPLE_IMAGES[0],
    crop: "M18 32C14 15 28 6 49 6c23 0 37 9 41 24 4 16-4 31-20 38-16 7-37 6-48-5-6-5-7-15-4-31Z",
  },
  {
    number: "02",
    title: "Import from Google Drive",
    description:
      "Pull images straight from Drive to keep cloud-backed shoots and archives moving smoothly.",
    image: SAMPLE_IMAGES[1],
    crop: "M16 30C18 14 32 6 50 6c21 0 37 10 41 25 4 16-3 32-18 39-17 8-38 6-50-4-7-5-10-15-7-36Z",
  },
  {
    number: "03",
    title: "Switch gallery layouts",
    description:
      "Move between masonry and justified rows to match the rhythm of the images on screen.",
    image: SAMPLE_IMAGES[2],
    crop: "M20 29C22 14 36 5 53 6c22 1 36 12 39 28 3 17-6 31-21 37-16 7-37 4-48-8-7-7-7-17-3-34Z",
  },
  {
    number: "04",
    title: "Organize into albums",
    description:
      "Group images into albums so a library can move from loose collection to edited sequence.",
    image: SAMPLE_IMAGES[3],
    crop: "M17 33C15 16 28 7 49 6c22-1 39 8 43 24 4 16-2 33-16 40-15 8-38 9-51 0-10-7-13-16-8-37Z",
  },
  {
    number: "05",
    title: "Ambient screensaver mode",
    description:
      "Let the gallery drift on its own for passive browsing when the screen should feel alive.",
    image: SAMPLE_IMAGES[4],
    crop: "M19 31C17 16 31 7 50 6c22-1 37 9 41 25 4 17-5 33-20 39-17 7-37 4-48-7-7-8-9-16-4-32Z",
  },
];

function buildSprocketPattern(direction: "horizontal" | "vertical") {
  const svg =
    direction === "horizontal"
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="14" viewBox="0 0 72 14" fill="none"><rect x="6" y="2" width="14" height="10" rx="3" fill="#8C877D" fill-opacity="0.55"/><rect x="34" y="2" width="14" height="10" rx="3" fill="#8C877D" fill-opacity="0.55"/><rect x="62" y="2" width="14" height="10" rx="3" fill="#8C877D" fill-opacity="0.55"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="72" viewBox="0 0 14 72" fill="none"><rect x="2" y="6" width="10" height="14" rx="3" fill="#8C877D" fill-opacity="0.55"/><rect x="2" y="34" width="10" height="14" rx="3" fill="#8C877D" fill-opacity="0.55"/><rect x="2" y="62" width="10" height="14" rx="3" fill="#8C877D" fill-opacity="0.55"/></svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function FeatureFrame({
  feature,
  index,
  reducedMotion,
}: {
  feature: (typeof featureFrames)[number];
  index: number;
  reducedMotion: boolean;
}) {
  return (
    <motion.article
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`border-[color:var(--darkroom-struct)]/25 group relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border bg-[rgba(24,19,16,0.96)] shadow-[0_28px_60px_rgba(0,0,0,0.35)] ${index % 2 === 0 ? "md:-translate-y-2" : "md:translate-y-2"}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-[linear-gradient(90deg,transparent_0,transparent_12px,rgba(140,135,125,0.62)_12px,rgba(140,135,125,0.62)_22px,transparent_22px)] [background-size:34px_100%]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-[linear-gradient(90deg,transparent_0,transparent_12px,rgba(140,135,125,0.62)_12px,rgba(140,135,125,0.62)_22px,transparent_22px)] [background-size:34px_100%]" />

      <div className="relative p-3 sm:p-4">
        <div className="relative overflow-hidden rounded-[1.2rem] border border-white/5 bg-black/30">
          <div className="relative aspect-[4/5] w-full md:aspect-[4/5]">
            <Image
              src={feature.image}
              alt={feature.title}
              fill
              unoptimized
              sizes="(min-width: 768px) 20vw, 100vw"
              className="object-cover opacity-90 transition duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,17,14,0.05)_0%,rgba(20,17,14,0.24)_60%,rgba(20,17,14,0.66)_100%)]" />

            {!reducedMotion ? (
              <motion.svg
                viewBox="0 0 110 82"
                className="absolute left-1/2 top-1/2 h-24 w-32 -translate-x-1/2 -translate-y-1/2 overflow-visible text-[color:var(--darkroom-accent)] sm:h-28 sm:w-36"
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.3 }}
                aria-hidden="true"
              >
                <motion.path
                  d={feature.crop}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="1 8"
                  pathLength={0}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                />
              </motion.svg>
            ) : (
              <div
                aria-hidden="true"
                className="border-[color:var(--darkroom-accent)]/70 absolute inset-6 rounded-[50%] border"
              />
            )}
          </div>
        </div>

        <div className="space-y-3 px-1 pb-1 pt-4 sm:px-2">
          <div
            className={`text-[0.7rem] uppercase tracking-[0.3em] text-[color:var(--darkroom-accent)] ${monoFont.className}`}
          >
            Frame {feature.number}
          </div>
          <h3
            className={`${serifFont.className} text-xl leading-tight text-[color:var(--darkroom-text)] sm:text-[1.35rem]`}
          >
            {feature.title}
          </h3>
          <p className="text-[color:var(--darkroom-text)]/78 text-sm leading-6">
            {feature.description}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Components ────────────────────────────────────────────────────────────────

function GalleryPreview({ layout }: { layout: "masonry" | "justified" }) {
  // Simplified gallery preview with sample images
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg bg-base-200">
      {layout === "masonry" ? (
        <div className="columns-3 gap-2 p-3">
          {SAMPLE_IMAGES.map((src, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="mb-2 break-inside-avoid overflow-hidden rounded"
            >
              <Image
                src={src}
                alt={`Sample ${idx}`}
                width={100}
                height={120}
                unoptimized
                className="h-auto w-full object-cover"
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex h-full items-center gap-2 overflow-x-auto p-3">
          {SAMPLE_IMAGES.slice(0, 4).map((src, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="h-full flex-shrink-0"
            >
              <Image
                src={src}
                alt={`Sample ${idx}`}
                width={150}
                height={150}
                unoptimized
                className="h-full w-auto rounded object-cover"
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [layoutMode, setLayoutMode] = useState<"masonry" | "justified">(
    "masonry",
  );
  const reducedMotion = useReducedMotion();
  const filmStripRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: filmStripRef,
    offset: ["start end", "end start"],
  });

  const frameParallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? [0, 0] : [18, -18],
  );
  const sprocketParallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    reducedMotion ? [0, 0] : [10, -10],
  );

  // Check authentication and redirect if logged in
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setIsAuthenticated(true);
        // Redirect to library after a brief delay for smooth transition
        setTimeout(() => router.push("/library"), 100);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Handle Google OAuth sign in
  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false,
      },
    });
  }

  // Show nothing while checking auth
  if (isLoading || isAuthenticated) {
    return null;
  }

  return (
    <main className="flex min-h-screen w-full flex-col bg-base-100 text-base-content">
      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen w-full items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(242,237,228,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(242,237,228,0.9) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        <motion.div
          className="flex w-full max-w-3xl flex-col items-center gap-12 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Title */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight sm:text-6xl lg:text-7xl">
              Contact Studio
            </h1>
            <p className="max-w-2xl text-xl text-base-content/70 sm:text-2xl">
              Your photos, always on display
            </p>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="max-w-xl text-base text-base-content/60 sm:text-lg"
          >
            Organize your favorite moments into albums, explore multiple gallery
            layouts, and enjoy a beautiful ambient viewing experience. Your
            photography, reimagined.
          </motion.p>

          {/* CTA Button */}
          <motion.button
            variants={itemVariants}
            onClick={handleGoogleSignIn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary btn-lg gap-3 px-8 text-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </motion.button>

          {/* Preview snippet */}
          <motion.div variants={itemVariants} className="w-full max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-wide text-base-content/60">
              Browse multiple layouts
            </p>
            <div className="mb-4 flex justify-center gap-2">
              <button
                onClick={() => setLayoutMode("masonry")}
                className={`btn btn-sm gap-1 ${
                  layoutMode === "masonry" ? "btn-primary" : "btn-ghost"
                }`}
              >
                Masonry
              </button>
              <button
                onClick={() => setLayoutMode("justified")}
                className={`btn btn-sm gap-1 ${
                  layoutMode === "justified" ? "btn-primary" : "btn-ghost"
                }`}
              >
                Justified rows
              </button>
            </div>
            <GalleryPreview layout={layoutMode} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features Section ─────────────────────────────────────────────────── */}
      <section
        ref={filmStripRef}
        className="border-[color:var(--darkroom-struct)]/20 relative overflow-hidden border-y bg-[color:var(--darkroom-bg)] px-4 py-20 text-[color:var(--darkroom-text)] sm:px-6 lg:px-8"
        style={darkroomTheme as any}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{ y: reducedMotion ? 0 : sprocketParallaxY }}
        >
          <div
            className="absolute inset-x-0 top-0 hidden h-4 md:block"
            style={{
              backgroundImage: buildSprocketPattern("horizontal"),
              backgroundRepeat: "repeat-x",
              backgroundSize: "72px 14px",
            }}
          />
          <div
            className="absolute inset-x-0 bottom-0 hidden h-4 md:block"
            style={{
              backgroundImage: buildSprocketPattern("horizontal"),
              backgroundRepeat: "repeat-x",
              backgroundSize: "72px 14px",
            }}
          />
          <div
            className="absolute inset-y-0 left-0 w-4 md:hidden"
            style={{
              backgroundImage: buildSprocketPattern("vertical"),
              backgroundRepeat: "repeat-y",
              backgroundSize: "14px 72px",
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-4 md:hidden"
            style={{
              backgroundImage: buildSprocketPattern("vertical"),
              backgroundRepeat: "repeat-y",
              backgroundSize: "14px 72px",
            }}
          />
        </motion.div>

        <motion.div
          className="relative mx-auto max-w-6xl"
          style={{ y: reducedMotion ? 0 : frameParallaxY }}
        >
          <div className="mx-auto max-w-2xl text-center">
            <p
              className={`${monoFont.className} mb-4 text-xs uppercase tracking-[0.38em] text-[color:var(--darkroom-accent)]`}
            >
              Contact sheet / darkroom cut
            </p>
            <h2
              className={`${serifFont.className} text-3xl leading-tight sm:text-4xl lg:text-5xl`}
            >
              Every feature as a frame on the strip
            </h2>
            <p className="text-[color:var(--darkroom-text)]/74 mx-auto mt-4 max-w-xl text-sm leading-7 sm:text-base">
              A contact-sheet style layout with numbered frames, hand-marked
              picks, and a slow drift that feels closer to a light table than a
              product grid.
            </p>
          </div>

          <div className="border-[color:var(--darkroom-struct)]/18 relative mt-12 rounded-[2rem] border bg-[rgba(10,8,7,0.36)] p-4 shadow-[0_35px_90px_rgba(0,0,0,0.45)] sm:p-5 lg:p-6">
            <div className="relative flex flex-col gap-5 md:flex-row md:gap-4">
              {featureFrames.map((feature, index) => (
                <FeatureFrame
                  key={feature.number}
                  feature={feature}
                  index={index}
                  reducedMotion={reducedMotion ?? false}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────────── */}
      <section className="w-full px-4 py-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mb-8 text-lg text-base-content/70">
            Sign in with Google to create your gallery and start sharing your
            photography.
          </p>
          <motion.button
            onClick={handleGoogleSignIn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary btn-lg gap-3 px-8 text-lg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-base-300 px-4 py-8 text-center text-sm text-base-content/60 sm:px-6 lg:px-8">
        <p>&copy; 2025 Contact Studio. A personal photo gallery app.</p>
      </footer>
    </main>
  );
}
