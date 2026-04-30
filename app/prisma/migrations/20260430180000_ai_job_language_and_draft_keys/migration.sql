-- AlterTable
ALTER TABLE "AiCodeImproveJob" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'python';

CREATE INDEX "AiCodeImproveJob_userId_taskId_language_status_idx" ON "AiCodeImproveJob" ("userId", "taskId", "language", "status");
