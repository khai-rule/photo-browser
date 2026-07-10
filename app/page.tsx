"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { animatePageOut } from "@/animations";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [buttonClicked, setButtonClicked] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const router = useRouter();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUploadError("You must be signed in to upload images.");
        setIsUploading(false);
        return;
      }

      const uploads = Array.from(fileList).map(async (file) => {
        // Namespace by user ID to prevent collisions
        const path = `${user.id}/${Date.now()}_${file.name}`;

        const { error } = await supabase.storage
          .from("gallery-images")
          .upload(path, file, { upsert: false });

        if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);

        // Store the storage path (not a URL) — signed URLs are generated at read time
        const { error: insertError } = await supabase.from("images").insert({
          user_id: user.id,
          url: path,
          source: "upload",
          original_filename: file.name,
        });

        if (insertError) throw new Error(`DB insert failed: ${insertError.message}`);
      });

      await Promise.all(uploads);
      animatePageOut("/preview", router);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error ? error.message : "Upload failed. Please try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  function handleButtonClick() {
    setButtonClicked(true);
    setUploadError(null);

    const parts = inputValue.split("/");
    const folderId = parts[parts.length - 1];

    fetch(`/api/fetch-images/${folderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        // API now inserts directly to DB; just navigate on success
        animatePageOut("/preview", router);
      })
      .catch((error) => {
        console.error("Error fetching images:", error);
        setUploadError("Failed to import from Google Drive. Check the folder ID.");
        setButtonClicked(false);
      });
  }

  return (
    <main className="flex w-full justify-center">
      <div className="flex flex-col">
        <h1>Contact Studio</h1>
        <p>Upload images or type a folder ID to view images</p>

        {uploadError && (
          <div className="alert alert-error my-4 max-w-xs">
            <span>{uploadError}</span>
          </div>
        )}

        <div>
          <input
            type="file"
            className="file-input my-16 max-w-xs"
            onChange={handleFileChange}
            multiple
            disabled={isUploading}
          />
          {isUploading && (
            <span className="ml-4 text-sm opacity-60">Uploading…</span>
          )}
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Google Drive folder ID or URL"
            className="input input-bordered w-full max-w-xs"
            onChange={(event) => setInputValue(event.target.value)}
          />
          <button
            className="btn"
            onClick={handleButtonClick}
            disabled={buttonClicked || !inputValue.trim()}
          >
            Submit
          </button>
        </div>
      </div>
    </main>
  );
}
