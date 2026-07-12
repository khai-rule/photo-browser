"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

interface Album {
  id: string;
  name: string;
  created_at: string;
}

interface LibraryImage {
  id: string;
  /** Display URL — signed (for uploads) or raw (for gdrive) */
  url: string;
  /** Raw value stored in DB; needed to delete from Storage */
  rawPath: string;
  source: "upload" | "gdrive";
  original_filename?: string | null;
  created_at?: string | null;
  album_id?: string | null;
}

interface LibraryClientProps {
  initialAlbums: Album[];
}

// ── Small icon helpers ────────────────────────────────────────────────────────

function IconFolder({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

function IconImages({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function IconPencil({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function IconTrash({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconCheck({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LibraryClient({ initialAlbums }: LibraryClientProps) {
  // ── Albums state ─────────────────────────────────────────────────────────
  const [albums, setAlbums] = useState<Album[]>(initialAlbums);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [renamingAlbumId, setRenamingAlbumId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // ── Images state ─────────────────────────────────────────────────────────
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [albumCounts, setAlbumCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filter + selection ────────────────────────────────────────────────────
  const [selectedAlbumId, setSelectedAlbumId] = useState<"all" | string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [assignAlbumId, setAssignAlbumId] = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [actionError, setActionError] = useState<string | null>(null);

  const renameInputRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchImages = useCallback(async (albumFilter: "all" | string) => {
    setIsLoading(true);
    setActionError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // ── Lightweight count query (no URL resolution needed) ──────────────
      const { data: allRefs } = await supabase
        .from("images")
        .select("id, album_id")
        .eq("user_id", user.id);

      if (allRefs) {
        setTotalCount(allRefs.length);
        const counts: Record<string, number> = {};
        allRefs.forEach((r) => {
          if (r.album_id) {
            counts[r.album_id] = (counts[r.album_id] ?? 0) + 1;
          }
        });
        setAlbumCounts(counts);
      }

      // ── Full image query for the current filter ─────────────────────────
      let query = supabase
        .from("images")
        .select("id, url, source, original_filename, created_at, album_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (albumFilter !== "all") {
        query = query.eq("album_id", albumFilter);
      }

      const { data: rows, error } = await query;
      if (error || !rows) return;

      // ── Resolve display URLs ────────────────────────────────────────────
      // Upload sources store a storage path; we create a 1-hour signed URL.
      // GDrive sources already have a full URL.
      const resolved = await Promise.all(
        rows.map(async (row) => {
          let displayUrl = row.url;
          if (row.source === "upload") {
            const { data } = await supabase.storage
              .from("gallery-images")
              .createSignedUrl(row.url, 3600);
            displayUrl = data?.signedUrl ?? row.url;
          }
          return {
            id: row.id as string,
            url: displayUrl,
            rawPath: row.url as string,
            source: row.source as "upload" | "gdrive",
            original_filename: row.original_filename,
            created_at: row.created_at,
            album_id: row.album_id,
          };
        }),
      );

      setImages(resolved);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Re-fetch whenever the active album filter changes
  useEffect(() => {
    fetchImages(selectedAlbumId);
  }, [selectedAlbumId, fetchImages]);

  // Focus rename input when it appears
  useEffect(() => {
    if (renamingAlbumId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingAlbumId]);

  // ── Album CRUD ────────────────────────────────────────────────────────────

  async function createAlbum() {
    const name = newAlbumName.trim();
    if (!name) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("albums")
      .insert({ name, user_id: user.id })
      .select("id, name, created_at")
      .single();

    if (error || !data) {
      setActionError("Failed to create album.");
      return;
    }

    setAlbums((prev) => [data as Album, ...prev]);
    setNewAlbumName("");
  }

  async function commitRename(id: string, name: string) {
    const trimmed = name.trim();
    setRenamingAlbumId(null);
    if (!trimmed) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("albums")
      .update({ name: trimmed })
      .eq("id", id);

    if (error) {
      setActionError("Failed to rename album.");
      return;
    }

    setAlbums((prev) =>
      prev.map((a) => (a.id === id ? { ...a, name: trimmed } : a)),
    );
  }

  async function deleteAlbum(id: string) {
    if (!confirm("Delete this album? Images won't be deleted.")) return;

    const supabase = createClient();
    const { error } = await supabase.from("albums").delete().eq("id", id);

    if (error) {
      setActionError("Failed to delete album.");
      return;
    }

    setAlbums((prev) => prev.filter((a) => a.id !== id));

    // If we were viewing the deleted album, fall back to All Images
    const newFilter = selectedAlbumId === id ? "all" : selectedAlbumId;
    if (selectedAlbumId === id) setSelectedAlbumId("all");
    fetchImages(newFilter);
  }

  // ── Image actions ─────────────────────────────────────────────────────────

  async function assignToAlbum(imageIds: Set<string>, albumId: string) {
    if (!albumId) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("images")
      .update({ album_id: albumId })
      .in("id", Array.from(imageIds));

    if (error) {
      setActionError("Failed to assign images to album.");
      return;
    }

    setSelectedIds(new Set());
    setAssignAlbumId("");
    fetchImages(selectedAlbumId);
  }

  async function removeFromAlbum(imageIds: Set<string>) {
    const supabase = createClient();
    const { error } = await supabase
      .from("images")
      .update({ album_id: null })
      .in("id", Array.from(imageIds));

    if (error) {
      setActionError("Failed to remove images from album.");
      return;
    }

    setSelectedIds(new Set());
    fetchImages(selectedAlbumId);
  }

  async function deleteImages(imageIds: Set<string>) {
    if (!confirm(`Delete ${imageIds.size} image${imageIds.size > 1 ? "s" : ""}? This cannot be undone.`)) return;

    const supabase = createClient();

    // Find storage paths for upload-source images (to clean up the bucket)
    const toDelete = images.filter((img) => imageIds.has(img.id));
    const uploadPaths = toDelete
      .filter((img) => img.source === "upload")
      .map((img) => img.rawPath);

    if (uploadPaths.length > 0) {
      // Best-effort — don't block DB delete if storage delete partially fails
      await supabase.storage.from("gallery-images").remove(uploadPaths);
    }

    const { error } = await supabase
      .from("images")
      .delete()
      .in("id", Array.from(imageIds));

    if (error) {
      setActionError("Failed to delete images.");
      return;
    }

    // Optimistically remove from local list and refresh counts
    setImages((prev) => prev.filter((img) => !imageIds.has(img.id)));
    setSelectedIds(new Set());
    fetchImages(selectedAlbumId);
  }

  // ── Selection helpers ─────────────────────────────────────────────────────

  function toggleImage(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(images.map((img) => img.id)));
  }

  function deselectAll() {
    setSelectedIds(new Set());
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentAlbum = albums.find((a) => a.id === selectedAlbumId);
  const hasSelection = selectedIds.size > 0;
  const isAlbumFilter = selectedAlbumId !== "all";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-24 pb-40">

      {/* Error banner */}
      {actionError && (
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl bg-error/10 px-4 py-3 text-sm text-error lg:mx-8">
          <span className="flex-1">{actionError}</span>
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setActionError(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-0">

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside className="shrink-0 px-4 lg:w-60 lg:px-6 xl:w-72">
          <div className="lg:sticky lg:top-28">

            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest opacity-40">
              Library
            </h2>

            {/* All Images row */}
            <button
              onClick={() => {
                setSelectedAlbumId("all");
                setSelectedIds(new Set());
              }}
              className={[
                "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium",
                "transition-colors duration-150",
                selectedAlbumId === "all"
                  ? "bg-primary text-primary-content"
                  : "hover:bg-base-200",
              ].join(" ")}
            >
              <span className="flex items-center gap-2.5">
                <IconImages className="h-4 w-4 opacity-70" />
                All Images
              </span>
              <span className={`badge badge-sm ${selectedAlbumId === "all" ? "bg-white/20 text-inherit border-0" : "badge-neutral"}`}>
                {totalCount}
              </span>
            </button>

            {/* Album list */}
            {albums.length > 0 && (
              <div className="mt-1 flex flex-col gap-0.5">
                {albums.map((album) => {
                  const isActive = selectedAlbumId === album.id;
                  const isRenaming = renamingAlbumId === album.id;
                  return (
                    <div
                      key={album.id}
                      className={[
                        "group flex items-center rounded-xl px-3 py-2.5 transition-colors duration-150",
                        isActive ? "bg-primary text-primary-content" : "hover:bg-base-200",
                      ].join(" ")}
                    >
                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          className="input input-xs flex-1 border-current bg-transparent"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(album.id, renameValue);
                            if (e.key === "Escape") setRenamingAlbumId(null);
                          }}
                          onBlur={() => commitRename(album.id, renameValue)}
                        />
                      ) : (
                        <button
                          className="flex min-w-0 flex-1 items-center gap-2.5 text-left text-sm font-medium"
                          onClick={() => {
                            setSelectedAlbumId(album.id);
                            setSelectedIds(new Set());
                          }}
                        >
                          <IconFolder className="h-4 w-4 shrink-0 opacity-70" />
                          <span className="truncate">{album.name}</span>
                          <span className={`badge badge-sm ml-auto shrink-0 ${isActive ? "bg-white/20 text-inherit border-0" : "badge-neutral"}`}>
                            {albumCounts[album.id] ?? 0}
                          </span>
                        </button>
                      )}

                      {/* Rename / delete controls — revealed on hover */}
                      {!isRenaming && (
                        <div className="flex shrink-0 items-center gap-0.5 ml-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            aria-label={`Rename ${album.name}`}
                            className={`btn btn-ghost btn-xs px-1 ${isActive ? "text-primary-content hover:bg-white/20" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingAlbumId(album.id);
                              setRenameValue(album.name);
                            }}
                          >
                            <IconPencil />
                          </button>
                          <button
                            aria-label={`Delete ${album.name}`}
                            className={`btn btn-ghost btn-xs px-1 ${isActive ? "text-primary-content hover:bg-white/20" : "text-error hover:text-error"}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAlbum(album.id);
                            }}
                          >
                            <IconTrash />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Divider + new album input */}
            <div className="mt-4 border-t border-base-300 pt-4">
              <div className="flex gap-2">
                <input
                  id="new-album-input"
                  type="text"
                  placeholder="New album name…"
                  className="input input-sm input-bordered flex-1 text-sm"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createAlbum();
                  }}
                />
                <button
                  className="btn btn-sm btn-primary"
                  disabled={!newAlbumName.trim()}
                  onClick={createAlbum}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <main className="min-w-0 flex-1 px-4 lg:px-6">

          {/* Page header */}
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="flex-1">
              <h1 className="text-lg font-semibold">
                {currentAlbum ? currentAlbum.name : "All Images"}
              </h1>
              <p className="mt-0.5 text-xs opacity-40">
                {isLoading ? "Loading…" : `${images.length} ${images.length === 1 ? "image" : "images"}`}
              </p>
            </div>

            {/* Select / deselect all */}
            {!isLoading && images.length > 0 && (
              hasSelection ? (
                <button className="btn btn-ghost btn-sm" onClick={deselectAll}>
                  Deselect all
                </button>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={selectAll}>
                  Select all
                </button>
              )
            )}
          </div>

          {/* Bulk action bar (shown when any image is selected) */}
          {hasSelection && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-base-200 px-4 py-3">
              <span className="text-sm font-semibold">
                {selectedIds.size} selected
              </span>

              {/* Add to album */}
              <div className="flex items-center gap-2">
                <select
                  className="select select-sm select-bordered"
                  value={assignAlbumId}
                  onChange={(e) => setAssignAlbumId(e.target.value)}
                  aria-label="Choose album to assign to"
                >
                  <option value="">Add to album…</option>
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-sm btn-neutral"
                  disabled={!assignAlbumId}
                  onClick={() => assignToAlbum(selectedIds, assignAlbumId)}
                >
                  Assign
                </button>
              </div>

              {/* Remove from album (only meaningful when filtering by a specific album) */}
              {isAlbumFilter && (
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => removeFromAlbum(selectedIds)}
                >
                  Remove from album
                </button>
              )}

              {/* Delete — pushed to the right */}
              <button
                className="btn btn-sm btn-error btn-outline ml-auto"
                onClick={() => deleteImages(selectedIds)}
              >
                Delete
              </button>
            </div>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <div className="flex items-center justify-center py-24">
              <span className="loading loading-spinner loading-lg opacity-30" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 rounded-full bg-base-200 p-6">
                <IconImages className="h-10 w-10 opacity-20" />
              </div>
              <p className="text-sm opacity-40">
                {isAlbumFilter
                  ? "No images in this album yet. Select images and use \"Add to album\"."
                  : "No images yet. Upload some from the home page."}
              </p>
            </div>
          )}

          {/* Image grid */}
          {!isLoading && images.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {images.map((image) => {
                const isSelected = selectedIds.has(image.id);
                return (
                  <button
                    key={image.id}
                    className={[
                      "group relative aspect-[2/3] cursor-pointer overflow-hidden rounded-lg",
                      "transition-all duration-150 focus:outline-none",
                      "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      isSelected
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100"
                        : "",
                    ].join(" ")}
                    onClick={() => toggleImage(image.id)}
                    aria-label={`${isSelected ? "Deselect" : "Select"} ${image.original_filename ?? "image"}`}
                    aria-pressed={isSelected}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.original_filename ?? "Gallery image"}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />

                    {/* Checkbox overlay — always visible in select mode or on hover */}
                    <div
                      className={[
                        "absolute inset-0 flex items-start justify-start bg-black/25 p-2",
                        "transition-opacity duration-150",
                        isSelected || hasSelection
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all",
                          isSelected
                            ? "border-primary bg-primary shadow-md"
                            : "border-white bg-white/30",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <IconCheck className="h-3 w-3 text-primary-content" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
