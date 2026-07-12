"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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
      <section className="w-full bg-base-200/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center text-3xl font-bold sm:text-4xl"
          >
            Everything you need to display your photography
          </motion.h2>

          <motion.div
            className="grid gap-8 sm:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Feature 1 */}
            <motion.div
              variants={itemVariants}
              className="rounded-lg border border-base-300 bg-base-100 p-8 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">
                Upload from your computer
              </h3>
              <p className="text-base-content/70">
                Drag and drop or browse files. Supports JPEG, PNG, WebP, and GIF
                formats for quick imports.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              variants={itemVariants}
              className="rounded-lg border border-base-300 bg-base-100 p-8 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">
                Import from Google Drive
              </h3>
              <p className="text-base-content/70">
                Connect to a Google Drive folder and pull in your photos
                directly. Perfect for cloud-backed collections.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              variants={itemVariants}
              className="rounded-lg border border-base-300 bg-base-100 p-8 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 5a2 2 0 012-2h6a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">
                Multiple gallery layouts
              </h3>
              <p className="text-base-content/70">
                Switch between masonry and justified rows. Find the view that
                best showcases your work.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              variants={itemVariants}
              className="rounded-lg border border-base-300 bg-base-100 p-8 shadow-sm"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Organize into albums</h3>
              <p className="text-base-content/70">
                Create albums to group your photos by theme, event, or
                collection. Browse your library with ease.
              </p>
            </motion.div>

            {/* Feature 5 - wide */}
            <motion.div
              variants={itemVariants}
              className="rounded-lg border border-base-300 bg-base-100 p-8 shadow-sm sm:col-span-2"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5h.01"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">
                Ambient screensaver mode
              </h3>
              <p className="text-base-content/70">
                Idle too long? Your gallery auto-scrolls with a gentle, passive
                browsing experience. Perfect for passive viewing or displaying
                on a device.
              </p>
            </motion.div>
          </motion.div>
        </div>
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
