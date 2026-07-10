import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GalleryClient from "./GalleryClient";

/**
 * Preview page — Server Component.
 *
 * Fetches the authenticated user's images from Supabase, resolves
 * signed URLs for uploaded files (private bucket), then hands the
 * plain URL array off to GalleryClient for client-side rendering.
 */
export default async function PreviewPage() {
  const supabase = await createClient();

  // Verify authentication server-side (middleware also guards this route,
  // but we double-check here for defence in depth)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // ── Fetch all image rows for this user ──────────────────────────────────
  const { data: rows, error } = await supabase
    .from("images")
    .select("url, source")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch images:", error);
  }

  const imageRows = rows ?? [];

  // ── Resolve URLs ────────────────────────────────────────────────────────
  // Uploaded images: `url` stores the storage path → generate a 1-hour signed URL.
  // GDrive images:   `url` stores the full thumbnail URL → use as-is.
  const resolvedUrls = await Promise.all(
    imageRows.map(async (row) => {
      if (row.source === "upload") {
        const { data } = await supabase.storage
          .from("gallery-images")
          .createSignedUrl(row.url, 3600); // 1 hour
        return data?.signedUrl ?? null;
      }
      return row.url;
    }),
  );

  // Filter out any nulls (failed signed URL generation) and shuffle once
  const validUrls = resolvedUrls.filter((url): url is string => url !== null);
  const shuffled = [...validUrls].sort(() => Math.random() - 0.5);

  return <GalleryClient initialImages={shuffled} />;
}
