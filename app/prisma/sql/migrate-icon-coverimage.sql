-- One-shot data migration: rows where Achievement.coverImage was used as a
-- URL (http(s)://...) move to the new imageUrl column; coverImage becomes
-- strictly the FontAwesome icon key.
UPDATE "Achievement"
SET "imageUrl" = "coverImage",
    "coverImage" = NULL
WHERE "coverImage" LIKE 'http%';
