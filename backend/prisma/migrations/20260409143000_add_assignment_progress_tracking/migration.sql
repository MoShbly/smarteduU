DO $$
BEGIN
  ALTER TYPE "SubmissionStatus" ADD VALUE IF NOT EXISTS 'draft';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TYPE "AssignmentProgressState" AS ENUM (
  'not_started',
  'viewed',
  'started',
  'draft_saved',
  'submitted',
  'reviewed'
);

CREATE TABLE "assignment_progress" (
  "id" UUID NOT NULL,
  "assignment_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "state" "AssignmentProgressState" NOT NULL DEFAULT 'not_started',
  "progress_percent" INTEGER NOT NULL DEFAULT 0,
  "viewed_at" TIMESTAMP(3),
  "started_at" TIMESTAMP(3),
  "draft_saved_at" TIMESTAMP(3),
  "submitted_at" TIMESTAMP(3),
  "reviewed_at" TIMESTAMP(3),
  "last_interaction_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "assignment_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "assignment_progress_assignment_id_student_id_key"
  ON "assignment_progress"("assignment_id", "student_id");

CREATE INDEX "assignment_progress_student_id_idx"
  ON "assignment_progress"("student_id");

ALTER TABLE "assignment_progress"
  ADD CONSTRAINT "assignment_progress_assignment_id_fkey"
  FOREIGN KEY ("assignment_id") REFERENCES "assignments"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "assignment_progress"
  ADD CONSTRAINT "assignment_progress_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "users"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
