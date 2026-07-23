import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // ── 1. Authenticate the current user ──────────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. List files from Google Drive ───────────────────────────────────
    const drive = google.drive({
      version: "v3",
      auth: process.env.GOOGLE_DRIVE_API as string,
    });

    const folderId = params.id;

    const driveResponse = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType='image/jpeg' or mimeType='image/png' or mimeType='image/webp' or mimeType='image/gif')`,
      fields: "files(id, name, imageMediaMetadata(width,height))",
      pageSize: 50,
    });

    const files = driveResponse.data.files as Array<{
      id: string;
      name: string;
      imageMediaMetadata?: { width?: number; height?: number } | null;
    }>;

    if (!files || files.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    // ── 3. Build thumbnail URLs ───────────────────────────────────────────
    const rows = files.map((file) => ({
      user_id: user.id,
      url: `https://drive.google.com/thumbnail?id=${file.id}&sz=w1000`,
      source: "gdrive" as const,
      original_filename: file.name,
      // imageMediaMetadata is populated by Drive for JPEG/PNG/WebP; may be null for GIF
      width:  file.imageMediaMetadata?.width  ?? null,
      height: file.imageMediaMetadata?.height ?? null,
    }));

    // ── 4. Bulk insert into the images table ─────────────────────────────
    const { error: insertError } = await supabase.from("images").insert(rows);

    if (insertError) {
      console.error("DB insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to save images to database" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 },
    );
  }
}
