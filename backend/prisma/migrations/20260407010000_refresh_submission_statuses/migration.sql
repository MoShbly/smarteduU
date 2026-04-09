ALTER TYPE "SubmissionStatus" RENAME TO "SubmissionStatus_old";

CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'submitted', 'graded');

ALTER TABLE "submissions"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "SubmissionStatus"
  USING (
    CASE
      WHEN "status"::text = 'reviewed' THEN 'graded'
      WHEN "status"::text = 'returned' THEN 'pending'
      WHEN "status"::text = 'submitted' THEN 'submitted'
      ELSE 'pending'
    END
  )::"SubmissionStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending';

DROP TYPE "SubmissionStatus_old";
