ALTER TABLE "submissions"
  ADD COLUMN "attachment_path" TEXT,
  ADD COLUMN "attachment_name" TEXT,
  ADD COLUMN "attachment_mime_type" TEXT,
  ADD COLUMN "attachment_size" INTEGER;
