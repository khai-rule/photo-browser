import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: number } },
) {
  try {
    const drive = google.drive({
      version: "v3",
      auth: process.env.GOOGLE_DRIVE_API as string,
    });

    const folderId = params.id;

    const driveResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='image/jpeg'`,
      fields: "files(id, name)",
      pageSize: 50,
    });

    const files = driveResponse.data.files;

    (files as Array<{ id: string; name: string }>).forEach((file) => {
      const fileId = file.id;
      const fileName = file.name;
      console.log(`File ID: ${fileId}, File Name: ${fileName}`);
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching images:", error);
    return NextResponse.json(
      { message: "Failed to fetch images" },
      { status: 500 },
    );
  }
}
