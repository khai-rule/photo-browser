-- Add width and height columns to images table for aspect-ratio-aware rendering.
-- Nullable: existing rows will be backfilled lazily client-side on first image load.

ALTER TABLE images
  ADD COLUMN IF NOT EXISTS width  INTEGER,
  ADD COLUMN IF NOT EXISTS height INTEGER;
