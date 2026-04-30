-- CreateEnum
CREATE TYPE "AiCodeImproveJobStatus" AS ENUM ('QUEUED', 'STREAMING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL DEFAULT '',
    "tierLevel" INTEGER NOT NULL,
    "xpBonusPercent" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefaultFree" BOOLEAN NOT NULL DEFAULT false,
    "maxActiveCourses" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_slug_key" ON "Plan"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_tierLevel_key" ON "Plan"("tierLevel");

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "planId" TEXT;

-- CreateIndex
CREATE INDEX "User_planId_idx" ON "User"("planId");

-- AlterTable Course
ALTER TABLE "Course" ADD COLUMN "tierRequired" INTEGER NOT NULL DEFAULT 0;

-- AlterTable CourseTask
ALTER TABLE "CourseTask" ADD COLUMN "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "minPlanTier" INTEGER NOT NULL DEFAULT 1;

-- CreateTable AiCodeImproveJob
CREATE TABLE "AiCodeImproveJob" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "idempotencyFingerprint" TEXT NOT NULL,
    "status" "AiCodeImproveJobStatus" NOT NULL DEFAULT 'QUEUED',
    "errorCode" TEXT,
    "improvedCode" TEXT NOT NULL DEFAULT '',
    "explanationMarkdown" TEXT NOT NULL DEFAULT '',
    "openaiModelUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "AiCodeImproveJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiCodeImproveJob_userId_createdAt_idx" ON "AiCodeImproveJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiCodeImproveJob_taskId_idx" ON "AiCodeImproveJob"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "AiCodeImproveJob_userId_idempotencyFingerprint_key" ON "AiCodeImproveJob"("userId", "idempotencyFingerprint");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AiCodeImproveJob" ADD CONSTRAINT "AiCodeImproveJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiCodeImproveJob" ADD CONSTRAINT "AiCodeImproveJob_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CourseTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AiCodeImproveJob" ADD CONSTRAINT "AiCodeImproveJob_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
