"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animatePageOut } from "@/animations";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = "queued" | "uploading" | "done" | "error";

interface FileUploadState {
  id: string;
  file: File;
  status: UploadStatus;
  error?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ACCEPTED_LABEL = "JPEG, PNG, WebP, GIF";
const CONCURRENCY = 3; // max parallel uploads

// ─── Concurrency helper ───────────────────────────────────────────────────────
// Runs `tasks` array with at most `limit` simultaneously.

async function runConcurrent(
  tasks: (() => Promise<void>)[],
  limit: number,
): Promise<void> {
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      await tasks[idx]();
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker),
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: UploadStatus }) {
  switch (status) {
    case "queued":
      return (
        <span className="badge badge-neutral badge-sm shrink-0">Queued</span>
      );
    case "uploading":
      return (
        <span className="badge badge-info badge-sm shrink-0 animate-pulse">
          Uploading…
        </span>
      );
    case "done":
      return (
        <span className="badge badge-success badge-sm shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-1 h-3 w-3"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Done
        </span>
      );
    case "error":
      return (
        <span className="badge badge-error badge-sm shrink-0">Failed</span>
      );
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UploadPage() {
  // Google Drive state (unchanged)
  const [inputValue, setInputValue] = useState("");
  const [buttonClicked, setButtonClicked] = useState(false);
  const [gdriveError, setGdriveError] = useState<string | null>(null);

  // Upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileStates, setFileStates] = useState<FileUploadState[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);
  const [batchStarted, setBatchStarted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ── File state helpers ──────────────────────────────────────────────────────

  function updateFile(id: string, update: Partial<FileUploadState>) {
    setFileStates((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...update } : f)),
    );
  }

  // ── Core upload logic (single file) ────────────────────────────────────────

  async function uploadFile(entry: FileUploadState) {
    updateFile(entry.id, { status: "uploading", error: undefined });

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated — please sign in.");

      // Namespace path by user ID to prevent collisions
      const path = `${user.id}/${Date.now()}_${entry.file.name}`;

      const { error: storageError } = await supabase.storage
        .from("gallery-images")
        .upload(path, entry.file, { upsert: false });

      if (storageError) throw new Error(storageError.message);

      const { error: dbError } = await supabase.from("images").insert({
        user_id: user.id,
        url: path,
        source: "upload",
        original_filename: entry.file.name,
      });

      if (dbError) throw new Error(dbError.message);

      updateFile(entry.id, { status: "done" });
    } catch (err) {
      updateFile(entry.id, {
        status: "error",
        error: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  // ── File processing: validate → enqueue → upload ────────────────────────────

  function processFiles(rawFiles: FileList | File[]) {
    const files = Array.from(rawFiles);
    const valid: FileUploadState[] = [];
    const rejected: string[] = [];

    for (const file of files) {
      if (ACCEPTED_TYPES.has(file.type)) {
        valid.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          status: "queued",
        });
      } else {
        rejected.push(file.name);
      }
    }

    setRejectedFiles(rejected);
    if (valid.length === 0) return;

    // Replace file list for a fresh batch; append if you want accumulation
    setFileStates(valid);
    setBatchStarted(true);

    // Fire concurrent uploads — each task captures its own entry snapshot
    const tasks = valid.map((entry) => () => uploadFile(entry));
    runConcurrent(tasks, CONCURRENCY);
  }

  // ── Drag & drop handlers ────────────────────────────────────────────────────

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Only clear if we actually left the zone (not just moved over a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const doneCount = fileStates.filter((f) => f.status === "done").length;
  const errorCount = fileStates.filter((f) => f.status === "error").length;
  const inFlightCount = fileStates.filter(
    (f) => f.status === "uploading" || f.status === "queued",
  ).length;
  const isAllSettled =
    batchStarted && inFlightCount === 0 && fileStates.length > 0;

  // ── Google Drive handler (unchanged) ────────────────────────────────────────

  function handleButtonClick() {
    setButtonClicked(true);
    setGdriveError(null);

    const parts = inputValue.split("/");
    const folderId = parts[parts.length - 1];

    fetch(`/api/fetch-images/${folderId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        animatePageOut("/preview", router);
      })
      .catch((err) => {
        console.error("Error fetching images:", err);
        setGdriveError(
          "Failed to import from Google Drive. Check the folder ID.",
        );
        setButtonClicked(false);
      });
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <main className="flex w-full justify-center px-4 py-16">
      <div className="flex w-full max-w-lg flex-col gap-8">
        {/* Hero heading */}
        <div>
          <h1 className="text-xl font-bold">Contact Studio</h1>
          <p className="mt-1 text-sm opacity-50">
            Upload photos or import from a Google Drive folder.
          </p>
        </div>

        {/* ── Drop Zone ─────────────────────────────────────────────────────── */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Image drop zone — click to browse or drag and drop files"
          className={[
            "relative flex cursor-pointer flex-col items-center justify-center gap-4",
            "rounded-2xl border-2 border-dashed p-12 text-center",
            "select-none outline-none transition-all duration-200",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            isDragOver
              ? "scale-[1.01] border-primary bg-primary/10 shadow-lg shadow-primary/20"
              : "border-base-300 hover:border-primary/50 hover:bg-base-200/40",
          ].join(" ")}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          {/* Icon */}
          <div
            className={[
              "flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200",
              isDragOver ? "scale-110 bg-primary/20" : "bg-base-200",
            ].join(" ")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-7 w-7 transition-colors duration-200 ${isDragOver ? "text-primary" : "opacity-40"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>

          {/* Text */}
          <div>
            <p className="font-semibold">
              {isDragOver ? "Release to upload" : "Drop images here"}
            </p>
            <p className="mt-1 text-sm opacity-50">
              or{" "}
              <span className="text-primary underline underline-offset-2">
                browse files
              </span>
              {" · "}
              {ACCEPTED_LABEL}
            </p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            id="file-upload"
            type="file"
            className="sr-only"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) processFiles(e.target.files);
              // Reset so the same file can be re-selected after a retry
              e.target.value = "";
            }}
          />
        </div>

        {/* ── Rejected file warning ──────────────────────────────────────────── */}
        {rejectedFiles.length > 0 && (
          <div className="alert alert-warning gap-3 py-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {rejectedFiles.length} file{rejectedFiles.length > 1 ? "s" : ""}{" "}
                skipped — unsupported format
              </p>
              <p className="mt-0.5 truncate text-xs opacity-70">
                {rejectedFiles.join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* ── Upload queue ───────────────────────────────────────────────────── */}
        {fileStates.length > 0 && (
          <div className="flex flex-col gap-2">
            {/* Summary banner (shown when all done) */}
            {isAllSettled && (
              <div
                className={`alert gap-3 py-3 ${
                  errorCount === 0 ? "alert-success" : "alert-warning"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {errorCount === 0 ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  )}
                </svg>
                <span className="text-sm font-medium">
                  {errorCount === 0
                    ? `${doneCount} of ${fileStates.length} uploaded successfully`
                    : `${doneCount} uploaded · ${errorCount} failed — use Retry below`}
                </span>
                {doneCount > 0 && (
                  <button
                    className="btn btn-ghost btn-sm ml-auto shrink-0"
                    onClick={() => animatePageOut("/preview", router)}
                  >
                    View gallery →
                  </button>
                )}
              </div>
            )}

            {/* Per-file list */}
            <div className="card overflow-hidden bg-base-200">
              <ul className="divide-y divide-base-300">
                {fileStates.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                    {/* Thumbnail / file icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-base-300 text-base-content/30">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0017.414 6L14 2.586A2 2 0 0012.586 2H6a2 2 0 00-2 2zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>

                    {/* Filename + optional error message */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {f.file.name}
                      </p>
                      {f.status === "error" && f.error && (
                        <p className="truncate text-xs text-error opacity-80">
                          {f.error}
                        </p>
                      )}
                    </div>

                    {/* File size */}
                    <span className="hidden shrink-0 font-mono text-xs opacity-40 sm:block">
                      {formatBytes(f.file.size)}
                    </span>

                    {/* Status badge */}
                    <StatusBadge status={f.status} />

                    {/* Retry button */}
                    {f.status === "error" && (
                      <button
                        className="btn btn-outline btn-error btn-xs shrink-0"
                        onClick={() => uploadFile(f)}
                      >
                        Retry
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── Divider ───────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 text-xs opacity-30">
          <div className="h-px flex-1 bg-current" />
          <span>or import from Google Drive</span>
          <div className="h-px flex-1 bg-current" />
        </div>

        {/* ── Google Drive import (unchanged logic) ─────────────────────────── */}
        {gdriveError && (
          <div className="alert alert-error py-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm">{gdriveError}</span>
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Google Drive folder ID or URL"
            className="input input-bordered flex-1"
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            className="btn btn-neutral"
            onClick={handleButtonClick}
            disabled={buttonClicked || !inputValue.trim()}
          >
            {buttonClicked ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "Import"
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
